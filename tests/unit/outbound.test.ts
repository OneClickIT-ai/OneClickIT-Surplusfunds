import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

import { normalizePhone } from "@/modules/outbound/server/providers/twilio";
import { looksLikeEmail } from "@/modules/outbound/server/providers/resend";
import { sendContactSchema } from "@/modules/outbound/schemas";

describe("normalizePhone", () => {
  it("adds +1 for a bare US 10-digit number", () => {
    expect(normalizePhone("(555) 123-4567")).toBe("+15551234567");
  });

  it("preserves an explicit +country prefix", () => {
    expect(normalizePhone("+44 20 7946 0018")).toBe("+442079460018");
  });

  it("returns null for empty or digit-less input", () => {
    expect(normalizePhone(null)).toBeNull();
    expect(normalizePhone("")).toBeNull();
    expect(normalizePhone("   ")).toBeNull();
    expect(normalizePhone("abc")).toBeNull();
  });
});

describe("looksLikeEmail", () => {
  it("accepts a typical address", () => {
    expect(looksLikeEmail("name@example.com")).toBe(true);
  });

  it("rejects missing or malformed values", () => {
    expect(looksLikeEmail(null)).toBe(false);
    expect(looksLikeEmail("")).toBe(false);
    expect(looksLikeEmail("not-an-email")).toBe(false);
    expect(looksLikeEmail("a@b")).toBe(false);
  });
});

describe("sendContactSchema", () => {
  it("requires a subject when channel is EMAIL", () => {
    const r = sendContactSchema.safeParse({
      channel: "EMAIL",
      body: "Hello",
    });
    expect(r.success).toBe(false);
  });

  it("accepts SMS without subject", () => {
    const r = sendContactSchema.safeParse({
      channel: "SMS",
      body: "Hello",
    });
    expect(r.success).toBe(true);
  });

  it("rejects empty body", () => {
    const r = sendContactSchema.safeParse({
      channel: "SMS",
      body: "",
    });
    expect(r.success).toBe(false);
  });

  it("caps body at 5000 chars", () => {
    const r = sendContactSchema.safeParse({
      channel: "SMS",
      body: "x".repeat(5001),
    });
    expect(r.success).toBe(false);
  });
});

// ---- sendContact orchestration (pure logic paths with mocked deps) ----

vi.mock("@/lib/prisma", () => ({
  prisma: {
    claim: { findUnique: vi.fn() },
    contactLog: { create: vi.fn() },
    task: { findFirst: vi.fn(), create: vi.fn() },
  },
}));

vi.mock("@sentry/nextjs", () => ({
  captureException: vi.fn(),
}));

import { prisma } from "@/lib/prisma";
import { sendContact } from "@/modules/outbound/server/send-contact";

const actor = { userId: "user-1", role: "admin" };

beforeEach(() => {
  vi.clearAllMocks();
  process.env.TWILIO_ACCOUNT_SID = "AC_test";
  process.env.TWILIO_AUTH_TOKEN = "tok";
  process.env.TWILIO_FROM_NUMBER = "+15550000000";
  process.env.RESEND_API_KEY = "rs_test";
  process.env.RESEND_FROM_ADDRESS = "from@example.com";
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("sendContact", () => {
  it("returns notFound when the claim is missing", async () => {
    (prisma.claim.findUnique as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);
    const res = await sendContact(
      "claim-x",
      { channel: "SMS", body: "hi" },
      actor,
    );
    expect(res).toEqual({ notFound: true });
  });

  it("returns missingRecipient when claimant has no phone and no override", async () => {
    (prisma.claim.findUnique as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      id: "claim-1",
      userId: "user-1",
      assigneeId: null,
      claimantId: "c1",
      claimant: { id: "c1", phone: null, altPhone: null, email: null, fullName: "X" },
    });
    const res = await sendContact(
      "claim-1",
      { channel: "SMS", body: "hi" },
      actor,
    );
    expect(res).toEqual({ missingRecipient: true, channel: "SMS" });
  });

  it("logs success and does not create a follow-up task on SMS send ok", async () => {
    (prisma.claim.findUnique as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      id: "claim-1",
      userId: "user-1",
      assigneeId: null,
      claimantId: "c1",
      claimant: { id: "c1", phone: "5551234567", altPhone: null, email: null, fullName: "X" },
    });
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ sid: "SM1", status: "queued" }), {
          status: 200,
        }),
      );
    (prisma.contactLog.create as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      id: "log-1",
      channel: "SMS",
      status: "sent:queued",
      externalId: "SM1",
    });

    const res = await sendContact(
      "claim-1",
      { channel: "SMS", body: "hi" },
      actor,
    );
    expect("ok" in res && res.ok).toBe(true);
    if ("ok" in res && res.ok) {
      expect(res.send.ok).toBe(true);
      expect(res.followUpTaskCreated).toBe(false);
    }
    expect(fetchSpy).toHaveBeenCalledOnce();
    expect(prisma.task.create).not.toHaveBeenCalled();
  });

  it("logs failure and creates a follow-up task when provider responds with an error", async () => {
    (prisma.claim.findUnique as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      id: "claim-1",
      userId: "user-1",
      assigneeId: null,
      claimantId: "c1",
      claimant: { id: "c1", phone: "5551234567", altPhone: null, email: null, fullName: "X" },
    });
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({ message: "Invalid 'To' Phone Number", code: 21211 }),
        { status: 400 },
      ),
    );
    (prisma.contactLog.create as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      id: "log-2",
      channel: "SMS",
      status: "failed:provider_error",
      externalId: null,
    });
    (prisma.task.findFirst as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);
    (prisma.task.create as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      id: "task-1",
    });

    const res = await sendContact(
      "claim-1",
      { channel: "SMS", body: "hi" },
      actor,
    );
    expect("ok" in res && res.ok).toBe(true);
    if ("ok" in res && res.ok) {
      expect(res.send.ok).toBe(false);
      expect(res.followUpTaskCreated).toBe(true);
    }
    expect(prisma.contactLog.create).toHaveBeenCalledOnce();
    expect(prisma.task.create).toHaveBeenCalledOnce();
  });

  it("records not_configured as a failure when provider env is missing", async () => {
    delete process.env.TWILIO_ACCOUNT_SID;
    (prisma.claim.findUnique as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      id: "claim-1",
      userId: "user-1",
      assigneeId: null,
      claimantId: "c1",
      claimant: { id: "c1", phone: "5551234567", altPhone: null, email: null, fullName: "X" },
    });
    (prisma.contactLog.create as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      id: "log-3",
      channel: "SMS",
      status: "failed:not_configured",
      externalId: null,
    });
    (prisma.task.findFirst as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);
    (prisma.task.create as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      id: "task-2",
    });

    const res = await sendContact(
      "claim-1",
      { channel: "SMS", body: "hi" },
      actor,
    );
    if ("ok" in res && res.ok) {
      expect(res.send.ok).toBe(false);
      if (!res.send.ok) {
        expect(res.send.reason).toBe("not_configured");
      }
      expect(res.followUpTaskCreated).toBe(true);
    } else {
      throw new Error("expected ok-shape result");
    }
  });
});
