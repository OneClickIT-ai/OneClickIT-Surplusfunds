import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  isChannelSendConfigured,
  isResendConfigured,
  isTwilioConfigured,
  mapTwilioStatus,
  sendResendEmail,
  sendTwilioSms,
} from "@/modules/outbound/server/providers";
import { sendContactSchema } from "@/modules/outbound/schemas";

const ORIGINAL_ENV = { ...process.env };
const ORIGINAL_FETCH = globalThis.fetch;

function setEnv(next: Record<string, string | undefined>) {
  for (const [k, v] of Object.entries(next)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
}

function resetEnv() {
  for (const k of [
    "TWILIO_ACCOUNT_SID",
    "TWILIO_AUTH_TOKEN",
    "TWILIO_FROM_NUMBER",
    "RESEND_API_KEY",
    "EMAIL_FROM",
  ]) {
    if (ORIGINAL_ENV[k] === undefined) delete process.env[k];
    else process.env[k] = ORIGINAL_ENV[k];
  }
}

afterEach(() => {
  resetEnv();
  globalThis.fetch = ORIGINAL_FETCH;
  vi.restoreAllMocks();
});

describe("isTwilioConfigured / isResendConfigured", () => {
  beforeEach(() => {
    setEnv({
      TWILIO_ACCOUNT_SID: undefined,
      TWILIO_AUTH_TOKEN: undefined,
      TWILIO_FROM_NUMBER: undefined,
      RESEND_API_KEY: undefined,
      EMAIL_FROM: undefined,
    });
  });

  it("returns false when no env is set", () => {
    expect(isTwilioConfigured()).toBe(false);
    expect(isResendConfigured()).toBe(false);
    expect(isChannelSendConfigured("SMS")).toBe(false);
    expect(isChannelSendConfigured("EMAIL")).toBe(false);
  });

  it("returns true only when all three twilio vars are set", () => {
    setEnv({ TWILIO_ACCOUNT_SID: "AC123", TWILIO_AUTH_TOKEN: "t" });
    expect(isTwilioConfigured()).toBe(false);
    setEnv({ TWILIO_FROM_NUMBER: "+15551234567" });
    expect(isTwilioConfigured()).toBe(true);
    expect(isChannelSendConfigured("SMS")).toBe(true);
  });

  it("returns true for resend only when api key and EMAIL_FROM are set", () => {
    setEnv({ RESEND_API_KEY: "re_xxx" });
    expect(isResendConfigured()).toBe(false);
    setEnv({ EMAIL_FROM: "agent@example.com" });
    expect(isResendConfigured()).toBe(true);
    expect(isChannelSendConfigured("EMAIL")).toBe(true);
  });
});

describe("mapTwilioStatus", () => {
  it("maps happy paths to canonical tokens", () => {
    expect(mapTwilioStatus("delivered")).toBe("delivered");
    expect(mapTwilioStatus("DELIVERED")).toBe("delivered");
    expect(mapTwilioStatus("sent")).toBe("sent");
    expect(mapTwilioStatus("queued")).toBe("sent");
    expect(mapTwilioStatus("sending")).toBe("sent");
    expect(mapTwilioStatus("accepted")).toBe("sent");
  });

  it("maps failure-ish statuses to 'failed' so follow-ups fire", () => {
    expect(mapTwilioStatus("failed")).toBe("failed");
    expect(mapTwilioStatus("undelivered")).toBe("failed");
  });

  it("defaults unknown tokens to 'sent' rather than synthesizing failure", () => {
    expect(mapTwilioStatus(null)).toBe("sent");
    expect(mapTwilioStatus(undefined)).toBe("sent");
    expect(mapTwilioStatus("whatever_new_status")).toBe("sent");
  });
});

describe("sendTwilioSms (configuration gate)", () => {
  it("returns a normalized failure when twilio envs are missing", async () => {
    setEnv({
      TWILIO_ACCOUNT_SID: undefined,
      TWILIO_AUTH_TOKEN: undefined,
      TWILIO_FROM_NUMBER: undefined,
    });
    const fetchSpy = vi.fn();
    globalThis.fetch = fetchSpy as unknown as typeof fetch;

    const result = await sendTwilioSms({ to: "+15551234567", body: "hi" });

    expect(result).toMatchObject({
      ok: false,
      status: "failed",
      provider: null,
    });
    expect(result.error).toMatch(/not configured/i);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("parses a successful 201 and surfaces the message sid", async () => {
    setEnv({
      TWILIO_ACCOUNT_SID: "AC123",
      TWILIO_AUTH_TOKEN: "token",
      TWILIO_FROM_NUMBER: "+15550000000",
    });
    globalThis.fetch = vi.fn(async () =>
      new Response(
        JSON.stringify({ sid: "SM999", status: "queued" }),
        { status: 201, headers: { "Content-Type": "application/json" } },
      ),
    ) as unknown as typeof fetch;

    const result = await sendTwilioSms({ to: "+15551234567", body: "hi" });
    expect(result.ok).toBe(true);
    expect(result.externalId).toBe("SM999");
    expect(result.status).toBe("sent");
    expect(result.provider).toBe("twilio");
  });

  it("maps provider 4xx to ok:false without throwing", async () => {
    setEnv({
      TWILIO_ACCOUNT_SID: "AC123",
      TWILIO_AUTH_TOKEN: "token",
      TWILIO_FROM_NUMBER: "+15550000000",
    });
    globalThis.fetch = vi.fn(async () =>
      new Response(
        JSON.stringify({ message: "not a valid number", code: 21211 }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      ),
    ) as unknown as typeof fetch;

    const result = await sendTwilioSms({ to: "bogus", body: "hi" });
    expect(result.ok).toBe(false);
    expect(result.status).toBe("failed");
    expect(result.error).toContain("not a valid number");
  });
});

describe("sendResendEmail (configuration gate)", () => {
  it("short-circuits when resend is not configured", async () => {
    setEnv({ RESEND_API_KEY: undefined, EMAIL_FROM: undefined });
    const fetchSpy = vi.fn();
    globalThis.fetch = fetchSpy as unknown as typeof fetch;

    const result = await sendResendEmail({
      to: "x@example.com",
      subject: "hi",
      text: "body",
    });
    expect(result.ok).toBe(false);
    expect(result.provider).toBe(null);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("returns ok:true with id on a 200", async () => {
    setEnv({ RESEND_API_KEY: "re_abc", EMAIL_FROM: "agent@example.com" });
    globalThis.fetch = vi.fn(async () =>
      new Response(
        JSON.stringify({ id: "em_1" }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    ) as unknown as typeof fetch;

    const result = await sendResendEmail({
      to: "claimant@example.com",
      subject: "hi",
      text: "body",
    });
    expect(result).toMatchObject({
      ok: true,
      status: "sent",
      externalId: "em_1",
      provider: "resend",
    });
  });
});

describe("sendContactSchema", () => {
  it("requires a non-empty body", () => {
    const r = sendContactSchema.safeParse({ channel: "SMS", body: "   " });
    expect(r.success).toBe(false);
  });

  it("coerces empty subject/to to undefined so claimant default can kick in", () => {
    const r = sendContactSchema.parse({
      channel: "EMAIL",
      body: "hello",
      to: "",
      subject: "",
    });
    expect(r.to).toBeUndefined();
    expect(r.subject).toBeUndefined();
  });

  it("rejects unsupported channels (send is SMS/EMAIL only)", () => {
    const r = sendContactSchema.safeParse({ channel: "CALL", body: "hi" });
    expect(r.success).toBe(false);
  });

  it("caps body length at 4000", () => {
    const r = sendContactSchema.safeParse({
      channel: "SMS",
      body: "x".repeat(4001),
    });
    expect(r.success).toBe(false);
  });
});
