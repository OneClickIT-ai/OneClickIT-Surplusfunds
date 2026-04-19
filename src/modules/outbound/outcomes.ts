import type { ContactChannel } from "@prisma/client";

export type ContactOutcome = "succeeded" | "failed" | "neutral";

export interface OutcomeClassification {
  outcome: ContactOutcome;
  reason: string | null;
}

/**
 * Normalize free-text status strings (operator input + provider callbacks)
 * into a single outcome tag so downstream automation doesn't have to handle
 * every synonym. Outbound-only — inbound logs never trigger follow-ups.
 */
const FAILURE_TOKENS: Record<ContactChannel, readonly string[]> = {
  CALL: [
    "no_answer",
    "no-answer",
    "noanswer",
    "voicemail",
    "vm",
    "busy",
    "failed",
    "disconnected",
    "wrong_number",
    "wrong-number",
    "unreachable",
  ],
  SMS: [
    "undelivered",
    "undeliverable",
    "failed",
    "bounced",
    "bounce",
    "rejected",
    "invalid",
  ],
  EMAIL: [
    "bounced",
    "bounce",
    "hard_bounce",
    "soft_bounce",
    "failed",
    "rejected",
    "spam",
    "undeliverable",
    "invalid",
  ],
  MAIL: ["returned", "return_to_sender", "undeliverable"],
  IN_PERSON: ["no_show", "no-show", "missed"],
};

const SUCCESS_TOKENS: Record<ContactChannel, readonly string[]> = {
  CALL: ["answered", "connected", "completed", "spoke", "reached"],
  SMS: ["sent", "delivered", "replied", "received"],
  EMAIL: ["sent", "delivered", "opened", "replied"],
  MAIL: ["delivered", "signed"],
  IN_PERSON: ["met", "completed"],
};

function normalize(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, "_");
}

/**
 * Classify an outbound contact attempt. Returns:
 *   - succeeded: confirmed reach
 *   - failed:    provider/operator flagged a miss or error
 *   - neutral:   unknown / not yet classified (don't spawn automation)
 */
export function classifyContactOutcome(
  channel: ContactChannel,
  direction: string,
  status: string | null | undefined,
): OutcomeClassification {
  if (direction !== "outbound") return { outcome: "neutral", reason: null };
  if (!status || !status.trim()) return { outcome: "neutral", reason: null };

  const tag = normalize(status);
  if (FAILURE_TOKENS[channel].some((t) => tag.includes(t))) {
    return { outcome: "failed", reason: tag };
  }
  if (SUCCESS_TOKENS[channel].some((t) => tag.includes(t))) {
    return { outcome: "succeeded", reason: tag };
  }
  return { outcome: "neutral", reason: tag };
}

/**
 * Human-readable title for the follow-up task generated from a failed attempt.
 */
export function followUpTitleForFailure(
  channel: ContactChannel,
  reason: string | null,
): string {
  const base: Record<ContactChannel, string> = {
    CALL: "Retry call",
    SMS: "Retry SMS",
    EMAIL: "Retry email",
    MAIL: "Resend mailing",
    IN_PERSON: "Reschedule in-person visit",
  };
  const suffix = reason ? ` (${reason.replace(/_/g, " ")})` : "";
  return `${base[channel]}${suffix}`;
}
