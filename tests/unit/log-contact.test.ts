import { describe, it, expect, beforeEach, vi } from "vitest";

const { prismaMock, seedMock } = vi.hoisted(() => ({
  prismaMock: {
    claim: { findUnique: vi.fn() },
    contactLog: { create: vi.fn() },
    task: { findFirst: vi.fn(), create: vi.fn() },
  },
  seedMock: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/modules/tasks/server/autogen", () => ({
  seedContactFailureFollowUpTask: seedMock,
}));

import { logContact } from "@/modules/outbound/server/log-contact";

const goodClaim = {
  userId: "owner-1",
  assigneeId: "assignee-1",
  claimantId: "c-1",
};

const baseInput = {
  channel: "CALL" as const,
  direction: "outbound" as const,
  status: "answered",
} satisfies Record<string, unknown>;

describe("logContact", () => {
  beforeEach(() => {
    prismaMock.claim.findUnique.mockReset();
    prismaMock.contactLog.create.mockReset();
    seedMock.mockReset();
  });

  it("returns notFound when the claim doesn't exist", async () => {
    prismaMock.claim.findUnique.mockResolvedValueOnce(null);
    const result = await logContact("missing", baseInput, {
      userId: "u1",
      role: "user",
    });
    expect(result).toEqual({ notFound: true });
    expect(prismaMock.contactLog.create).not.toHaveBeenCalled();
  });

  it("returns forbidden when actor is neither owner, assignee, nor admin", async () => {
    prismaMock.claim.findUnique.mockResolvedValueOnce(goodClaim);
    const result = await logContact("claim-1", baseInput, {
      userId: "outsider",
      role: "user",
    });
    expect(result).toEqual({ forbidden: true });
    expect(prismaMock.contactLog.create).not.toHaveBeenCalled();
  });

  it("allows the owner to log a successful contact — no follow-up task created", async () => {
    prismaMock.claim.findUnique.mockResolvedValueOnce(goodClaim);
    prismaMock.contactLog.create.mockResolvedValueOnce({
      id: "log-1",
      channel: "CALL",
      direction: "outbound",
      status: "answered",
    });

    const result = await logContact("claim-1", baseInput, {
      userId: "owner-1",
      role: "user",
    });

    expect("contactLog" in result && result.contactLog.id).toBe("log-1");
    expect("followUpTaskId" in result && result.followUpTaskId).toBeNull();
    expect(seedMock).not.toHaveBeenCalled();
  });

  it("seeds a follow-up task when an outbound call hits voicemail", async () => {
    prismaMock.claim.findUnique.mockResolvedValueOnce(goodClaim);
    prismaMock.contactLog.create.mockResolvedValueOnce({
      id: "log-2",
      channel: "CALL",
      direction: "outbound",
      status: "voicemail",
    });
    seedMock.mockResolvedValueOnce("task-99");

    const result = await logContact(
      "claim-1",
      { ...baseInput, status: "voicemail" },
      { userId: "owner-1", role: "user" },
    );
    expect("followUpTaskId" in result && result.followUpTaskId).toBe("task-99");
    expect(seedMock).toHaveBeenCalledOnce();
    const seedArgs = seedMock.mock.calls[0][0];
    expect(seedArgs.claimId).toBe("claim-1");
    expect(seedArgs.contactLogId).toBe("log-2");
    expect(seedArgs.status).toBe("voicemail");
    // Assignee wins over owner for the follow-up assignee.
    expect(seedArgs.assigneeId).toBe("assignee-1");
  });

  it("admin can act on any claim regardless of ownership", async () => {
    prismaMock.claim.findUnique.mockResolvedValueOnce({
      userId: "someone-else",
      assigneeId: "someone-else-too",
      claimantId: null,
    });
    prismaMock.contactLog.create.mockResolvedValueOnce({
      id: "log-3",
      channel: "SMS",
      direction: "outbound",
      status: "sent",
    });
    const result = await logContact(
      "claim-1",
      { ...baseInput, channel: "SMS", status: "sent" },
      { userId: "admin-1", role: "admin" },
    );
    expect("contactLog" in result).toBe(true);
  });

  it("does not fail the log when the follow-up seeder throws", async () => {
    prismaMock.claim.findUnique.mockResolvedValueOnce(goodClaim);
    prismaMock.contactLog.create.mockResolvedValueOnce({
      id: "log-4",
      channel: "CALL",
      direction: "outbound",
      status: "no answer",
    });
    seedMock.mockRejectedValueOnce(new Error("db down"));
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await logContact(
      "claim-1",
      { ...baseInput, status: "no answer" },
      { userId: "owner-1", role: "user" },
    );

    expect("contactLog" in result).toBe(true);
    expect("followUpTaskId" in result && result.followUpTaskId).toBeNull();
    consoleSpy.mockRestore();
  });
});
