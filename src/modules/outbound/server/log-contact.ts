import { prisma } from "@/lib/prisma";
import type { ContactChannel, Prisma } from "@prisma/client";

import { seedContactFollowUpTask } from "@/modules/tasks/server/autogen";

import type {
  CreateContactLogInput,
  UpdateContactLogInput,
} from "../schemas";
import { shouldScheduleFollowUp } from "./follow-up";

export interface ActorContext {
  userId: string;
  role: string;
}

/** Reusable access check: owner, assignee, or admin may log / edit / delete. */
async function canActOnClaim(
  claimId: string,
  actor: ActorContext,
): Promise<
  | { ok: true; claimantId: string | null; userId: string | null; assigneeId: string | null }
  | { ok: false; reason: "notFound" | "forbidden" }
> {
  const claim = await prisma.claim.findUnique({
    where: { id: claimId },
    select: { userId: true, assigneeId: true, claimantId: true },
  });
  if (!claim) return { ok: false, reason: "notFound" };
  if (
    actor.role !== "admin" &&
    claim.userId !== actor.userId &&
    claim.assigneeId !== actor.userId
  ) {
    return { ok: false, reason: "forbidden" };
  }
  return {
    ok: true,
    claimantId: claim.claimantId,
    userId: claim.userId,
    assigneeId: claim.assigneeId,
  };
}

export type CreateContactLogResult =
  | { notFound: true }
  | { forbidden: true }
  | {
      contactLog: Awaited<ReturnType<typeof prisma.contactLog.create>>;
      followUpCreated: boolean;
    };

/**
 * Log a contact against a case. Used by the operator-driven quick-log form
 * today; also the same entrypoint future Twilio/Resend send handlers should
 * call after a successful send, so every outbound touch is auditable.
 */
export async function logContact(
  claimId: string,
  input: CreateContactLogInput,
  actor: ActorContext,
): Promise<CreateContactLogResult> {
  const gate = await canActOnClaim(claimId, actor);
  if (!gate.ok) {
    return gate.reason === "notFound" ? { notFound: true } : { forbidden: true };
  }

  const contactLog = await prisma.contactLog.create({
    data: {
      claimId,
      userId: actor.userId,
      claimantId: input.claimantId ?? gate.claimantId,
      channel: input.channel as ContactChannel,
      direction: input.direction,
      status: input.status ?? null,
      notes: input.notes ?? null,
      duration: input.duration ?? null,
      externalId: input.externalId ?? null,
    },
  });

  // Auto-seed a retry task when the outbound attempt failed to reach the
  // claimant (voicemail, bounce, no-answer, ...). Best-effort: the contact
  // log is the authoritative record, so never fail the outer call if task
  // insert hiccups.
  let followUpCreated = false;
  if (
    input.direction === "outbound" &&
    shouldScheduleFollowUp(input.status ?? null)
  ) {
    try {
      followUpCreated = await seedContactFollowUpTask({
        claimId,
        assigneeId: gate.assigneeId ?? gate.userId ?? actor.userId,
        contactLogId: contactLog.id,
        channel: contactLog.channel,
        status: contactLog.status ?? null,
      });
    } catch (e) {
      console.error("[contact-log] seedContactFollowUpTask failed", contactLog.id, e);
    }
  }

  return { contactLog, followUpCreated };
}

export async function listContactLogsForClaim(
  claimId: string,
  actor: ActorContext,
): Promise<
  | { notFound: true }
  | { forbidden: true }
  | { items: Awaited<ReturnType<typeof prisma.contactLog.findMany>> }
> {
  const gate = await canActOnClaim(claimId, actor);
  if (!gate.ok) {
    return gate.reason === "notFound" ? { notFound: true } : { forbidden: true };
  }
  const items = await prisma.contactLog.findMany({
    where: { claimId },
    orderBy: { createdAt: "desc" },
  });
  return { items };
}

export type UpdateContactLogResult =
  | { notFound: true }
  | { forbidden: true }
  | { contactLog: Awaited<ReturnType<typeof prisma.contactLog.update>> };

export async function updateContactLog(
  id: string,
  input: UpdateContactLogInput,
  actor: ActorContext,
): Promise<UpdateContactLogResult> {
  const existing = await prisma.contactLog.findUnique({
    where: { id },
    select: { id: true, claimId: true, userId: true },
  });
  if (!existing) return { notFound: true };
  if (!existing.claimId) return { forbidden: true };

  const gate = await canActOnClaim(existing.claimId, actor);
  if (!gate.ok) {
    return gate.reason === "notFound" ? { notFound: true } : { forbidden: true };
  }
  // Additional rule: only the user who logged it (or admin) can edit/delete.
  if (actor.role !== "admin" && existing.userId !== actor.userId) {
    return { forbidden: true };
  }

  const data: Prisma.ContactLogUpdateInput = {
    ...(input.status !== undefined ? { status: input.status } : {}),
    ...(input.notes !== undefined ? { notes: input.notes } : {}),
    ...(input.duration !== undefined ? { duration: input.duration } : {}),
  };
  const contactLog = await prisma.contactLog.update({
    where: { id },
    data,
  });
  return { contactLog };
}

export type DeleteContactLogResult =
  | { notFound: true }
  | { forbidden: true }
  | { deleted: true };

export async function deleteContactLog(
  id: string,
  actor: ActorContext,
): Promise<DeleteContactLogResult> {
  const existing = await prisma.contactLog.findUnique({
    where: { id },
    select: { id: true, claimId: true, userId: true },
  });
  if (!existing) return { notFound: true };
  if (!existing.claimId) return { forbidden: true };

  const gate = await canActOnClaim(existing.claimId, actor);
  if (!gate.ok) {
    return gate.reason === "notFound" ? { notFound: true } : { forbidden: true };
  }
  if (actor.role !== "admin" && existing.userId !== actor.userId) {
    return { forbidden: true };
  }

  await prisma.contactLog.delete({ where: { id } });
  return { deleted: true };
}
