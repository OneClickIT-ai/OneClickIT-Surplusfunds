import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { isFailedContactStatus } from "@/modules/outbound/follow-up";
import { sendOutboundSchema } from "@/modules/outbound/schemas";
import {
  classifyTwilioStatus,
  sendTwilioSms,
} from "@/modules/outbound/server/providers/twilio";
import { sendResendEmail } from "@/modules/outbound/server/providers/resend";

describe("classifyTwilioStatus", () => {
  it("treats delivered/queued/sending/sent as ok", () => {
    for (const s of ["delivered", "queued", "sending", "sent"]) {
      expect(classifyTwilioStatus(s).ok).toBe(true);
    }
    expect(classifyTwilioStatus("delivered").status).toBe("delivered");
    expect(classifyTwilioStatus("sent").status).toBe("sent");
  });

  it("classifies undelivered/failed/unknown as failures", () => {
    expect(classifyTwilioStatus("undelivered")).toEqual({
      ok: false,
      status: "undeliverable",
    });
    expect(classifyTwilioStatus("failed")).toEqual({
      ok: false,
      status: "failed",
    });
    expect(classifyTwilioStatus(null)).toEqual({
      ok: false,
      status: "failed",
    });
    expect(classifyTwilioStatus("weird-state")).toEqual({
      ok: false,
      status: "failed",
    });
  });

  it("emits status tokens that the follow-up classifier flags as failures", () => {
    expect(isFailedContactStatus(classifyTwilioStatus("undelivered").status)).toBe(true);
    expect(isFailedContactStatus(classifyTwilioStatus("failed").status)).toBe(true);
    expect(isFailedContactStatus(classifyTwilioStatus("delivered").status)).toBe(false);
    expect(isFailedContactStatus(classifyTwilioStatus("sent").status)).toBe(false);
  });
});

describe("sendOutboundSchema", () => {
  it("requires a body", () => {
    const r = sendOutboundSchema.safeParse({ channel: "SMS" });
    expect(r.success).toBe(false);
  });

  it("requires a subject for EMAIL", () => {
    const r = sendOutboundSchema.safeParse({
      channel: "EMAIL",
      body: "hello",
    });
    expect(r.success).toBe(false);
  });

  it("does not require subject for SMS", () => {
    const r = sendOutboundSchema.safeParse({
      channel: "SMS",
      body: "hello",
    });
    expect(r.success).toBe(true);
  });

  it("rejects channels that aren't SMS or EMAIL", () => {
    const r = sendOutboundSchema.safeParse({
      channel: "CALL",
      body: "ring ring",
    });
    expect(r.success).toBe(false);
  });

  it("treats blank `to` as omitted (falls back to claimant)", () => {
    const r = sendOutboundSchema.safeParse({
      channel: "SMS",
      to: "  ",
      body: "hi",
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.to).toBeUndefined();
    }
  });
});

describe("sendTwilioSms", () => {
  const fetchMock = vi.fn();
  const config = {
    accountSid: "AC123",
    authToken: "token",
    from: "+15550000000",
  };

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => {
    fetchMock.mockReset();
    vi.unstubAllGlobals();
  });

  it("returns ok=true with externalId on a 201 response", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 201,
      statusText: "Created",
      json: async () => ({ sid: "SM_abc", status: "queued" }),
    });

    const result = await sendTwilioSms(
      { to: "+15551234567", body: "hello" },
      config,
    );
    expect(result.ok).toBe(true);
    expect(result.status).toBe("sent");
    expect(result.externalId).toBe("SM_abc");
  });

  it("returns ok=false with status='failed' when Twilio returns 4xx", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 400,
      statusText: "Bad Request",
      json: async () => ({ code: 21211, message: "Invalid 'To' Phone Number" }),
    });

    const result = await sendTwilioSms(
      { to: "bogus", body: "hi" },
      config,
    );
    expect(result.ok).toBe(false);
    expect(result.status).toBe("failed");
    expect(result.errorCode).toBe("21211");
    expect(result.errorMessage).toContain("Invalid");
  });

  it("returns a network_error when fetch throws", async () => {
    fetchMock.mockRejectedValueOnce(new Error("ECONNREFUSED"));
    const result = await sendTwilioSms(
      { to: "+15551234567", body: "hi" },
      config,
    );
    expect(result).toMatchObject({
      ok: false,
      status: "failed",
      externalId: null,
      errorCode: "network_error",
    });
  });
});

describe("sendResendEmail", () => {
  const fetchMock = vi.fn();
  const config = { apiKey: "re_test", from: "noreply@example.com" };

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => {
    fetchMock.mockReset();
    vi.unstubAllGlobals();
  });

  it("returns ok=true with externalId on success", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: "OK",
      json: async () => ({ id: "em_123" }),
    });
    const result = await sendResendEmail(
      { to: "x@y.com", subject: "hi", text: "yo" },
      config,
    );
    expect(result).toMatchObject({
      ok: true,
      status: "sent",
      externalId: "em_123",
    });
  });

  it("classifies 422 / invalid-recipient errors as bounced", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 422,
      statusText: "Unprocessable Entity",
      json: async () => ({
        name: "validation_error",
        message: "Invalid email address",
      }),
    });
    const result = await sendResendEmail(
      { to: "bogus", subject: "hi", text: "yo" },
      config,
    );
    expect(result.ok).toBe(false);
    expect(result.status).toBe("bounced");
    expect(isFailedContactStatus(result.status)).toBe(true);
  });

  it("classifies generic 5xx errors as failed", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: "Server Error",
      json: async () => ({}),
    });
    const result = await sendResendEmail(
      { to: "x@y.com", subject: "hi", text: "yo" },
      config,
    );
    expect(result.ok).toBe(false);
    expect(result.status).toBe("failed");
    expect(isFailedContactStatus(result.status)).toBe(true);
  });
});
