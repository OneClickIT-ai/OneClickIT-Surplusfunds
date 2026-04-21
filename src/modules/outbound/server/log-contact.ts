import { prisma } from "@/lib/prisma";
import type { ContactChannel, Prisma } from "@prisma/client";

import type {
  CreateContactLogInput,
  UpdateContactLogInput,
} from "../schemas";
import { isFailedContactStatus } from "../follow-up";
import { seedContactFollowUpTask } from "@/modules/tasks/server/autogen";

export interface ActorContext {
  userId: string;
  role: string;
}

/** Reusable access check: owner, assignee, or admin may log / edit / delete. */
export async function canActOnClaim(
  claimId: string,
  actor: ActorContext,
): Promise<
  | {
      ok: true;
      claimantId: string | null;
      assigneeId: string | null;
      userId: string | null;
    }
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
    assigneeId: claim.assigneeId,
    userId: claim.userId,
  };
}

export type CreateContactLogResult =
  | { notFound: true }
  | { forbidden: true }
  | {
      contactLog: Awaited<ReturnType<typeof prisma.contactLog.create>>;
      followUpTaskCreated: boolean;
    };

/**
 * Log a contact against a case. Used by the operator-driven quick-log form
 * today; also the same entrypoint future Twilio/Resend send handlers should
 * call after a successful send, so every outbound touch is auditable.
 *
 * If the attempt status indicates failure (voicemail, no-answer, bounce, …)
 * we best-effort seed a FOLLOW_UP task so operators aren't relying on
 * memory. The task is idempotent per contact-log id.
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

  const channel = input.channel as ContactChannel;
  const contactLog = await prisma.contactLog.create({
    data: {
      claimId,
      userId: actor.userId,
      claimantId: input.claimantId ?? gate.claimantId,
      channel,
      direction: input.direction,
      status: input.status ?? null,
      notes: input.notes ?? null,
      duration: input.duration ?? null,
      externalId: input.externalId ?? null,
    },
  });

  let followUpTaskCreated = false;
  if (
    input.direction === "outbound" &&
    isFailedContactStatus(input.status ?? null)
  ) {
    try {
      followUpTaskCreated = await seedContactFollowUpTask({
        contactLogId: contactLog.id,
        claimId,
        channel,
        assigneeId: gate.assigneeId ?? gate.userId ?? actor.userId,
      });
    } catch (e) {
      // Never fail the log write because of a downstream task hiccup; the
      // log is the audit record and must always land.
      console.error(
        "[contact-log] seedContactFollowUpTask failed",
        contactLog.id,
        e,
      );
    }
  }

  return { contactLog, followUpTaskCreated };
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
