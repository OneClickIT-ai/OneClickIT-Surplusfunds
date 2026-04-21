import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

import {
  dispatchProviderSend,
  isEmailProviderConfigured,
  isSmsProviderConfigured,
  sendEmailViaResend,
  sendSmsViaTwilio,
} from "@/modules/outbound/server/providers";
import { sendContactSchema } from "@/modules/outbound/schemas";

const ORIGINAL_ENV = { ...process.env };

function clearProviderEnv() {
  delete process.env.TWILIO_ACCOUNT_SID;
  delete process.env.TWILIO_AUTH_TOKEN;
  delete process.env.TWILIO_FROM_NUMBER;
  delete process.env.RESEND_API_KEY;
  delete process.env.RESEND_FROM;
}

describe("provider config detection", () => {
  beforeEach(() => {
    clearProviderEnv();
  });
  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    vi.restoreAllMocks();
  });

  it("SMS is unconfigured when any twilio env var is missing", () => {
    expect(isSmsProviderConfigured()).toBe(false);
    process.env.TWILIO_ACCOUNT_SID = "ACxxx";
    expect(isSmsProviderConfigured()).toBe(false);
    process.env.TWILIO_AUTH_TOKEN = "token";
    expect(isSmsProviderConfigured()).toBe(false);
    process.env.TWILIO_FROM_NUMBER = "+15555551234";
    expect(isSmsProviderConfigured()).toBe(true);
  });

  it("Email is unconfigured when any resend env var is missing", () => {
    expect(isEmailProviderConfigured()).toBe(false);
    process.env.RESEND_API_KEY = "re_xxx";
    expect(isEmailProviderConfigured()).toBe(false);
    process.env.RESEND_FROM = "noreply@example.com";
    expect(isEmailProviderConfigured()).toBe(true);
  });
});

describe("dispatchProviderSend dry-run fallback", () => {
  beforeEach(() => {
    clearProviderEnv();
  });
  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    vi.restoreAllMocks();
  });

  it("returns dry_run without calling fetch when SMS provider not configured", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const result = await dispatchProviderSend("SMS", {
      to: "+15555551234",
      body: "hi",
    });
    expect(result.status).toBe("dry_run");
    expect(result.externalId).toBeNull();
    expect(result.error).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("returns dry_run without calling fetch when Email provider not configured", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const result = await dispatchProviderSend("EMAIL", {
      to: "a@b.com",
      subject: "hi",
      body: "hi",
    });
    expect(result.status).toBe("dry_run");
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe("sendSmsViaTwilio with provider configured", () => {
  beforeEach(() => {
    clearProviderEnv();
    process.env.TWILIO_ACCOUNT_SID = "ACxxx";
    process.env.TWILIO_AUTH_TOKEN = "token";
    process.env.TWILIO_FROM_NUMBER = "+15555551234";
  });
  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    vi.restoreAllMocks();
  });

  it("returns sent + externalId on 2xx", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ sid: "SM123", status: "queued" }), {
        status: 201,
      }),
    );
    const res = await sendSmsViaTwilio({ to: "+15555550000", body: "hi" });
    expect(res.status).toBe("sent");
    expect(res.externalId).toBe("SM123");
    expect(res.providerStatus).toBe("queued");
    expect(res.error).toBeNull();
  });

  it("returns failed with http_ status on non-2xx", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("bad number", { status: 400 }),
    );
    const res = await sendSmsViaTwilio({ to: "bad", body: "hi" });
    expect(res.status).toBe("failed");
    expect(res.providerStatus).toBe("http_400");
    expect(res.externalId).toBeNull();
    expect(res.error).toContain("bad number");
  });

  it("returns failed on network error — never throws", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("boom"));
    const res = await sendSmsViaTwilio({ to: "+15555550000", body: "hi" });
    expect(res.status).toBe("failed");
    expect(res.providerStatus).toBe("network_error");
    expect(res.error).toBe("boom");
  });
});

describe("sendEmailViaResend with provider configured", () => {
  beforeEach(() => {
    clearProviderEnv();
    process.env.RESEND_API_KEY = "re_xxx";
    process.env.RESEND_FROM = "noreply@example.com";
  });
  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    vi.restoreAllMocks();
  });

  it("returns sent + id on 2xx", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ id: "re_1" }), { status: 200 }),
    );
    const res = await sendEmailViaResend({
      to: "a@b.com",
      subject: "hi",
      body: "hi",
    });
    expect(res.status).toBe("sent");
    expect(res.externalId).toBe("re_1");
  });

  it("returns failed on provider error response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ message: "invalid api key" }), {
        status: 401,
      }),
    );
    const res = await sendEmailViaResend({
      to: "a@b.com",
      subject: "hi",
      body: "hi",
    });
    expect(res.status).toBe("failed");
    expect(res.providerStatus).toBe("http_401");
    expect(res.error).toContain("invalid api key");
  });
});

describe("sendContactSchema", () => {
  it("requires a non-empty body", () => {
    const r = sendContactSchema.safeParse({ channel: "SMS", body: "   " });
    expect(r.success).toBe(false);
  });

  it("rejects CALL channel — not sendable today", () => {
    const r = sendContactSchema.safeParse({ channel: "CALL", body: "hi" });
    expect(r.success).toBe(false);
  });

  it("accepts SMS without a `to` (server falls back to claimant phone)", () => {
    const r = sendContactSchema.safeParse({ channel: "SMS", body: "hi" });
    expect(r.success).toBe(true);
  });

  it("trims body and caps length", () => {
    const long = "x".repeat(2500);
    const r = sendContactSchema.safeParse({ channel: "EMAIL", body: long });
    expect(r.success).toBe(false);
  });

  it("empty `to` and `subject` collapse to undefined", () => {
    const r = sendContactSchema.parse({
      channel: "EMAIL",
      to: "   ",
      subject: "   ",
      body: "hello",
    });
    expect(r.to).toBeUndefined();
    expect(r.subject).toBeUndefined();
  });
});
