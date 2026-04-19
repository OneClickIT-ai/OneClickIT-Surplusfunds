import { describe, it, expect } from "vitest";
import {
  CONTACT_STATUS_OPTIONS,
  followUpDelayDays,
  followUpTaskType,
  isFailedContactStatus,
} from "@/modules/outbound/follow-up";

describe("isFailedContactStatus", () => {
  it("returns false for null/empty/undefined", () => {
    expect(isFailedContactStatus(null)).toBe(false);
    expect(isFailedContactStatus(undefined)).toBe(false);
    expect(isFailedContactStatus("")).toBe(false);
    expect(isFailedContactStatus("   ")).toBe(false);
  });

  it("returns false for success-ish statuses", () => {
    expect(isFailedContactStatus("answered")).toBe(false);
    expect(isFailedContactStatus("delivered")).toBe(false);
    expect(isFailedContactStatus("replied")).toBe(false);
    expect(isFailedContactStatus("met")).toBe(false);
    expect(isFailedContactStatus("Opened")).toBe(false);
  });

  it("returns true for canonical failure tokens", () => {
    expect(isFailedContactStatus("no_answer")).toBe(true);
    expect(isFailedContactStatus("voicemail")).toBe(true);
    expect(isFailedContactStatus("bounced")).toBe(true);
    expect(isFailedContactStatus("failed")).toBe(true);
    expect(isFailedContactStatus("no_response")).toBe(true);
    expect(isFailedContactStatus("wrong_number")).toBe(true);
  });

  it("normalizes spacing, hyphens, and casing", () => {
    expect(isFailedContactStatus("No Answer")).toBe(true);
    expect(isFailedContactStatus("NO-ANSWER")).toBe(true);
    expect(isFailedContactStatus("  wrong-number  ")).toBe(true);
    expect(isFailedContactStatus("Invalid Number")).toBe(true);
  });

  it("does not treat unknown statuses as failures", () => {
    expect(isFailedContactStatus("pending_review")).toBe(false);
    expect(isFailedContactStatus("scheduled")).toBe(false);
  });
});

describe("followUpDelayDays", () => {
  it("gives calls the shortest turnaround and mail the longest", () => {
    expect(followUpDelayDays("CALL")).toBe(1);
    expect(followUpDelayDays("SMS")).toBe(2);
    expect(followUpDelayDays("EMAIL")).toBe(3);
    expect(followUpDelayDays("MAIL")).toBe(7);
    expect(followUpDelayDays("IN_PERSON")).toBe(2);
  });
});

describe("followUpTaskType", () => {
  it("maps channels to matching task types where they exist", () => {
    expect(followUpTaskType("CALL")).toBe("CALL");
    expect(followUpTaskType("SMS")).toBe("SMS");
    expect(followUpTaskType("EMAIL")).toBe("EMAIL");
  });

  it("falls back to FOLLOW_UP for channels without a direct task type", () => {
    expect(followUpTaskType("MAIL")).toBe("FOLLOW_UP");
    expect(followUpTaskType("IN_PERSON")).toBe("FOLLOW_UP");
  });
});

describe("CONTACT_STATUS_OPTIONS", () => {
  it("every channel's failure-ish statuses are classified as failures", () => {
    const knownFailures: Record<string, readonly string[]> = {
      CALL: ["voicemail", "no_answer", "busy", "wrong_number", "failed"],
      SMS: ["invalid_number", "failed", "no_response"],
      EMAIL: ["bounced", "failed"],
      MAIL: ["returned", "failed"],
      IN_PERSON: ["not_home", "refused"],
    };
    for (const [channel, failures] of Object.entries(knownFailures)) {
      const options = CONTACT_STATUS_OPTIONS[channel as keyof typeof CONTACT_STATUS_OPTIONS];
      for (const f of failures) {
        expect(options).toContain(f);
        expect(isFailedContactStatus(f)).toBe(true);
      }
    }
  });
});
