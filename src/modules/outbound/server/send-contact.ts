import { prisma } from "@/lib/prisma";
import * as Sentry from "@sentry/nextjs";

import type { SendContactInput } from "../schemas";
import type {
  ActorContext,
  CreateContactLogResult,
} from "./log-contact";
import { canActOnClaim, logContact } from "./log-contact";
import { sendEmail, type SendEmailResult } from "./providers/resend";
import { sendSms, type SendSmsResult } from "./providers/twilio";

export type SendContactResult =
  | { notFound: true }
  | { forbidden: true }
  | { noClaimant: true }
  | { missingContact: "phone" | "email" }
  | {
      contactLog: Extract<CreateContactLogResult, { contactLog: unknown }>["contactLog"];
      sent: boolean;
      providerStatus: string;
      providerError?: string;
      followUpTaskCreated: boolean;
    };

/**
 * Dispatch a real outbound SMS or email, then write a ContactLog row no
 * matter what — success, provider error, or env-missing. Follow-up tasks
 * are auto-seeded for failed attempts via logContact(), so operators
 * always have a reason to come back to the case.
 *
 * Access is checked up-front so we never hit the provider for a claim the
 * caller doesn't own.
 */
export async function sendAndLogContact(
  claimId: string,
  input: SendContactInput,
  actor: ActorContext,
): Promise<SendContactResult> {
  const gate = await canActOnClaim(claimId, actor);
  if (!gate.ok) {
    return gate.reason === "notFound" ? { notFound: true } : { forbidden: true };
  }

  const claimantId = input.claimantId ?? gate.claimantId ?? null;
  if (!claimantId) return { noClaimant: true };

  const claimant = await prisma.claimant.findUnique({
    where: { id: claimantId },
    select: { id: true, phone: true, altPhone: true, email: true },
  });
  if (!claimant) return { noClaimant: true };

  let providerResult: SendSmsResult | SendEmailResult;

  if (input.channel === "SMS") {
    const to = (claimant.phone ?? claimant.altPhone ?? "").trim();
    if (!to) return { missingContact: "phone" };
    providerResult = await sendSms({ to, body: input.body });
  } else {
    const to = (claimant.email ?? "").trim();
    if (!to) return { missingContact: "email" };
    providerResult = await sendEmail({
      to,
      subject: input.subject ?? "Message regarding your surplus claim",
      body: input.body,
    });
  }

  const status = providerResult.providerStatus;
  const notes = buildNotes(input, providerResult);

  const logResult = await logContact(
    claimId,
    {
      channel: input.channel,
      direction: "outbound",
      status,
      notes,
      claimantId: claimant.id,
      externalId: providerResult.ok ? providerResult.externalId : null,
    },
    actor,
  );

  if ("notFound" in logResult) return { notFound: true };
  if ("forbidden" in logResult) return { forbidden: true };

  if (!providerResult.ok) {
    // Capture so we know when the provider is failing in prod; logging
    // succeeds regardless so the operator still sees the attempt.
    Sentry.captureMessage(
      `[outbound] ${input.channel} send failed: ${providerResult.error}`,
      { level: "warning" },
    );
  }

  return {
    contactLog: logResult.contactLog,
    sent: providerResult.ok,
    providerStatus: providerResult.providerStatus,
    providerError: providerResult.ok ? undefined : providerResult.error,
    followUpTaskCreated: logResult.followUpTaskCreated,
  };
}

function buildNotes(
  input: SendContactInput,
  result: SendSmsResult | SendEmailResult,
): string {
  const header =
    input.channel === "EMAIL" && input.subject
      ? `Subject: ${input.subject}\n\n`
      : "";
  const footer = result.ok
    ? ""
    : `\n\n[send failed: ${result.error}]`;
  return `${header}${input.body}${footer}`.slice(0, 2000);
}
