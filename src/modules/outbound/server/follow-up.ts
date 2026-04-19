import type { ContactChannel } from "@prisma/client";

/**
 * Contact result statuses that indicate the outreach *attempt* did not reach
 * the claimant. When one of these is logged we want to auto-seed a FOLLOW_UP
 * task so the case doesn't go cold.
 *
 * Matching is case-insensitive and tolerant of whitespace / punctuation — the
 * quick-log UI collects free text today, so we normalize before comparing.
 */
const FAILURE_STATUS_TOKENS = new Set<string>([
  "voicemail",
  "vm",
  "no_answer",
  "noanswer",
  "no answer",
  "busy",
  "missed",
  "left_message",
  "left message",
  "bounce",
  "bounced",
  "undeliverable",
  "undelivered",
  "failed",
  "error",
  "wrong_number",
  "wrong number",
  "disconnected",
  "unreachable",
  "no_response",
  "no response",
]);

function normalize(raw: string): string {
  return raw.trim().toLowerCase().replace(/[-/]+/g, " ");
}

/**
 * Pure classifier: does this contact result warrant an automatic follow-up?
 * Returns false for null/empty/successful outcomes; returns true for known
 * failure/no-reach tokens.
 */
export function shouldScheduleFollowUp(status: string | null | undefined): boolean {
  if (!status) return false;
  const n = normalize(status);
  if (!n) return false;
  if (FAILURE_STATUS_TOKENS.has(n)) return true;
  // Also accept the underscored and spaced variants uniformly.
  const underscored = n.replace(/\s+/g, "_");
  if (FAILURE_STATUS_TOKENS.has(underscored)) return true;
  const spaced = n.replace(/_+/g, " ");
  if (FAILURE_STATUS_TOKENS.has(spaced)) return true;
  return false;
}

/**
 * Human-readable follow-up title for the auto-generated task. Keeps the title
 * specific enough that it's useful on a packed board.
 */
export function followUpTitle(
  channel: ContactChannel,
  status: string | null | undefined,
): string {
  const ch = channel === "IN_PERSON" ? "in-person visit" : channel.toLowerCase();
  const suffix = status ? ` (${status})` : "";
  return `Retry ${ch} — previous attempt unanswered${suffix}`;
}
