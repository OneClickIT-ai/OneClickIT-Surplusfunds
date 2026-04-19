import { describe, it, expect } from "vitest";

import {
  followUpTitle,
  shouldScheduleFollowUp,
} from "@/modules/outbound/server/follow-up";

describe("shouldScheduleFollowUp", () => {
  it("returns false for null / empty / whitespace", () => {
    expect(shouldScheduleFollowUp(null)).toBe(false);
    expect(shouldScheduleFollowUp(undefined)).toBe(false);
    expect(shouldScheduleFollowUp("")).toBe(false);
    expect(shouldScheduleFollowUp("   ")).toBe(false);
  });

  it("returns false for successful outcomes", () => {
    expect(shouldScheduleFollowUp("answered")).toBe(false);
    expect(shouldScheduleFollowUp("delivered")).toBe(false);
    expect(shouldScheduleFollowUp("sent")).toBe(false);
    expect(shouldScheduleFollowUp("met")).toBe(false);
  });

  it("catches voicemail / no-answer variants", () => {
    expect(shouldScheduleFollowUp("voicemail")).toBe(true);
    expect(shouldScheduleFollowUp("VM")).toBe(true);
    expect(shouldScheduleFollowUp("no_answer")).toBe(true);
    expect(shouldScheduleFollowUp("no answer")).toBe(true);
    expect(shouldScheduleFollowUp("No-Answer")).toBe(true);
    expect(shouldScheduleFollowUp("  Busy  ")).toBe(true);
  });

  it("catches email + sms bounce / undeliverable variants", () => {
    expect(shouldScheduleFollowUp("bounced")).toBe(true);
    expect(shouldScheduleFollowUp("Undeliverable")).toBe(true);
    expect(shouldScheduleFollowUp("failed")).toBe(true);
    expect(shouldScheduleFollowUp("wrong number")).toBe(true);
    expect(shouldScheduleFollowUp("no_response")).toBe(true);
  });

  it("ignores unrelated / unknown statuses", () => {
    expect(shouldScheduleFollowUp("scheduled_callback")).toBe(false);
    expect(shouldScheduleFollowUp("signed")).toBe(false);
    expect(shouldScheduleFollowUp("random text")).toBe(false);
  });
});

describe("followUpTitle", () => {
  it("renders a channel-specific retry title", () => {
    expect(followUpTitle("CALL", "voicemail")).toBe(
      "Retry call — previous attempt unanswered (voicemail)",
    );
    expect(followUpTitle("EMAIL", "bounced")).toBe(
      "Retry email — previous attempt unanswered (bounced)",
    );
    expect(followUpTitle("IN_PERSON", "no_answer")).toBe(
      "Retry in-person visit — previous attempt unanswered (no_answer)",
    );
  });

  it("omits the parenthetical when no status is provided", () => {
    expect(followUpTitle("SMS", null)).toBe(
      "Retry sms — previous attempt unanswered",
    );
  });
});
