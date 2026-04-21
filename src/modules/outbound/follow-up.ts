import type { ContactChannel, TaskType } from "@prisma/client";

// Canonical status tokens operators can pick from the quick-log UI. Kept here
// so the UI chips and the failure-classifier read from the same source.
export const CONTACT_STATUS_OPTIONS = {
  CALL: ["answered", "voicemail", "no_answer", "busy", "wrong_number", "failed"],
  SMS: ["sent", "delivered", "no_response", "invalid_number", "failed"],
  EMAIL: ["sent", "opened", "replied", "bounced", "failed"],
  MAIL: ["sent", "delivered", "returned", "failed"],
  IN_PERSON: ["met", "not_home", "refused"],
} as const satisfies Record<ContactChannel, readonly string[]>;

// Statuses that mean the outbound attempt didn't reach the claimant in a
// useful way. Anything here triggers a follow-up task.
const FAILED_STATUSES = new Set([
  "no_answer",
  "voicemail",
  "busy",
  "bounced",
  "failed",
  "undeliverable",
  "invalid_number",
  "invalid_address",
  "wrong_number",
  "no_response",
  "returned",
  "not_home",
  "refused",
]);

function normalize(status: string | null | undefined): string | null {
  if (!status) return null;
  const trimmed = status.trim().toLowerCase();
  if (!trimmed) return null;
  return trimmed.replace(/[\s-]+/g, "_");
}

export function isFailedContactStatus(
  status: string | null | undefined,
): boolean {
  const normalized = normalize(status);
  if (!normalized) return false;
  return FAILED_STATUSES.has(normalized);
}

/**
 * How many days to wait before nudging the operator again, per channel.
 * Calls get the shortest turnaround because they're the most time-sensitive;
 * postal mail gets a week because nothing moves faster than that.
 */
export function followUpDelayDays(channel: ContactChannel): number {
  switch (channel) {
    case "CALL":
      return 1;
    case "SMS":
      return 2;
    case "EMAIL":
      return 3;
    case "MAIL":
      return 7;
    case "IN_PERSON":
      return 2;
    default:
      return 2;
  }
}

export function followUpTaskType(channel: ContactChannel): TaskType {
  switch (channel) {
    case "CALL":
      return "CALL";
    case "SMS":
      return "SMS";
    case "EMAIL":
      return "EMAIL";
    default:
      return "FOLLOW_UP";
  }
}
