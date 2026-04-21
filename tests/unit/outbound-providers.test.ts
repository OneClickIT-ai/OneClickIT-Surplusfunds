import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  normalizePhone,
  readTwilioConfig,
  sendSms,
} from "@/modules/outbound/server/providers/twilio";
import {
  normalizeEmail,
  readResendConfig,
  sendEmail,
} from "@/modules/outbound/server/providers/resend";
import { sendContactSchema } from "@/modules/outbound/schemas";

describe("normalizePhone", () => {
  it("returns null for empty input", () => {
    expect(normalizePhone(null)).toBeNull();
    expect(normalizePhone(undefined)).toBeNull();
    expect(normalizePhone("")).toBeNull();
    expect(normalizePhone("   ")).toBeNull();
  });

  it("accepts and preserves + prefixed numbers", () => {
    expect(normalizePhone("+15551234567")).toBe("+15551234567");
    expect(normalizePhone(" +44 20 7946 0000 ")).toBe("+442079460000");
  });

  it("prepends +1 for 10-digit US numbers", () => {
    expect(normalizePhone("(555) 123-4567")).toBe("+15551234567");
    expect(normalizePhone("555.123.4567")).toBe("+15551234567");
  });

  it("prepends + for 11-digit numbers starting with 1", () => {
    expect(normalizePhone("1-555-123-4567")).toBe("+15551234567");
  });
});

describe("normalizeEmail", () => {
  it("lowercases and validates", () => {
    expect(normalizeEmail("  JANE@EXAMPLE.COM ")).toBe("jane@example.com");
  });

  it("rejects strings that don't match email shape", () => {
    expect(normalizeEmail("not-an-email")).toBeNull();
    expect(normalizeEmail("missing@tld")).toBeNull();
    expect(normalizeEmail("")).toBeNull();
    expect(normalizeEmail(null)).toBeNull();
  });
});

describe("readTwilioConfig", () => {
  it("returns null when any required var is missing", () => {
    expect(readTwilioConfig({} as NodeJS.ProcessEnv)).toBeNull();
    expect(
      readTwilioConfig({
        TWILIO_ACCOUNT_SID: "sid",
        TWILIO_AUTH_TOKEN: "tok",
      } as unknown as NodeJS.ProcessEnv),
    ).toBeNull();
  });

  it("returns a config when all vars are set", () => {
    const cfg = readTwilioConfig({
      TWILIO_ACCOUNT_SID: "sid",
      TWILIO_AUTH_TOKEN: "tok",
      TWILIO_FROM_NUMBER: "+15550000000",
    } as unknown as NodeJS.ProcessEnv);
    expect(cfg).toEqual({
      accountSid: "sid",
      authToken: "tok",
      fromNumber: "+15550000000",
    });
  });
});

describe("readResendConfig", () => {
  it("returns null without an API key", () => {
    expect(readResendConfig({} as NodeJS.ProcessEnv)).toBeNull();
  });

  it("falls back to EMAIL_FROM when RESEND_FROM_ADDRESS is absent", () => {
    const cfg = readResendConfig({
      RESEND_API_KEY: "re_123",
      EMAIL_FROM: "ops@example.com",
    } as unknown as NodeJS.ProcessEnv);
    expect(cfg).toEqual({ apiKey: "re_123", fromAddress: "ops@example.com" });
  });

  it("prefers RESEND_FROM_ADDRESS over EMAIL_FROM", () => {
    const cfg = readResendConfig({
      RESEND_API_KEY: "re_123",
      RESEND_FROM_ADDRESS: "notify@example.com",
      EMAIL_FROM: "ops@example.com",
    } as unknown as NodeJS.ProcessEnv);
    expect(cfg?.fromAddress).toBe("notify@example.com");
  });
});

