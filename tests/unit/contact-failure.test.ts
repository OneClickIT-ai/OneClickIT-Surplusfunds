import { describe, it, expect } from "vitest";
import {
  isFailedContactStatus,
  followUpTitleForAttempt,
} from "@/modules/outbound/failures";

describe("isFailedContactStatus", () => {
  it("treats inbound attempts as non-failures regardless of status", () => {
    expect(
      isFailedContactStatus({
        channel: "CALL",
        direction: "inbound",
        status: "voicemail",
      }),
    ).toBe(false);
  });

  it("treats MAIL / IN_PERSON as non-automated (operator decides)", () => {
    expect(
      isFailedContactStatus({
        channel: "MAIL",
        direction: "outbound",
        status: "no response",
      }),
    ).toBe(false);
    expect(
      isFailedContactStatus({
        channel: "IN_PERSON",
        direction: "outbound",
        status: "",
      }),
    ).toBe(false);
  });

  it("flags a blank status on outbound call/sms/email as a failure", () => {
    expect(
      isFailedContactStatus({ channel: "CALL", direction: "outbound", status: "" }),
    ).toBe(true);
    expect(
      isFailedContactStatus({ channel: "SMS", direction: "outbound", status: null }),
    ).toBe(true);
    expect(
      isFailedContactStatus({ channel: "EMAIL", direction: "outbound" }),
    ).toBe(true);
  });

  it("flags common failure keywords in status", () => {
    const samples = [
      "voicemail",
      "No Answer",
      "NOANSWER",
      "busy",
      "bounced",
      "Undeliverable",
      "failed to deliver",
      "missed call",
      "disconnected",
      "wrong number",
    ];
    for (const s of samples) {
      expect(
        isFailedContactStatus({ channel: "CALL", direction: "outbound", status: s }),
      ).toBe(true);
    }
  });

  it("does NOT flag obvious success phrases", () => {
    for (const s of ["answered", "connected", "delivered", "opened", "replied", "sent"]) {
      expect(
        isFailedContactStatus({ channel: "EMAIL", direction: "outbound", status: s }),
      ).toBe(false);
      expect(
        isFailedContactStatus({ channel: "CALL", direction: "outbound", status: s }),
      ).toBe(false);
    }
  });

  it("ignores case and surrounding whitespace", () => {
    expect(
      isFailedContactStatus({
        channel: "SMS",
        direction: "outbound",
        status: "   VOICEMAIL   ",
      }),
    ).toBe(true);
  });
});

describe("followUpTitleForAttempt", () => {
  it("returns channel-appropriate titles", () => {
    expect(
      followUpTitleForAttempt({ channel: "CALL", direction: "outbound" }),
    ).toMatch(/call/i);
    expect(
      followUpTitleForAttempt({ channel: "SMS", direction: "outbound" }),
    ).toMatch(/sms/i);
    expect(
      followUpTitleForAttempt({ channel: "EMAIL", direction: "outbound" }),
    ).toMatch(/email/i);
    expect(
      followUpTitleForAttempt({ channel: "MAIL", direction: "outbound" }),
    ).toMatch(/follow up/i);
  });
});
