import { prisma } from "@/lib/prisma";
import type { ContactChannel, TaskType } from "@prisma/client";
import { followUpTitleForAttempt } from "@/modules/outbound/failures";

/**
 * Internal helpers that seed tasks in response to workflow events.
 *
 * Design notes:
 *  - All helpers are *idempotent*: before inserting, we look for an existing
 *    task with a sentinel marker in `notes`. This keeps crons and retries
 *    safe to re-invoke.
 *  - Task.notes currently doubles as a tiny audit channel ("[event:id]"
 *    markers). When the schema grows an `eventId` / `agreementId` FK,
 *    swap the queries here without changing callers.
 */

function daysFromNow(days: number): Date {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

async function taskExistsWithMarker(
  claimId: string,
  marker: string,
): Promise<boolean> {
  const hit = await prisma.task.findFirst({
    where: { claimId, notes: { contains: marker } },
    select: { id: true },
  });
  return !!hit;
}

/**
 * Seed the default opening-task for a brand-new case: "Call claimant" in 2 days.
 */
export async function seedCaseKickoffTasks(
  claimId: string,
  assigneeId: string | null,
): Promise<void> {
  const marker = `[kickoff:${claimId}]`;
  if (await taskExistsWithMarker(claimId, marker)) return;

  await prisma.task.create({
    data: {
      claimId,
      assigneeId,
      type: "CALL" as TaskType,
      title: "Call claimant for initial contact",
      dueDate: daysFromNow(2),
      priority: "high",
      notes: `Initial outreach after case created.\n${marker}`,
    },
  });
}

/**
 * Seed a FOLLOW_UP task 5 days after an agreement is sent, so the operator
 * gets nudged if no signature comes back.
 */
export async function seedAgreementFollowUpTask(
  agreementId: string,
  claimId: string,
  assigneeId: string | null,
): Promise<boolean> {
  const marker = `[followup:agreement:${agreementId}]`;
  if (await taskExistsWithMarker(claimId, marker)) return false;

  await prisma.task.create({
    data: {
      claimId,
      assigneeId,
      type: "FOLLOW_UP" as TaskType,
      title: "Follow up on unsigned agreement",
      dueDate: daysFromNow(5),
      priority: "medium",
      notes: `Agreement sent; check status and nudge claimant if unsigned.\n${marker}`,
    },
  });
  return true;
}

/**
 * Seed a short-horizon FOLLOW_UP task after a failed outbound contact
 * attempt (voicemail, bounce, no answer, etc.). Idempotent per ContactLog
 * row so retries or Twilio/Resend webhook replays don't duplicate tasks.
 *
 * Returns the task id when a new task was created, or null when a matching
 * marker already exists.
 */
export async function seedContactFailureFollowUpTask(args: {
  claimId: string;
  contactLogId: string;
  channel: ContactChannel;
  direction: "outbound" | "inbound";
  status: string | null;
  assigneeId: string | null;
}): Promise<string | null> {
  const marker = `[followup:contact:${args.contactLogId}]`;
  if (await taskExistsWithMarker(args.claimId, marker)) return null;

  const title = followUpTitleForAttempt({
    channel: args.channel,
    direction: args.direction,
    status: args.status,
  });
  const statusLine = args.status ? ` (${args.status})` : "";

  const task = await prisma.task.create({
    data: {
      claimId: args.claimId,
      assigneeId: args.assigneeId,
      type: "FOLLOW_UP" as TaskType,
      title,
      dueDate: daysFromNow(2),
      priority: "medium",
      notes: `Auto-created from failed ${args.channel.toLowerCase()} attempt${statusLine}.\n${marker}`,
    },
    select: { id: true },
  });
  return task.id;
}
