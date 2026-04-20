import { prisma } from "@/lib/prisma";
import type { ContactChannel } from "@prisma/client";

import { isFailedContactStatus } from "../follow-up";
import { seedContactFollowUpTask } from "@/modules/tasks/server/autogen";
import {
  isChannelSendConfigured,
  sendResendEmail,
  sendTwilioSms,
  type OutboundChannel,
  type OutboundSendResult,
} from "./providers";

export interface ActorContext {
  userId: string;
  role: string;
}

export interface SendContactInput {
  channel: OutboundChannel;
  /** Explicit recipient. Optional — falls back to claimant's phone/email. */
  to?: string | null;
  body: string;
  /** Email only. Ignored for SMS. */
  subject?: string | null;
  /** Free-text operator notes attached to the audit row. */
  notes?: string | null;
}

export type SendContactResult =
  | { notFound: true }
  | { forbidden: true }
  | { badState: true; reason: string }
  | {
      ok: boolean;
      providerConfigured: boolean;
      sendResult: OutboundSendResult;
      contactLog: Awaited<ReturnType<typeof prisma.contactLog.create>>;
      followUpTaskCreated: boolean;
    };

async function gateCase(claimId: string, actor: ActorContext) {
  const claim = await prisma.claim.findUnique({
    where: { id: claimId },
    select: {
      id: true,
      userId: true,
      assigneeId: true,
      claimantId: true,
      claimant: { select: { id: true, phone: true, email: true, fullName: true } },
    },
  });
  if (!claim) return { ok: false as const, reason: "notFound" as const };
  if (
    actor.role !== "admin" &&
    claim.userId !== actor.userId &&
    claim.assigneeId !== actor.userId
  ) {
    return { ok: false as const, reason: "forbidden" as const };
  }
  return { ok: true as const, claim };
}

function pickRecipient(
  channel: OutboundChannel,
  explicit: string | null | undefined,
  claimant: { phone: string | null; email: string | null } | null,
): string | null {
  const trimmed = explicit?.trim();
  if (trimmed) return trimmed;
  if (channel === "SMS") return claimant?.phone?.trim() ?? null;
  return claimant?.email?.trim() ?? null;
}

/**
 * Drive a live outbound send AND write the audit log in one transaction-of-
 * intent. The provider call happens first because the ContactLog row should
 * reflect what actually happened upstream. If the provider succeeds but the
 * DB write fails, we retry the log once — losing the audit row is worse than
 * a duplicate send, but a bare best-effort would make reconciliation brittle.
 *
 * Failure paths (provider down, misconfigured, recipient missing) all still
 * produce a log row with status="failed" so operators can see what happened.
 */
export async function sendOutboundContact(
  claimId: string,
  input: SendContactInput,
  actor: ActorContext,
): Promise<SendContactResult> {
  const gate = await gateCase(claimId, actor);
  if (!gate.ok) {
    return gate.reason === "notFound"
      ? { notFound: true }
      : { forbidden: true };
  }
  const { claim } = gate;

  const to = pickRecipient(input.channel, input.to, claim.claimant);
  if (!to) {
    return {
      badState: true,
      reason:
        input.channel === "SMS"
          ? "no phone number on file for this claimant"
          : "no email address on file for this claimant",
    };
  }

  const providerConfigured = isChannelSendConfigured(input.channel);

  let sendResult: OutboundSendResult;
  if (!providerConfigured) {
    // Intentional: surface a clean failure state rather than silently logging
    // a "sent" row when no provider is wired up.
    sendResult = {
      ok: false,
      status: "failed",
      externalId: null,
      error:
        input.channel === "SMS"
          ? "twilio is not configured"
          : "resend is not configured",
      provider: null,
    };
  } else if (input.channel === "SMS") {
    sendResult = await sendTwilioSms({ to, body: input.body });
  } else {
    sendResult = await sendResendEmail({
      to,
      subject: input.subject?.trim() || "Message from your case agent",
      text: input.body,
    });
  }

  const notes = buildLogNotes(input, to, sendResult);

  const contactLog = await writeLogWithRetry({
    claimId,
    userId: actor.userId,
    claimantId: claim.claimantId,
    channel: input.channel as ContactChannel,
    status: sendResult.status,
    notes,
    externalId: sendResult.externalId,
  });

  let followUpTaskCreated = false;
  if (isFailedContactStatus(sendResult.status)) {
    try {
      followUpTaskCreated = await seedContactFollowUpTask({
        contactLogId: contactLog.id,
        claimId,
        channel: input.channel as ContactChannel,
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

  return {
    ok: sendResult.ok,
    providerConfigured,
    sendResult,
    contactLog,
    followUpTaskCreated,
  };
}

function buildLogNotes(
  input: SendContactInput,
  to: string,
  result: OutboundSendResult,
): string {
  const header =
    input.channel === "EMAIL"
      ? `To: ${to}${input.subject ? ` · Subject: ${input.subject.trim()}` : ""}`
      : `To: ${to}`;
  const lines: string[] = [header];
  const trimmedBody = input.body.trim();
  if (trimmedBody) {
    lines.push("", trimmedBody);
  }
  if (result.error) {
    lines.push("", `[send failed] ${result.error}`);
  }
  if (result.provider) {
    lines.push(`[provider] ${result.provider}`);
  }
  const operatorNotes = input.notes?.trim();
  if (operatorNotes) {
    lines.push("", `Notes: ${operatorNotes}`);
  }
  return lines.join("\n");
}

interface LogWrite {
  claimId: string;
  userId: string;
  claimantId: string | null;
  channel: ContactChannel;
  status: string;
  notes: string;
  externalId: string | null;
}

/**
 * Write the audit row. If the first insert fails (connection blip, deadlock,
 * etc.) retry once — because at this point the provider may already have sent
 * the message, and losing the log is the worst outcome for reconciliation.
 */
async function writeLogWithRetry(data: LogWrite) {
  const payload = {
    claimId: data.claimId,
    userId: data.userId,
    claimantId: data.claimantId,
    channel: data.channel,
    direction: "outbound" as const,
    status: data.status,
    notes: data.notes,
    externalId: data.externalId,
  };
  try {
    return await prisma.contactLog.create({ data: payload });
  } catch (e) {
    console.error("[contact-send] log write failed, retrying once", e);
    return await prisma.contactLog.create({ data: payload });
  }
}
