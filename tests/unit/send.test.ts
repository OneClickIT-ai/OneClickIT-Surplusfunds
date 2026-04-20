import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { sendContactSchema } from "@/modules/outbound/schemas";
import {
  resultToLogStatus,
  channelIsSendable,
  sendSms,
  sendEmail,
  type SendResult,
} from "@/modules/outbound/server/providers";
import {
  buildSmsNotes,
  buildEmailNotes,
} from "@/modules/outbound/server/send";
import { isFailedContactStatus } from "@/modules/outbound/follow-up";

describe("sendContactSchema", () => {
  it("accepts an SMS payload with body + optional to", () => {
    const r = sendContactSchema.safeParse({
      channel: "SMS",
      body: "Hi Jane",
      to: "+15551234567",
    });
    expect(r.success).toBe(true);
  });

  it("requires non-empty body for SMS", () => {
    const r = sendContactSchema.safeParse({
      channel: "SMS",
      body: "   ",
    });
    expect(r.success).toBe(false);
  });

  it("requires subject + body for EMAIL", () => {
    expect(
      sendContactSchema.safeParse({
        channel: "EMAIL",
        body: "Hello",
      }).success,
    ).toBe(false);
    expect(
      sendContactSchema.safeParse({
        channel: "EMAIL",
        body: "Hello",
        subject: "Update",
      }).success,
    ).toBe(true);
  });

  it("rejects invalid override email addresses", () => {
    const r = sendContactSchema.safeParse({
      channel: "EMAIL",
      body: "Hello",
      subject: "Update",
      to: "not-an-email",
    });
    expect(r.success).toBe(false);
  });

  it("rejects channels other than SMS/EMAIL", () => {
    const r = sendContactSchema.safeParse({
      channel: "CALL",
      body: "Hi",
    });
    expect(r.success).toBe(false);
  });

  it("caps SMS body at 1600 chars", () => {
    const r = sendContactSchema.safeParse({
      channel: "SMS",
      body: "a".repeat(1601),
    });
    expect(r.success).toBe(false);
  });
});

describe("channelIsSendable", () => {
  it("only SMS and EMAIL can be sent", () => {
    expect(channelIsSendable("SMS")).toBe(true);
    expect(channelIsSendable("EMAIL")).toBe(true);
    expect(channelIsSendable("CALL")).toBe(false);
    expect(channelIsSendable("MAIL")).toBe(false);
    expect(channelIsSendable("IN_PERSON")).toBe(false);
  });
});

describe("resultToLogStatus", () => {
  it("success -> sent + provider message id", () => {
    const r = resultToLogStatus({
      ok: true,
      providerMessageId: "SM123",
      providerStatus: "queued",
    } satisfies SendResult);
    expect(r.status).toBe("sent");
    expect(r.externalId).toBe("SM123");
  });

  it("empty provider id collapses to null externalId", () => {
    const r = resultToLogStatus({
      ok: true,
      providerMessageId: "",
      providerStatus: "sent",
    } satisfies SendResult);
    expect(r.externalId).toBeNull();
  });

  it("failure -> keeps provider failure token verbatim", () => {
    expect(
      resultToLogStatus({
        ok: false,
        status: "invalid_number",
        error: "bad",
      }).status,
    ).toBe("invalid_number");
    expect(
      resultToLogStatus({ ok: false, status: "bounced", error: "x" }).status,
    ).toBe("bounced");
    expect(
      resultToLogStatus({
        ok: false,
        status: "not_configured",
        error: "x",
      }).externalId,
    ).toBeNull();
  });

  it("all send-failure statuses flow into the follow-up auto-task classifier", () => {
    // Tight contract: any status we emit on a provider failure must be a
    // status the failure-classifier treats as "we need to try again".
    // `not_configured` is the exception — it means the operator needs to
    // fix env, not that the claimant didn't answer.
    const failureTokens = ["failed", "invalid_number", "bounced"] as const;
    for (const status of failureTokens) {
      expect(isFailedContactStatus(status)).toBe(true);
    }
    expect(isFailedContactStatus("not_configured")).toBe(false);
  });
});

describe("buildSmsNotes / buildEmailNotes", () => {
  it("SMS success surfaces recipient in header", () => {
    const notes = buildSmsNotes({
      to: "+15551234567",
      body: "hi",
      result: { ok: true, providerMessageId: "SM1", providerStatus: "sent" },
    });
    expect(notes).toContain("+15551234567");
    expect(notes).toContain("sent");
    expect(notes).toContain("hi");
  });

  it("SMS failure preserves provider error text", () => {
    const notes = buildSmsNotes({
      to: "+15551234567",
      body: "hi",
      result: { ok: false, status: "invalid_number", error: "not mobile" },
    });
    expect(notes.toLowerCase()).toContain("failed");
    expect(notes).toContain("not mobile");
  });

  it("Email notes include subject so audit is self-contained", () => {
    const notes = buildEmailNotes({
      to: "jane@example.com",
      subject: "Follow-up on your surplus claim",
      body: "Here's the next step.",
      result: { ok: true, providerMessageId: "rs1", providerStatus: "sent" },
    });
    expect(notes).toContain("jane@example.com");
    expect(notes).toContain("Follow-up on your surplus claim");
    expect(notes).toContain("Here's the next step.");
  });
});

describe("sendSms / sendEmail without credentials", () => {
  // Sanity check — without env vars set, providers refuse to call out and
  // return a machine-readable not_configured, which the UI/API surface as
  // 503 instead of silently no-oping.
  const saved = {
    sid: process.env.TWILIO_ACCOUNT_SID,
    tok: process.env.TWILIO_AUTH_TOKEN,
    from: process.env.TWILIO_FROM_NUMBER,
    rk: process.env.RESEND_API_KEY,
    rf: process.env.RESEND_FROM_ADDRESS,
  };

  beforeEach(() => {
    delete process.env.TWILIO_ACCOUNT_SID;
    delete process.env.TWILIO_AUTH_TOKEN;
    delete process.env.TWILIO_FROM_NUMBER;
    delete process.env.RESEND_API_KEY;
    delete process.env.RESEND_FROM_ADDRESS;
  });

  afterEach(() => {
    process.env.TWILIO_ACCOUNT_SID = saved.sid;
    process.env.TWILIO_AUTH_TOKEN = saved.tok;
    process.env.TWILIO_FROM_NUMBER = saved.from;
    process.env.RESEND_API_KEY = saved.rk;
    process.env.RESEND_FROM_ADDRESS = saved.rf;
  });

  it("SMS returns not_configured when Twilio env is missing", async () => {
    const r = await sendSms({ to: "+15551234567", body: "hi" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.status).toBe("not_configured");
  });

  it("Email returns not_configured when Resend env is missing", async () => {
    const r = await sendEmail({
      to: "jane@example.com",
      subject: "x",
      body: "hi",
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.status).toBe("not_configured");
  });
});
