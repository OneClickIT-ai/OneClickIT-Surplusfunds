import { prisma } from "@/lib/prisma";
import * as Sentry from "@sentry/nextjs";

import type { CreateContactLogInput } from "../schemas";
import type { ActorContext } from "./log-contact";
import { logContact } from "./log-contact";
import {
  sendEmail,
  sendSms,
  resultToLogStatus,
  type SendResult,
} from "./providers";

export interface SmsSendInput {
  body: string;
  /** Explicit override; when omitted we use the claimant's phone. */
  to?: string;
  claimantId?: string | null;
}

export interface EmailSendInput {
  subject: string;
  body: string;
  to?: string;
  replyTo?: string;
  claimantId?: string | null;
}

type AccessGate =
  | { ok: true; claim: { id: string; claimantId: string | null } }
  | { ok: false; reason: "notFound" | "forbidden" };

async function resolveSendableClaim(
  claimId: string,
  actor: ActorContext,
): Promise<AccessGate> {
  const claim = await prisma.claim.findUnique({
    where: { id: claimId },
    select: { id: true, userId: true, assigneeId: true, claimantId: true },
  });
  if (!claim) return { ok: false, reason: "notFound" };
  if (
    actor.role !== "admin" &&
    claim.userId !== actor.userId &&
    claim.assigneeId !== actor.userId
  ) {
    return { ok: false, reason: "forbidden" };
  }
  return { ok: true, claim: { id: claim.id, claimantId: claim.claimantId } };
}

export type SendOutcome =
  | { notFound: true }
  | { forbidden: true }
  | { noRecipient: true }
  | {
      sendResult: SendResult;
      contactLog: Awaited<ReturnType<typeof prisma.contactLog.create>> | null;
      followUpTaskCreated: boolean;
    };

/**
 * Persist the contact-log row with a bounded retry. Every outbound send
 * must leave an audit record — if the provider succeeded but the DB write
 * blipped, we'd otherwise double-send on the operator's next click with
 * zero trace of the first attempt. We retry a few times (linear backoff)
 * and, if we still fail, surface the exception to Sentry so it can be
 * reconciled manually from the provider's own dashboard.
 */
async function logWithRetry(
  claimId: string,
  input: CreateContactLogInput,
  actor: ActorContext,
  attempts = 3,
): Promise<Awaited<ReturnType<typeof logContact>>> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await logContact(claimId, input, actor);
    } catch (e) {
      lastErr = e;
      // Linear backoff: 100ms, 200ms, 300ms.
      await new Promise((r) => setTimeout(r, 100 * (i + 1)));
    }
  }
  Sentry.captureException(lastErr, {
    tags: { area: "outbound-send", claimId, channel: input.channel },
    extra: { note: "contact log write failed after retries" },
  });
  throw lastErr;
}

export async function sendAndLogSms(
  claimId: string,
  input: SmsSendInput,
  actor: ActorContext,
): Promise<SendOutcome> {
  const gate = await resolveSendableClaim(claimId, actor);
  if (!gate.ok) {
    return gate.reason === "notFound" ? { notFound: true } : { forbidden: true };
  }

  const claimantId = input.claimantId ?? gate.claim.claimantId;
  const to =
    input.to ??
    (claimantId
      ? (
          await prisma.claimant.findUnique({
            where: { id: claimantId },
            select: { phone: true },
          })
        )?.phone ?? null
      : null);
  if (!to) return { noRecipient: true };

  const sendResult = await sendSms({ to, body: input.body });
  const { status, externalId } = resultToLogStatus(sendResult);
  const notes = buildSmsNotes({
    to,
    body: input.body,
    result: sendResult,
  });

  try {
    const logResult = await logWithRetry(
      claimId,
      {
        channel: "SMS",
        direction: "outbound",
        status,
        notes,
        externalId,
        claimantId: claimantId ?? undefined,
      },
      actor,
    );
    if ("notFound" in logResult || "forbidden" in logResult) {
      // Access revoked between send and log. Surface the send result so the
      // operator can reconcile manually.
      return {
        sendResult,
        contactLog: null,
        followUpTaskCreated: false,
      };
    }
    return {
      sendResult,
      contactLog: logResult.contactLog,
      followUpTaskCreated: logResult.followUpTaskCreated,
    };
  } catch {
    // Send succeeded; audit write exhausted retries. Return provider result
    // so the UI can display a clear "sent but logging failed — check Sentry"
    // message.
    return {
      sendResult,
      contactLog: null,
      followUpTaskCreated: false,
    };
  }
}

export async function sendAndLogEmail(
  claimId: string,
  input: EmailSendInput,
  actor: ActorContext,
): Promise<SendOutcome> {
  const gate = await resolveSendableClaim(claimId, actor);
  if (!gate.ok) {
    return gate.reason === "notFound" ? { notFound: true } : { forbidden: true };
  }

  const claimantId = input.claimantId ?? gate.claim.claimantId;
  const to =
    input.to ??
    (claimantId
      ? (
          await prisma.claimant.findUnique({
            where: { id: claimantId },
            select: { email: true },
          })
        )?.email ?? null
      : null);
  if (!to) return { noRecipient: true };

  const sendResult = await sendEmail({
    to,
    subject: input.subject,
    body: input.body,
    replyTo: input.replyTo,
  });
  const { status, externalId } = resultToLogStatus(sendResult);
  const notes = buildEmailNotes({
    to,
    subject: input.subject,
    body: input.body,
    result: sendResult,
  });

  try {
    const logResult = await logWithRetry(
      claimId,
      {
        channel: "EMAIL",
        direction: "outbound",
        status,
        notes,
        externalId,
        claimantId: claimantId ?? undefined,
      },
      actor,
    );
    if ("notFound" in logResult || "forbidden" in logResult) {
      return { sendResult, contactLog: null, followUpTaskCreated: false };
    }
    return {
      sendResult,
      contactLog: logResult.contactLog,
      followUpTaskCreated: logResult.followUpTaskCreated,
    };
  } catch {
    return { sendResult, contactLog: null, followUpTaskCreated: false };
  }
}

export function buildSmsNotes({
  to,
  body,
  result,
}: {
  to: string;
  body: string;
  result: SendResult;
}): string {
  const header = result.ok
    ? `SMS sent to ${to}`
    : `SMS to ${to} failed: ${result.error}`;
  return `${header}\n\n${body}`;
}

export function buildEmailNotes({
  to,
  subject,
  body,
  result,
}: {
  to: string;
  subject: string;
  body: string;
  result: SendResult;
}): string {
  const header = result.ok
    ? `Email sent to ${to}`
    : `Email to ${to} failed: ${result.error}`;
  return `${header}\nSubject: ${subject}\n\n${body}`;
}
