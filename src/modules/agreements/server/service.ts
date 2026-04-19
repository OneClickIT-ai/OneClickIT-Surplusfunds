import { prisma } from "@/lib/prisma";
import type { AgreementStatus, AgreementType, Prisma } from "@prisma/client";
import type {
  AgreementsQueryInput,
  CreateAgreementInput,
  UpdateAgreementInput,
} from "../schemas";
import { renderAgreement } from "./render";
import { sendForSignature } from "./esign";

export interface ActorContext {
  userId: string;
  role: string;
  name: string;
}

const DEFAULT_FEE_PERCENT = Number(process.env.DEFAULT_FEE_PERCENT ?? 30);

/** Visibility: admins see all; everyone else sees agreements on cases they own/are assigned to. */
function visibilityScope(actor: ActorContext): Prisma.AgreementWhereInput {
  if (actor.role === "admin") return {};
  return {
    claim: {
      OR: [{ userId: actor.userId }, { assigneeId: actor.userId }],
    },
  };
}

function mergeWhere(
  a: Prisma.AgreementWhereInput,
  b: Prisma.AgreementWhereInput,
): Prisma.AgreementWhereInput {
  const aEmpty = !a || Object.keys(a).length === 0;
  const bEmpty = !b || Object.keys(b).length === 0;
  if (aEmpty) return b;
  if (bEmpty) return a;
  return { AND: [a, b] };
}

