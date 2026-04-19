import { describe, expect, it } from "vitest";

import {
  classifyContactOutcome,
  followUpTitleFor,
} from "@/modules/outbound/outcome";
import {
  createContactLogSchema,
  updateContactLogSchema,
} from "@/modules/outbound/schemas";

describe("classifyContactOutcome", () => {
  it("flags explicit failure phrases as failed", () => {
    for (const s of [
      "no answer",
      "No-Answer",
      "voicemail",
      "Went to VM",
      "busy",
      "bounced",
      "undeliverable",
      "invalid number",
      "wrong number",
      "disconnected",
      "no response",
    ]) {
      expect(classifyContactOutcome(s, "outbound")).toBe("failed");
    }
  });

  it("flags positive phrases as success", () => {
    for (const s of [
      "answered",
      "Connected",
      "spoke with claimant",
      "delivered",
      "replied",
      "opened",
    ]) {
      expect(classifyContactOutcome(s, "outbound")).toBe("success");
    }
  });

  it("returns neutral for empty/unknown status", () => {
    expect(classifyContactOutcome(null, "outbound")).toBe("neutral");
    expect(classifyContactOutcome("", "outbound")).toBe("neutral");
    expect(classifyContactOutcome("   ", "outbound")).toBe("neutral");
    expect(classifyContactOutcome("left message for son", "outbound")).toBe(
      "neutral",
    );
  });

  it("never classifies inbound attempts as failed", () => {
    expect(classifyContactOutcome("voicemail", "inbound")).toBe("neutral");
    expect(classifyContactOutcome("bounced", "inbound")).toBe("neutral");
  });
});

describe("followUpTitleFor", () => {
  it("produces channel-specific retry titles", () => {
    expect(followUpTitleFor("CALL")).toMatch(/call/i);
    expect(followUpTitleFor("SMS")).toMatch(/sms/i);
    expect(followUpTitleFor("EMAIL")).toMatch(/email/i);
    expect(followUpTitleFor("MAIL")).toMatch(/mail/i);
    expect(followUpTitleFor("IN_PERSON")).toMatch(/in-person/i);
  });
});

describe("createContactLogSchema", () => {
  it("accepts a minimal call log and defaults direction to outbound", () => {
    const r = createContactLogSchema.parse({ channel: "CALL" });
    expect(r.channel).toBe("CALL");
    expect(r.direction).toBe("outbound");
  });

  it("coerces duration strings to ints and normalizes blank text fields", () => {
    const r = createContactLogSchema.parse({
      channel: "CALL",
      duration: "45",
      status: "   ",
      notes: "",
    });
    expect(r.duration).toBe(45);
    expect(r.status).toBeUndefined();
    expect(r.notes).toBeUndefined();
  });

  it("rejects unsupported channels", () => {
    const r = createContactLogSchema.safeParse({ channel: "FAX" });
    expect(r.success).toBe(false);
  });

  it("rejects negative or absurd durations", () => {
    expect(
      createContactLogSchema.safeParse({ channel: "CALL", duration: -1 })
        .success,
    ).toBe(false);
    expect(
      createContactLogSchema.safeParse({ channel: "CALL", duration: 999_999 })
        .success,
    ).toBe(false);
  });
});

describe("updateContactLogSchema", () => {
  it("allows partial updates and explicit nulls", () => {
    const r = updateContactLogSchema.parse({ status: null, notes: "updated" });
    expect(r.status).toBeNull();
    expect(r.notes).toBe("updated");
  });

  it("rejects notes longer than the max length", () => {
    const r = updateContactLogSchema.safeParse({ notes: "x".repeat(2001) });
    expect(r.success).toBe(false);
  });
});
