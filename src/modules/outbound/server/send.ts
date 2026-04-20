import { prisma } from "@/lib/prisma";
import * as Sentry from "@sentry/nextjs";

import type { ContactChannel, Prisma } from "@prisma/client";

import { isFailedContactStatus } from "../follow-up";
import type { SendOutboundInput } from "../schemas";
import { seedContactFollowUpTask } from "@/modules/tasks/server/autogen";
import { canActOnClaim, type ActorContext } from "./log-contact";
import { sendTwilioSms } from "./providers/twilio";
import { sendResendEmail } from "./providers/resend";
import { ProviderConfigError, type OutboundResult } from "./providers/types";

export type SendOutboundResult =
  | { notFound: true }
  | { forbidden: true }
  | { missingRecipient: true; channel: ContactChannel }
  | { providerNotConfigured: true; provider: "twilio" | "resend"; reason: string }
  | {
      contactLog: Awaited<ReturnType<typeof prisma.contactLog.create>>;
      providerResult: OutboundResult;
      followUpTaskCreated: boolean;
    };

interface ClaimantContact {
  id: string | null;
  fullName: string | null;
  phone: string | null;
  email: string | null;
}

async function loadClaimant(
  claimantId: string | null,
): Promise<ClaimantContact | null> {
  if (!claimantId) return null;
  const c = await prisma.claimant.findUnique({
    where: { id: claimantId },
    select: { id: true, fullName: true, phone: true, email: true },
  });
  return c
    ? { id: c.id, fullName: c.fullName ?? null, phone: c.phone, email: c.email }
    : null;
}

/**
 * Persist a ContactLog with one short retry on transient DB errors. The
 * provider call has already happened by this point — losing the log row
 * would mean an undocumented outbound, so we try twice before giving up.
 */
async function writeContactLogWithRetry(
  data: Prisma.ContactLogUncheckedCreateInput,
): Promise<Awaited<ReturnType<typeof prisma.contactLog.create>>> {
  try {
    return await prisma.contactLog.create({ data });
  } catch (err) {
    Sentry.captureException(err, {
      tags: { area: "contact-log", phase: "write-retry" },
    });
    // Brief backoff before a single retry; if this also fails we surface to
    // the caller so the operator sees the error and can manually re-log.
    await new Promise((r) => setTimeout(r, 250));
    return prisma.contactLog.create({ data });
  }
}

function buildNotes(input: SendOutboundInput, result: OutboundResult): string {
  const parts: string[] = [];
  if (input.channel === "EMAIL" && input.subject) {
    parts.push(`Subject: ${input.subject}`);
  }
  parts.push(input.body);
  if (input.notes) {
    parts.push(`---\n${input.notes}`);
  }
  if (!result.ok && result.errorMessage) {
    const code = result.errorCode ? ` [${result.errorCode}]` : "";
    parts.push(`Send error${code}: ${result.errorMessage}`);
  }
  return parts.join("\n\n");
}

/**
 * Operator-driven outbound send: hits Twilio/Resend, then persists a
 * ContactLog row regardless of provider success. On a failed send (or any
 * status that maps to a failure token) we seed a follow-up task on the same
 * idempotent path the manual quick-log uses, so the audit chain matches.
 */
export async function sendOutbound(
  claimId: string,
  input: SendOutboundInput,
  actor: ActorContext,
): Promise<SendOutboundResult> {
  const gate = await canActOnClaim(claimId, actor);
  if (!gate.ok) {
    return gate.reason === "notFound" ? { notFound: true } : { forbidden: true };
  }

  const explicitClaimantId = input.claimantId ?? gate.claimantId;
  const claimant = await loadClaimant(explicitClaimantId ?? null);

  const fallback =
    input.channel === "SMS"
      ? claimant?.phone ?? null
      : claimant?.email ?? null;
  const recipient = (input.to ?? fallback ?? "").trim();
  if (!recipient) {
    return { missingRecipient: true, channel: input.channel as ContactChannel };
  }

  let providerResult: OutboundResult;
  try {
    if (input.channel === "SMS") {
      providerResult = await sendTwilioSms({ to: recipient, body: input.body });
    } else {
      providerResult = await sendResendEmail({
        to: recipient,
        subject: input.subject ?? "Message from your case agent",
        text: input.body,
      });
    }
  } catch (err) {
    if (err instanceof ProviderConfigError) {
      return {
        providerNotConfigured: true,
        provider: input.channel === "SMS" ? "twilio" : "resend",
        reason: err.message,
      };
    }
    // Unknown provider exception — record as a failed attempt so the operator
    // still sees it on the timeline, then keep going to log + follow-up.
    Sentry.captureException(err, {
      tags: { area: "outbound", channel: input.channel },
    });
    providerResult = {
      ok: false,
      status: "failed",
      externalId: null,
      errorCode: "exception",
      errorMessage: err instanceof Error ? err.message : String(err),
    };
  }

  const channel = input.channel as ContactChannel;
  const contactLog = await writeContactLogWithRetry({
    claimId,
    userId: actor.userId,
    claimantId: explicitClaimantId ?? null,
    channel,
    direction: "outbound",
    status: providerResult.status,
    notes: buildNotes(input, providerResult),
    duration: null,
    externalId: providerResult.externalId,
  });

  let followUpTaskCreated = false;
  if (isFailedContactStatus(providerResult.status)) {
    try {
      followUpTaskCreated = await seedContactFollowUpTask({
        contactLogId: contactLog.id,
        claimId,
        channel,
        assigneeId: gate.assigneeId ?? gate.userId ?? actor.userId,
      });
    } catch (e) {
      // Same policy as logContact: never fail the audit write because of a
      // downstream task hiccup.
      Sentry.captureException(e, {
        tags: { area: "outbound", phase: "followup-seed" },
      });
    }
  }

  return { contactLog, providerResult, followUpTaskCreated };
}