export async function listAgreements(
  input: AgreementsQueryInput,
  actor: ActorContext,
) {
  const { page, limit } = input;
  const skip = (page - 1) * limit;
  const filters: Prisma.AgreementWhereInput = {
    ...(input.status ? { status: input.status } : {}),
    ...(input.type ? { type: input.type } : {}),
    ...(input.claimId ? { claimId: input.claimId } : {}),
  };
  const where = mergeWhere(visibilityScope(actor), filters);
  const [items, total] = await Promise.all([
    prisma.agreement.findMany({
      where,
      include: {
        claim: { select: { id: true, ownerName: true, countyName: true, state: true } },
        claimant: { select: { id: true, fullName: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.agreement.count({ where }),
  ]);
  return { data: items, page, limit, total, totalPages: Math.ceil(total / limit) };
}

const agreementDetailInclude = {
  claim: {
    select: {
      id: true,
      ownerName: true,
      countyName: true,
      state: true,
      userId: true,
      assigneeId: true,
    },
  },
  claimant: true,
} satisfies Prisma.AgreementInclude;

export type AgreementDetail = Prisma.AgreementGetPayload<{
  include: typeof agreementDetailInclude;
}>;

export type GetAgreementResult =
  | { notFound: true }
  | { agreement: AgreementDetail };

export async function getAgreement(
  id: string,
  actor: ActorContext,
): Promise<GetAgreementResult> {
  const agreement = await prisma.agreement.findFirst({
    where: mergeWhere(visibilityScope(actor), { id }),
    include: agreementDetailInclude,
  });
  if (!agreement) return { notFound: true };
  return { agreement };
}

export type CreateAgreementResult =
  | { notFound: true }
  | { forbidden: true }
  | { agreement: Awaited<ReturnType<typeof prisma.agreement.create>> };

/**
 * Draft an agreement: render template, persist as DRAFT. Does not send.
 * Caller must own or be assigned to the parent case (admins always allowed).
 */
export async function createAgreement(
  input: CreateAgreementInput,
  actor: ActorContext,
): Promise<CreateAgreementResult> {
  const claim = await prisma.claim.findUnique({
    where: { id: input.claimId },
    select: {
      id: true,
      userId: true,
      assigneeId: true,
      claimantId: true,
      feePercent: true,
    },
  });
  if (!claim) return { notFound: true };
  if (
    actor.role !== "admin" &&
    claim.userId !== actor.userId &&
    claim.assigneeId !== actor.userId
  ) {
    return { forbidden: true };
  }

  const feePercent =
    input.feePercent ?? claim.feePercent ?? DEFAULT_FEE_PERCENT;

  const rendered = await renderAgreement(
    claim.id,
    input.type as AgreementType,
    feePercent,
    actor.name || "Agent",
  );
  if (!rendered) return { notFound: true };

  const agreement = await prisma.agreement.create({
    data: {
      claimId: claim.id,
      claimantId: input.claimantId ?? claim.claimantId ?? null,
      type: input.type as AgreementType,
      status: "DRAFT",
      feePercent,
      renderedText: rendered.text,
    },
    include: {
      claim: { select: { id: true, ownerName: true, countyName: true, state: true } },
      claimant: { select: { id: true, fullName: true, email: true } },
    },
  });
  return { agreement };
}

export type UpdateAgreementResult =
  | { notFound: true }
  | { forbidden: true }
  | { agreement: Awaited<ReturnType<typeof prisma.agreement.update>> };

export async function updateAgreement(
  id: string,
  input: UpdateAgreementInput,
  actor: ActorContext,
): Promise<UpdateAgreementResult> {
  const existing = await prisma.agreement.findFirst({
    where: { id },
    include: {
      claim: { select: { userId: true, assigneeId: true } },
    },
  });
  if (!existing) return { notFound: true };

  const canEdit =
    actor.role === "admin" ||
    existing.claim.userId === actor.userId ||
    existing.claim.assigneeId === actor.userId;
  if (!canEdit) return { forbidden: true };

  const data: Prisma.AgreementUpdateInput = {
    ...(input.status !== undefined ? { status: input.status as AgreementStatus } : {}),
    ...(input.feePercent !== undefined ? { feePercent: input.feePercent } : {}),
    ...(input.signedAt !== undefined
      ? { signedAt: input.signedAt ? new Date(input.signedAt) : null }
      : {}),
    ...(input.viewedAt !== undefined
      ? { viewedAt: input.viewedAt ? new Date(input.viewedAt) : null }
      : {}),
  };

  const agreement = await prisma.agreement.update({
    where: { id },
    data,
    include: {
      claim: { select: { id: true, ownerName: true, countyName: true, state: true } },
      claimant: { select: { id: true, fullName: true, email: true } },
    },
  });
  return { agreement };
}

/**
 * Move an agreement to SENT. Currently hits the e-sign placeholder provider.
 * Will start returning real provider URLs once esign.ts is wired up.
 */
export type SendAgreementFlowResult =
  | { notFound: true }
  | { forbidden: true }
  | { badState: true; reason: string }
  | { agreement: Awaited<ReturnType<typeof prisma.agreement.update>> };

export async function sendAgreement(
  id: string,
  actor: ActorContext,
): Promise<SendAgreementFlowResult> {
  const existing = await prisma.agreement.findFirst({
    where: { id },
    include: {
      claim: { select: { userId: true, assigneeId: true } },
      claimant: true,
    },
  });
  if (!existing) return { notFound: true };

  const canEdit =
    actor.role === "admin" ||
    existing.claim.userId === actor.userId ||
    existing.claim.assigneeId === actor.userId;
  if (!canEdit) return { forbidden: true };

  if (existing.status !== "DRAFT") {
    return { badState: true, reason: `cannot send from status ${existing.status}` };
  }
  const email = existing.claimant?.email;
  if (!email) {
    return {
      badState: true,
      reason: "agreement's claimant has no email on file",
    };
  }

  const sig = await sendForSignature({
    agreementId: existing.id,
    signerEmail: email,
    signerName: existing.claimant?.fullName ?? "Claimant",
    subject: `Please sign: ${existing.type}`,
    body: existing.renderedText ?? "",
  });

  const agreement = await prisma.agreement.update({
    where: { id: existing.id },
    data: {
      status: "SENT",
      sentAt: new Date(),
      eSignUrl: sig.eSignUrl,
      eSignProvider: sig.provider,
      externalId: sig.externalId,
    },
    include: {
      claim: { select: { id: true, ownerName: true, countyName: true, state: true } },
      claimant: { select: { id: true, fullName: true, email: true } },
    },
  });
  return { agreement };
}

/** Mark SIGNED. Admin-only in v1 (a real integration flips this from a webhook). */
export async function markSigned(
  id: string,
  actor: ActorContext,
): Promise<UpdateAgreementResult> {
  if (actor.role !== "admin") return { forbidden: true };
  const existing = await prisma.agreement.findUnique({ where: { id } });
  if (!existing) return { notFound: true };
  const agreement = await prisma.agreement.update({
    where: { id },
    data: { status: "SIGNED", signedAt: new Date() },
    include: {
      claim: { select: { id: true, ownerName: true, countyName: true, state: true } },
      claimant: { select: { id: true, fullName: true, email: true } },
    },
  });
  return { agreement };
}
