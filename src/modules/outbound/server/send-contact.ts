import { prisma } from "@/lib/prisma";
import type { ContactChannel, Prisma } from "@prisma/client";
import * as Sentry from "@sentry/nextjs";

import { seedFailedContactFollowUpTask } from "@/modules/tasks/server/autogen";
import type { SendContactInput } from "../schemas";
import { sendSms } from "./providers/twilio";
import { sendEmail } from "./providers/resend";
import type { SendResult } from "./providers/types";

export interface ActorContext {
  userId: string;
  role: string;
}

export type SendContactResult =
  | { notFound: true }
  | { forbidden: true }
  | { missingRecipient: true; channel: "SMS" | "EMAIL" }
  | {
      ok: true;
      contactLog: Awaited<ReturnType<typeof prisma.contactLog.create>>;
      send: SendResult;
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
        select: { id: true, phone: true, altPhone: true, email: true, fullName: true },
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

/**
 * Write a ContactLog row with a tiny retry loop. The provider request has
 * already succeeded (or failed) by the time we write — we never want an
 * outbound SMS/email to be un-logged because the DB blinked.
 */
async function writeContactLog(
  data: Prisma.ContactLogUncheckedCreateInput,
  context: { claimId: string; externalId: string | null },
) {
  let lastErr: unknown;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await prisma.contactLog.create({ data });
    } catch (e) {
      lastErr = e;
      await new Promise((r) => setTimeout(r, 50 * (attempt + 1)));
    }
  }
  Sentry.captureException(lastErr, {
    level: "error",
    extra: {
      where: "outbound.sendContact.writeContactLog",
      claimId: context.claimId,
      externalId: context.externalId,
    },
  });
  throw lastErr;
}

/**
 * Resolve the recipient for a given channel, preferring an explicit `to`
 * override, then the claimant record. Returns null if no usable recipient.
 */
function resolveRecipient(
  channel: "SMS" | "EMAIL",
  input: SendContactInput,
  claimant: { phone: string | null; altPhone: string | null; email: string | null } | null,
): string | null {
  const direct = input.to?.trim();
  if (direct) return direct;
  if (!claimant) return null;
  if (channel === "SMS") return claimant.phone ?? claimant.altPhone ?? null;
  return claimant.email ?? null;
}

/**
 * Send an outbound SMS or email against a case, persist a ContactLog row for
 * the attempt (success OR failure), and auto-seed a follow-up task when the
 * provider fails. Every path writes exactly one audit row so the case
 * timeline reflects what actually happened.
 */
export async function sendContact(
  claimId: string,
  input: SendContactInput,
  actor: ActorContext,
): Promise<SendContactResult> {
  const claim = await loadClaim(claimId);
  if (!claim) return { notFound: true };
  if (!canAct(claim, actor)) return { forbidden: true };

  const recipient = resolveRecipient(input.channel, input, claim.claimant);
  if (!recipient) return { missingRecipient: true, channel: input.channel };

  const send: SendResult =
    input.channel === "SMS"
      ? await sendSms({ to: recipient, body: input.body })
      : await sendEmail({
          to: recipient,
          subject: input.subject ?? "",
          body: input.body,
        });

  const statusLabel = send.ok
    ? `sent:${send.providerStatus}`
    : `failed:${send.reason}`;

  // Compose audit notes: the operator's note (if any) + the message body.
  // Keeps the timeline readable without bloating the row.
  const auditNotes = [
    input.notes?.trim(),
    input.channel === "EMAIL" && input.subject
      ? `Subject: ${input.subject.trim()}`
      : null,
    input.body.length > 500 ? `${input.body.slice(0, 500)}…` : input.body,
    send.ok ? null : `Error: ${send.message}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  const contactLog = await writeContactLog(
    {
      claimId,
      userId: actor.userId,
      claimantId: claim.claimantId,
      channel: input.channel as ContactChannel,
      direction: "outbound",
      status: statusLabel,
      notes: auditNotes || null,
      externalId: send.ok ? send.externalId : null,
    },
    { claimId, externalId: send.ok ? send.externalId : null },
  );

  let followUpTaskCreated = false;
  if (!send.ok) {
    try {
      followUpTaskCreated = await seedFailedContactFollowUpTask({
        claimId,
        assigneeId: claim.assigneeId ?? claim.userId ?? actor.userId,
        contactLogId: contactLog.id,
        channel: input.channel,
        reason: send.reason,
      });
    } catch (e) {
      // Don't fail the whole request if task seeding trips — the audit row
      // is already saved and the operator can see the failure in the UI.
      Sentry.captureException(e, {
        level: "warning",
        extra: { where: "outbound.sendContact.followUp", claimId, contactLogId: contactLog.id },
      });
    }
  }

  return { ok: true, contactLog, send, followUpTaskCreated };
}
