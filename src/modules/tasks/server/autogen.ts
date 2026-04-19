import { prisma } from "@/lib/prisma";
import type { ContactChannel, Task, TaskType } from "@prisma/client";

import { followUpTitleFor } from "@/modules/outbound/outcome";

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
 * When an outbound contact attempt fails (no answer, bounced, etc.), queue a
 * FOLLOW_UP task so nothing falls through the cracks. Idempotent on the
 * contact-log id, and a no-op when the claim already has an open follow-up
 * seeded from any contact attempt — operators shouldn't be buried in retries.
 */
export async function seedFailedContactFollowUpTask(
  contactLogId: string,
  claimId: string,
  channel: ContactChannel,
  assigneeId: string | null,
): Promise<Task | null> {
  const marker = `[followup:contact:${contactLogId}]`;
  if (await taskExistsWithMarker(claimId, marker)) return null;

  const openContactFollowUp = await prisma.task.findFirst({
    where: {
      claimId,
      completedAt: null,
      notes: { contains: "[followup:contact:" },
    },
    select: { id: true },
  });
  if (openContactFollowUp) return null;

  return prisma.task.create({
    data: {
      claimId,
      assigneeId,
      type: "FOLLOW_UP" as TaskType,
      title: followUpTitleFor(channel),
      dueDate: daysFromNow(1),
      priority: "high",
      notes: `Auto-created after failed ${channel} attempt. Review contact log and retry.\n${marker}`,
    },
  });
}
