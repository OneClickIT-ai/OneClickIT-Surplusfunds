import { randomBytes } from "node:crypto";

import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

const portalClaimInclude = {
  claimant: {
    select: { id: true, fullName: true, email: true, phone: true },
  },
  agreements: {
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      type: true,
      status: true,
      feePercent: true,
      renderedText: true,
      sentAt: true,
      signedAt: true,
      createdAt: true,
    },
  },
} satisfies Prisma.ClaimInclude;

export type PortalClaim = Prisma.ClaimGetPayload<{
  include: typeof portalClaimInclude;
}>;

const DEFAULT_TTL_DAYS = 90;

/** URL-safe random token — 32 bytes = ~43 chars of base64url. */
function newToken(): string {
  return randomBytes(32).toString("base64url");
}

export interface ActorContext {
  userId: string;
  role: string;
}

function canManage(
  claim: { userId: string | null; assigneeId: string | null },
  actor: ActorContext,
): boolean {
  if (actor.role === "admin") return true;
  if (claim.userId === actor.userId) return true;
  if (claim.assigneeId === actor.userId) return true;
  return false;
}

export type IssuePortalTokenResult =
  | { notFound: true }
  | { forbidden: true }
  | { token: string; expiresAt: Date; url: string };

/**
 * Mint (or rotate) a portal token for a case. Revokes existing active tokens
 * for the claim so only one is valid at a time — keeps the surface area tiny
 * and makes "send a new link" trivially safe.
 */
export async function issuePortalToken(
  claimId: string,
  actor: ActorContext,
  opts: { ttlDays?: number } = {},
): Promise<IssuePortalTokenResult> {
  const claim = await prisma.claim.findUnique({
    where: { id: claimId },
    select: {
      id: true,
      userId: true,
      assigneeId: true,
      claimantId: true,
    },
  });
  if (!claim) return { notFound: true };
  if (!canManage(claim, actor)) return { forbidden: true };

  const ttlDays = opts.ttlDays ?? DEFAULT_TTL_DAYS;
  const expiresAt = new Date(Date.now() + ttlDays * 86_400_000);

  // Revoke anything previously live for this claim.
  await prisma.portalToken.updateMany({
    where: {
      claimId: claim.id,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
    data: { revokedAt: new Date() },
  });

  const token = newToken();
  await prisma.portalToken.create({
    data: {
      token,
      claimId: claim.id,
      claimantId: claim.claimantId,
      expiresAt,
    },
  });

  const base = process.env.NEXTAUTH_URL || "";
  return {
    token,
    expiresAt,
    url: `${base}/portal/${token}`,
  };
}

/**
 * Validate a raw token and return the associated claim payload. Also bumps
 * lastViewedAt / viewCount. Returns null for any invalid / revoked / expired
 * token — callers should surface a generic 404 and never leak why.
 */
export async function resolvePortalToken(raw: string): Promise<{
  tokenRow: { id: string; claimId: string; expiresAt: Date };
  claim: PortalClaim;
} | null> {
  if (!raw || raw.length < 16) return null;

  const tokenRow = await prisma.portalToken.findUnique({
    where: { token: raw },
    select: {
      id: true,
      claimId: true,
      expiresAt: true,
      revokedAt: true,
    },
  });
  if (!tokenRow) return null;
  if (tokenRow.revokedAt) return null;
  if (tokenRow.expiresAt <= new Date()) return null;

  const claim = await prisma.claim.findUnique({
    where: { id: tokenRow.claimId },
    include: portalClaimInclude,
  });
  if (!claim) return null;

  // Fire-and-forget view tracker — don't block the response on it.
  void prisma.portalToken
    .update({
      where: { id: tokenRow.id },
      data: { lastViewedAt: new Date(), viewCount: { increment: 1 } },
    })
    .catch((e) => {
      console.error("[portal] view tracker update failed", e);
    });

  return {
    tokenRow: {
      id: tokenRow.id,
      claimId: tokenRow.claimId,
      expiresAt: tokenRow.expiresAt,
    },
    claim,
  };
}

export type PortalSignResult =
  | { notFound: true }
  | { badState: true; reason: string }
  | { agreementId: string; signedAt: Date };

/**
 * Sign an agreement via the portal. Accepts a typed full name as the
 * signature payload (v1). Only succeeds if the agreement is on the claim the
 * token belongs to, is in SENT/VIEWED state, and the typed name is non-empty.
 */
export async function portalSignAgreement(
  raw: string,
  agreementId: string,
  typedName: string,
): Promise<PortalSignResult> {
  const trimmed = typedName.trim();
  if (trimmed.length < 2) {
    return { badState: true, reason: "typed name is required" };
  }

  const resolved = await resolvePortalToken(raw);
  if (!resolved) return { notFound: true };

  const agreement = resolved.claim.agreements.find((a) => a.id === agreementId);
  if (!agreement) return { notFound: true };

  if (agreement.status === "SIGNED") {
    return {
      badState: true,
      reason: "already signed",
    };
  }
  if (agreement.status !== "SENT" && agreement.status !== "VIEWED") {
    return {
      badState: true,
      reason: `cannot sign from status ${agreement.status}`,
    };
  }

  const now = new Date();
  await prisma.agreement.update({
    where: { id: agreementId },
    data: {
      status: "SIGNED",
      signedAt: now,
      renderedText: `${agreement.renderedText ?? ""}\n\n--- SIGNED ---\nSigner (typed): ${trimmed}\nAt: ${now.toISOString()}\nVia: portal`,
    },
  });

  return { agreementId, signedAt: now };
}