describe("sendSms", () => {
  const origFetch = globalThis.fetch;
  afterEach(() => {
    globalThis.fetch = origFetch;
    vi.restoreAllMocks();
  });

  it("returns not_configured when env is missing", async () => {
    const fetchSpy = vi.fn();
    globalThis.fetch = fetchSpy as unknown as typeof fetch;
    const res = await sendSms({ to: "+15551234567", body: "hi" }, null);
    expect(res.ok).toBe(false);
    expect(res).toMatchObject({
      error: "not_configured",
      providerStatus: "failed",
    });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("returns invalid_number for unusable phone input", async () => {
    const fetchSpy = vi.fn();
    globalThis.fetch = fetchSpy as unknown as typeof fetch;
    const res = await sendSms(
      { to: "", body: "hi" },
      { accountSid: "sid", authToken: "tok", fromNumber: "+15550000000" },
    );
    expect(res).toMatchObject({ ok: false, error: "invalid_number" });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("posts to Twilio and returns the message sid on success", async () => {
    const fetchSpy = vi.fn(async () => ({
      ok: true,
      status: 201,
      json: async () => ({ sid: "SM123", status: "queued" }),
    }));
    globalThis.fetch = fetchSpy as unknown as typeof fetch;

    const res = await sendSms(
      { to: "(555) 123-4567", body: "hello" },
      { accountSid: "sid", authToken: "tok", fromNumber: "+15550000000" },
    );
    expect(res).toEqual({
      ok: true,
      externalId: "SM123",
      providerStatus: "queued",
    });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toContain("/Accounts/sid/Messages.json");
    expect(String(init.body)).toContain("To=%2B15551234567");
    expect(String(init.body)).toContain("From=%2B15550000000");
    expect((init.headers as Record<string, string>).Authorization).toMatch(
      /^Basic /,
    );
  });

  it("surfaces provider errors with message + status", async () => {
    const fetchSpy = vi.fn(async () => ({
      ok: false,
      status: 400,
      json: async () => ({
        code: 21211,
        message: "The 'To' number is not a valid phone number.",
        status: "failed",
      }),
    }));
    globalThis.fetch = fetchSpy as unknown as typeof fetch;
    const res = await sendSms(
      { to: "+15551234567", body: "hi" },
      { accountSid: "sid", authToken: "tok", fromNumber: "+15550000000" },
    );
    expect(res).toMatchObject({
      ok: false,
      errorCode: "21211",
      providerStatus: "failed",
    });
    expect(res.ok === false && res.error).toContain("not a valid");
  });

  it("handles network exceptions", async () => {
    const fetchSpy = vi.fn(async () => {
      throw new Error("ECONNRESET");
    });
    globalThis.fetch = fetchSpy as unknown as typeof fetch;
    const res = await sendSms(
      { to: "+15551234567", body: "hi" },
      { accountSid: "sid", authToken: "tok", fromNumber: "+15550000000" },
    );
    expect(res).toMatchObject({
      ok: false,
      error: "ECONNRESET",
      providerStatus: "failed",
    });
  });
});

describe("sendEmail", () => {
  const origFetch = globalThis.fetch;
  afterEach(() => {
    globalThis.fetch = origFetch;
    vi.restoreAllMocks();
  });

  it("returns not_configured when env is missing", async () => {
    const res = await sendEmail(
      { to: "a@b.com", subject: "s", body: "b" },
      null,
    );
    expect(res).toMatchObject({
      ok: false,
      error: "not_configured",
      providerStatus: "failed",
    });
  });

  it("returns invalid_address when email shape is bad", async () => {
    const fetchSpy = vi.fn();
    globalThis.fetch = fetchSpy as unknown as typeof fetch;
    const res = await sendEmail(
      { to: "not-an-email", subject: "s", body: "b" },
      { apiKey: "re_123", fromAddress: "ops@example.com" },
    );
    expect(res).toMatchObject({
      ok: false,
      error: "invalid_address",
      providerStatus: "invalid_address",
    });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("posts JSON and returns the message id on success", async () => {
    const fetchSpy = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({ id: "re_abc" }),
    }));
    globalThis.fetch = fetchSpy as unknown as typeof fetch;
    const res = await sendEmail(
      { to: "Jane@Example.com", subject: "hi", body: "hello\nworld" },
      { apiKey: "re_123", fromAddress: "ops@example.com" },
    );
    expect(res).toEqual({
      ok: true,
      externalId: "re_abc",
      providerStatus: "sent",
    });
    const [url, init] = fetchSpy.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://api.resend.com/emails");
    const sentBody = JSON.parse(String(init.body)) as Record<string, unknown>;
    expect(sentBody.to).toBe("jane@example.com");
    expect(sentBody.subject).toBe("hi");
    expect(sentBody.html).toContain("hello<br/>world");
  });

  it("surfaces provider errors", async () => {
    const fetchSpy = vi.fn(async () => ({
      ok: false,
      status: 422,
      json: async () => ({ name: "validation_error", message: "from missing" }),
    }));
    globalThis.fetch = fetchSpy as unknown as typeof fetch;
    const res = await sendEmail(
      { to: "a@b.com", subject: "s", body: "b" },
      { apiKey: "re_123", fromAddress: "ops@example.com" },
    );
    expect(res).toMatchObject({
      ok: false,
      errorCode: "validation_error",
      providerStatus: "failed",
    });
  });
});

describe("sendContactSchema", () => {
  it("requires subject for EMAIL but not for SMS", () => {
    const smsOk = sendContactSchema.safeParse({
      channel: "SMS",
      body: "hi",
    });
    expect(smsOk.success).toBe(true);

    const emailNoSubject = sendContactSchema.safeParse({
      channel: "EMAIL",
      body: "hi",
    });
    expect(emailNoSubject.success).toBe(false);

    const emailOk = sendContactSchema.safeParse({
      channel: "EMAIL",
      body: "hi",
      subject: "Your claim",
    });
    expect(emailOk.success).toBe(true);
  });

  it("rejects empty body", () => {
    const r = sendContactSchema.safeParse({ channel: "SMS", body: "  " });
    expect(r.success).toBe(false);
  });

  it("rejects channels that aren't sendable", () => {
    const r = sendContactSchema.safeParse({ channel: "CALL", body: "hi" });
    expect(r.success).toBe(false);
  });
});
