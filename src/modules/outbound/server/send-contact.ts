import type { ContactChannel } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { seedContactFollowUpTask } from "@/modules/tasks/server/autogen";

import {
  dispatchProviderSend,
  type ProviderChannel,
  type ProviderSendResult,
} from "./providers";
import type { ActorContext } from "./log-contact";

export interface SendContactInput {
  channel: ProviderChannel; // SMS | EMAIL — call is manual-only for now
  to?: string | null; // falls back to claimant phone/email when omitted
  subject?: string | null;
  body: string;
  claimantId?: string | null;
}

export type SendContactResult =
  | { notFound: true }
  | { forbidden: true }
  | { missingRecipient: true; channel: ProviderChannel }
  | {
      contactLog: Awaited<ReturnType<typeof prisma.contactLog.create>>;
      send: ProviderSendResult;
      followUpTaskCreated: boolean;
    };

async function loadClaim(claimId: string) {
  return prisma.claim.findUnique({
    where: { id: claimId },
    select: {
      id: true,
      userId: true,
      assigneeId: true,
      claimantId: true,
      claimant: {
        select: { id: true, phone: true, altPhone: true, email: true },
      },
    },
  });
}

function canAct(
  claim: { userId: string | null; assigneeId: string | null },
  actor: ActorContext,
): boolean {
  if (actor.role === "admin") return true;
  if (claim.userId === actor.userId) return true;
  if (claim.assigneeId === actor.userId) return true;
  return false;
}

function resolveRecipient(
  channel: ProviderChannel,
  input: SendContactInput,
  claimant: { phone: string | null; altPhone: string | null; email: string | null } | null,
): string | null {
  const explicit = input.to?.trim();
  if (explicit) return explicit;
  if (channel === "SMS") {
    return claimant?.phone || claimant?.altPhone || null;
  }
  return claimant?.email || null;
}

function mapStatus(result: ProviderSendResult): string {
  switch (result.status) {
    case "sent":
      return result.providerStatus ?? "sent";
    case "failed":
      return "failed";
    case "dry_run":
      return "dry_run";
  }
}

function buildNotes(input: SendContactInput, result: ProviderSendResult): string {
  const body = input.body.trim();
  const header =
    input.channel === "EMAIL" && input.subject?.trim()
      ? `Subject: ${input.subject.trim()}\n`
      : "";
  const footer =
    result.status === "dry_run"
      ? "\n\n[dry-run: provider not configured; no external send made]"
      : result.status === "failed"
        ? `\n\n[send failed: ${result.providerStatus ?? "unknown"}${
            result.error ? ` — ${result.error}` : ""
          }]`
        : "";
  return `${header}${body}${footer}`.slice(0, 2000);
}

const FAILED_PROVIDER_STATUSES = new Set([
  "failed",
  "undelivered",
  "invalid_number",
  "bounced",
]);

function providerOutcomeIsFailure(result: ProviderSendResult): boolean {
  if (result.status === "failed") return true;
  if (result.status === "dry_run") return false;
  const status = result.providerStatus?.toLowerCase() ?? "";
  return FAILED_PROVIDER_STATUSES.has(status);
}

/**
 * Attempt a real outbound send (SMS/email) and persist a ContactLog. The log
 * is written both before and after the provider call so nothing silently
 * vanishes if the network or the provider misbehaves.
 *
 *   1. Insert a "queued" log up-front — this is the audit anchor. If the DB
 *      write fails, bail early; the operator sees an error instead of sending
 *      an untracked message.
 *   2. Call the provider. We never throw from here: the dispatcher always
 *      returns a normalized result ({sent, failed, dry_run}).
 *   3. Update the log with the final status + provider id, best-effort.
 *      If this second write fails we still have the queued anchor and a
 *      Sentry/console trail.
 *   4. Seed a follow-up task when the attempt didn't land.
 */
export async function sendContact(
  claimId: string,
  input: SendContactInput,
  actor: ActorContext,
): Promise<SendContactResult> {
  const claim = await loadClaim(claimId);
  if (!claim) return { notFound: true };
  if (!canAct(claim, actor)) return { forbidden: true };

  const to = resolveRecipient(input.channel, input, claim.claimant);
  if (!to) {
    return { missingRecipient: true, channel: input.channel };
  }

  const channel = input.channel as ContactChannel;

  const initialLog = await prisma.contactLog.create({
    data: {
      claimId,
      userId: actor.userId,
      claimantId: input.claimantId ?? claim.claimantId,
      channel,
      direction: "outbound",
      status: "queued",
      notes: buildNotes(input, {
        status: "dry_run",
        externalId: null,
        providerStatus: null,
        error: null,
      }).replace(/\n\n\[dry-run.*$/, ""),
    },
  });

  const send = await dispatchProviderSend(input.channel, {
    to,
    subject: input.subject ?? undefined,
    body: input.body,
  });

  const finalStatus = mapStatus(send);
  const notes = buildNotes(input, send);

  let contactLog = initialLog;
  try {
    contactLog = await prisma.contactLog.update({
      where: { id: initialLog.id },
      data: {
        status: finalStatus,
        externalId: send.externalId,
        notes,
      },
    });
  } catch (e) {
    // The send happened; the audit anchor already exists. Log it loud and
    // let the caller see the provider result — this is exactly the case the
    // "queued" anchor was designed to survive.
    console.error(
      "[contact-send] post-send log update failed",
      initialLog.id,
      e,
    );
  }

  let followUpTaskCreated = false;
  if (providerOutcomeIsFailure(send)) {
    try {
      followUpTaskCreated = await seedContactFollowUpTask({
        contactLogId: contactLog.id,
        claimId,
        channel,
        assigneeId: claim.assigneeId ?? claim.userId ?? actor.userId,
      });
    } catch (e) {
      console.error(
        "[contact-send] seedContactFollowUpTask failed",
        contactLog.id,
        e,
      );
    }
  }

  return { contactLog, send, followUpTaskCreated };
}
