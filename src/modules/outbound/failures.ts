import type { ContactChannel } from "@prisma/client";

/**
 * Pure classifier for whether a contact attempt should trigger an auto
 * follow-up task. Kept dependency-free so it's easy to unit test and to
 * share with future Twilio/Resend webhook handlers that report delivery
 * state asynchronously.
 *
 * Heuristics:
 *  - Inbound attempts never auto-follow-up; the operator is already engaged.
 *  - An explicit failure keyword in the operator-entered `status` string
 *    triggers a nudge.
 *  - A completely missing/blank status for an outbound Call/SMS/Email also
 *    triggers a nudge — the operator tried and got nothing worth recording.
 */
const FAILURE_KEYWORDS = [
  "voicemail",
  "no answer",
  "no_answer",
  "noanswer",
  "no response",
  "no_response",
  "noresponse",
  "busy",
  "unreachable",
  "failed",
  "fail",
  "bounced",
  "bounce",
  "undeliverable",
  "undelivered",
  "rejected",
  "declined",
  "missed",
  "disconnected",
  "wrong number",
  "wrong_number",
  "not interested",
  "left message",
  "left_message",
  "left msg",
] as const;

const AUTO_FOLLOWUP_CHANNELS: ReadonlySet<ContactChannel> = new Set<ContactChannel>([
  "CALL",
  "SMS",
  "EMAIL",
]);

export interface ContactAttemptShape {
  channel: ContactChannel;
  direction: "outbound" | "inbound";
  status?: string | null;
}

/** Returns true when the log row warrants a follow-up task. */
export function isFailedContactStatus(attempt: ContactAttemptShape): boolean {
  if (attempt.direction !== "outbound") return false;
  if (!AUTO_FOLLOWUP_CHANNELS.has(attempt.channel)) return false;

  const raw = attempt.status?.trim().toLowerCase() ?? "";
  if (!raw) return true;

  // "success" style phrases short-circuit so we don't spam tasks.
  const ok = ["answered", "connected", "delivered", "opened", "replied", "sent"];
  if (ok.some((s) => raw === s || raw.startsWith(`${s} `))) return false;

  return FAILURE_KEYWORDS.some((kw) => raw.includes(kw));
}

/** Human-readable title for the auto-generated follow-up task. */
export function followUpTitleForAttempt(attempt: ContactAttemptShape): string {
  switch (attempt.channel) {
    case "CALL":
      return "Retry call after no answer";
    case "SMS":
      return "Retry SMS — no reply received";
    case "EMAIL":
      return "Retry email — no reply received";
    default:
      return "Follow up on failed contact attempt";
  }
}
