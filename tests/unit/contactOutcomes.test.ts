import { describe, it, expect } from "vitest";
import {
  classifyContactOutcome,
  followUpTitleForFailure,
} from "@/modules/outbound/outcomes";

describe("classifyContactOutcome", () => {
  it("flags CALL voicemail / no_answer as failed", () => {
    expect(classifyContactOutcome("CALL", "outbound", "voicemail").outcome).toBe(
      "failed",
    );
    expect(classifyContactOutcome("CALL", "outbound", "no_answer").outcome).toBe(
      "failed",
    );
    expect(classifyContactOutcome("CALL", "outbound", "No Answer").outcome).toBe(
      "failed",
    );
  });

  it("flags SMS undelivered/bounced as failed", () => {
    expect(classifyContactOutcome("SMS", "outbound", "undelivered").outcome).toBe(
      "failed",
    );
    expect(classifyContactOutcome("SMS", "outbound", "bounced").outcome).toBe(
      "failed",
    );
  });

  it("flags EMAIL hard_bounce as failed", () => {
    expect(
      classifyContactOutcome("EMAIL", "outbound", "hard_bounce").outcome,
    ).toBe("failed");
  });

  it("flags CALL answered/connected as succeeded", () => {
    expect(classifyContactOutcome("CALL", "outbound", "answered").outcome).toBe(
      "succeeded",
    );
    expect(classifyContactOutcome("CALL", "outbound", "connected").outcome).toBe(
      "succeeded",
    );
  });

  it("flags EMAIL delivered/opened as succeeded", () => {
    expect(classifyContactOutcome("EMAIL", "outbound", "delivered").outcome).toBe(
      "succeeded",
    );
    expect(classifyContactOutcome("EMAIL", "outbound", "opened").outcome).toBe(
      "succeeded",
    );
  });

  it("returns neutral when status is missing", () => {
    expect(classifyContactOutcome("CALL", "outbound", null).outcome).toBe(
      "neutral",
    );
    expect(classifyContactOutcome("CALL", "outbound", undefined).outcome).toBe(
      "neutral",
    );
    expect(classifyContactOutcome("CALL", "outbound", "").outcome).toBe(
      "neutral",
    );
  });

  it("treats whitespace-only status as missing (reason is null, not empty string)", () => {
    const r = classifyContactOutcome("CALL", "outbound", "   ");
    expect(r.outcome).toBe("neutral");
    expect(r.reason).toBeNull();
  });

  it("returns neutral for unknown free-text statuses", () => {
    expect(classifyContactOutcome("CALL", "outbound", "left note").outcome).toBe(
      "neutral",
    );
  });

  it("never flags inbound traffic as failed", () => {
    expect(classifyContactOutcome("CALL", "inbound", "voicemail").outcome).toBe(
      "neutral",
    );
    expect(classifyContactOutcome("SMS", "inbound", "bounced").outcome).toBe(
      "neutral",
    );
  });

  it("returns normalized reason token on failure", () => {
    const r = classifyContactOutcome("CALL", "outbound", "No-Answer");
    expect(r.outcome).toBe("failed");
    expect(r.reason).toBe("no-answer");
  });
});

describe("followUpTitleForFailure", () => {
  it("produces a per-channel retry title with reason", () => {
    expect(followUpTitleForFailure("CALL", "voicemail")).toBe(
      "Retry call (voicemail)",
    );
    expect(followUpTitleForFailure("EMAIL", "hard_bounce")).toBe(
      "Retry email (hard bounce)",
    );
    expect(followUpTitleForFailure("SMS", null)).toBe("Retry SMS");
  });
});
