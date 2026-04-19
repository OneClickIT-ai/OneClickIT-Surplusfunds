import type { ContactChannel } from "@prisma/client";

export type ContactOutcome = "success" | "failed" | "neutral";

/**
 * Tokens that strongly imply a contact attempt didn't land. Kept generic so
 * operators typing freeform status strings get the right behavior. Matched
 * case-insensitive against the trimmed status value.
 */
const FAILED_TOKENS = [
  "no answer",
  "no-answer",
  "voicemail",
  "vm",
  "busy",
  "failed",
  "undeliver",
  "bounce",
  "bounced",
  "invalid",
  "unreachable",
  "disconnect",
  "wrong number",
  "not interested",
  "declined",
  "rejected",
  "no response",
];

const SUCCESS_TOKENS = [
  "answered",
  "connected",
  "spoke",
  "delivered",
  "replied",
  "responded",
  "sent",
  "received",
  "opened",
  "agreed",
];

/**
 * Classify the free-form `status` on a contact log into a coarse outcome.
 * "failed" means the attempt did not reach the claimant — a human follow-up
 * is the right next step. "success" means no follow-up is needed. "neutral"
 * (including empty/unknown) means we can't tell, so don't auto-spawn tasks.
 *
 * Direction matters: "inbound" attempts are the claimant reaching us, so we
 * never classify those as failed — that would auto-create tasks on every
 * inbound reply.
 */
export function classifyContactOutcome(
  status: string | null | undefined,
  direction: string,
): ContactOutcome {
  if (direction !== "outbound") return "neutral";
  const s = (status ?? "").trim().toLowerCase();
  if (!s) return "neutral";
  if (FAILED_TOKENS.some((t) => s.includes(t))) return "failed";
  if (SUCCESS_TOKENS.some((t) => s.includes(t))) return "success";
  return "neutral";
}

/**
 * Human-friendly label for the next action after a failed attempt on a given
 * channel. Kept channel-aware so the task title stays useful at a glance.
 */
export function followUpTitleFor(channel: ContactChannel): string {
  switch (channel) {
    case "CALL":
      return "Retry call — previous attempt did not connect";
    case "SMS":
      return "Retry SMS — previous message not delivered";
    case "EMAIL":
      return "Retry email — previous message not delivered";
    case "MAIL":
      return "Follow up on undelivered mail";
    case "IN_PERSON":
      return "Retry in-person visit";
    default:
      return "Follow up on failed contact attempt";
  }
}
