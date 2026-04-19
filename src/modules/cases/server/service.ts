import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import type { CreateCaseInput, UpdateCaseInput, CasesQueryInput } from "../schemas";

function parseDate(value?: string | null): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export interface ActorContext {
  userId: string;
  role: string;
}

/** Optional case-shape overrides at conversion time (fee, priority, assignee). */
export interface ConvertLeadOverrides {
  feePercent?: number | null;
  priority?: "low" | "medium" | "high";
  assigneeId?: string | null;
  notes?: string | null;
  requiresCourt?: boolean;
}

export type ConvertLeadResult =
  | { notFound: true }
  | { alreadyConverted: true; existingClaimId: string }
  | { claim: Awaited<ReturnType<typeof prisma.claim.create>> };

/**
 * Convert a SurplusLead into a Claim (case). Atomic: if the case insert
 * fails, the lead status stays NEW. Dedupes on Claim.leadId (unique).
 */
export async function convertLeadToCase(
  leadId: string,
  actor: ActorContext,
  overrides: ConvertLeadOverrides = {},
): Promise<ConvertLeadResult> {
  const lead = await prisma.surplusLead.findUnique({
    where: { id: leadId },
    include: {
      county: { select: { name: true, state: true } },
      claimants: { select: { id: true }, take: 1 },
      claim: { select: { id: true } },
    },
  });

  if (!lead) return { notFound: true };
  if (lead.claim) {
    return { alreadyConverted: true, existingClaimId: lead.claim.id };
  }

  const claim = await prisma.$transaction(async (tx) => {
    const created = await tx.claim.create({
      data: {
        userId: actor.userId,
        assigneeId: overrides.assigneeId ?? null,
        leadId: lead.id,
        claimantId: lead.claimants[0]?.id ?? null,
        countyName: lead.county.name,
        state: lead.county.state,
        ownerName: lead.ownerName,
        propertyAddr: lead.propertyAddr,
        parcelId: lead.parcelId,
        amount: lead.surplusAmount,
        deadlineDate: lead.deadlineDate,
        feePercent: overrides.feePercent ?? null,
        notes: overrides.notes ?? lead.notes ?? null,
        priority: overrides.priority ?? "medium",
        status: "research",
        surplusType: lead.surplusType,
        requiresCourt: overrides.requiresCourt ?? false,
        activities: {
          create: {
            type: "note",
            message: `Case converted from lead ${lead.id}`,
          },
        },
      },
      include: { activities: true, claimant: true, lead: true },
    });

    await tx.surplusLead.update({
      where: { id: lead.id },
      data: { status: "CONVERTED" },
    });

    return created;
  });

  return { claim };
}

/**
 * Access-scoped listing. Admins see all cases; everyone else sees cases they
 * own or are assigned to, plus unowned/unassigned cases (e.g. fresh intakes).
 */
export async function listCases(input: CasesQueryInput, actor: ActorContext) {
  const { page, limit } = input;
  const skip = (page - 1) * limit;

  const scope: Prisma.ClaimWhereInput =
    actor.role === "admin"
      ? {}
      : {
          OR: [
            { userId: actor.userId },
            { assigneeId: actor.userId },
            { AND: [{ userId: null }, { assigneeId: null }] },
          ],
        };

  const filters: Prisma.ClaimWhereInput = {
    ...(input.state ? { state: input.state } : {}),
    ...(input.status ? { status: input.status } : {}),
    ...(input.priority ? { priority: input.priority } : {}),
    ...(input.assigneeId ? { assigneeId: input.assigneeId } : {}),
    ...(input.countyName
      ? { countyName: { contains: input.countyName, mode: "insensitive" } }
      : {}),
    ...(input.surplusType ? { surplusType: input.surplusType } : {}),
    ...(input.q
      ? {
          OR: [
            { ownerName: { contains: input.q, mode: "insensitive" } },
            { propertyAddr: { contains: input.q, mode: "insensitive" } },
            { parcelId: { contains: input.q, mode: "insensitive" } },
            { countyName: { contains: input.q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const where: Prisma.ClaimWhereInput =
    Object.keys(scope).length && Object.keys(filters).length
      ? { AND: [scope, filters] }
      : { ...scope, ...filters };

  const [items, total] = await Promise.all([
    prisma.claim.findMany({
      where,
      include: {
        claimant: true,
        lead: true,
        assignee: { select: { id: true, name: true, email: true, image: true } },
        activities: { orderBy: { createdAt: "desc" }, take: 3 },
        tasks: {
          where: { completedAt: null },
          orderBy: { dueDate: "asc" },
          take: 3,
        },
        agreements: { orderBy: { createdAt: "desc" }, take: 2 },
      },
      orderBy: [{ updatedAt: "desc" }, { deadlineDate: "asc" }],
      skip,
      take: limit,
    }),
    prisma.claim.count({ where }),
  ]);

  return {
    data: items,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}

/** Detail fetch. Same access policy as listCases. */
export async function getCaseById(caseId: string, actor: ActorContext) {
  const visibility: Prisma.ClaimWhereInput =
    actor.role === "admin"
      ? { id: caseId }
      : {
          id: caseId,
          OR: [
            { userId: actor.userId },
            { assigneeId: actor.userId },
            { AND: [{ userId: null }, { assigneeId: null }] },
          ],
        };

  return prisma.claim.findFirst({
    where: visibility,
    include: {
      claimant: true,
      lead: { include: { county: true } },
      assignee: { select: { id: true, name: true, email: true, image: true } },
      activities: { orderBy: { createdAt: "desc" } },
      tasks: { orderBy: [{ completedAt: "asc" }, { dueDate: "asc" }] },
      agreements: { orderBy: { createdAt: "desc" } },
      contactLogs: { orderBy: { createdAt: "desc" } },
    },
  });
}

export interface TimelineEntry {
  id: string;
  at: Date;
  kind: "activity" | "task" | "agreement" | "contact";
  title: string;
  body: string;
  status?: string | null;
}

export interface CaseTimelineResult {
  caseId: string;
  timeline: TimelineEntry[];
}

/** Merged, timestamp-sorted timeline across activities/tasks/agreements/contacts. */
export async function getCaseTimeline(
  caseId: string,
  actor: ActorContext,
): Promise<CaseTimelineResult | null> {
  const visibility: Prisma.ClaimWhereInput =
    actor.role === "admin"
      ? { id: caseId }
      : {
          id: caseId,
          OR: [
            { userId: actor.userId },
            { assigneeId: actor.userId },
            { AND: [{ userId: null }, { assigneeId: null }] },
          ],
        };

  const claim = await prisma.claim.findFirst({
    where: visibility,
    select: {
      id: true,
      activities: { orderBy: { createdAt: "desc" } },
      tasks: { orderBy: { createdAt: "desc" } },
      agreements: { orderBy: { createdAt: "desc" } },
      contactLogs: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!claim) return null;

  const timeline: TimelineEntry[] = [
    ...claim.activities.map((item) => ({
      id: item.id,
      at: item.createdAt,
      kind: "activity" as const,
      title: item.type,
      body: item.message,
    })),
    ...claim.tasks.map((item) => ({
      id: item.id,
      at: item.createdAt,
      kind: "task" as const,
      title: item.title,
      body: item.notes ?? `${item.type} task created`,
      status: item.completedAt ? "completed" : "open",
    })),
    ...claim.agreements.map((item) => ({
      id: item.id,
      at: item.createdAt,
      kind: "agreement" as const,
      title: item.type,
      body: `Agreement status: ${item.status}`,
    })),
    ...claim.contactLogs.map((item) => ({
      id: item.id,
      at: item.createdAt,
      kind: "contact" as const,
      title: item.channel,
      body: item.notes ?? `${item.direction} ${item.channel.toLowerCase()}`,
      status: item.status ?? null,
    })),
  ].sort((a, b) => b.at.getTime() - a.at.getTime());

  return { caseId: claim.id, timeline };
}

/** Author a case from either a lead or raw input. Flips the source lead's status to CONVERTED. */
export async function createCase(input: CreateCaseInput, actor: ActorContext) {
  const claim = await prisma.claim.create({
    data: {
      userId: actor.userId,
      assigneeId: input.assigneeId ?? null,
      leadId: input.leadId ?? null,
      claimantId: input.claimantId ?? null,
      countyName: input.countyName,
      state: input.state,
      ownerName: input.ownerName,
      propertyAddr: input.propertyAddr ?? null,
      parcelId: input.parcelId ?? null,
      amount: input.amount ?? null,
      deadlineDate: parseDate(input.deadlineDate),
      feePercent: input.feePercent ?? null,
      notes: input.notes ?? null,
      priority: input.priority,
      status: "research",
      surplusType: input.surplusType,
      requiresCourt: input.requiresCourt,
      activities: {
        create: {
          type: "note",
          message: "Case created via v1 API",
        },
      },
    },
    include: {
      activities: true,
      claimant: true,
      lead: true,
    },
  });

  if (input.leadId) {
    await prisma.surplusLead.update({
      where: { id: input.leadId },
      data: { status: "CONVERTED" },
    });
  }

  return claim;
}

/** Access policy: owner, assignee, or admin may update a case. */
function canEdit(
  existing: { userId: string | null; assigneeId: string | null },
  actor: ActorContext,
): boolean {
  if (actor.role === "admin") return true;
  if (existing.userId && existing.userId === actor.userId) return true;
  if (existing.assigneeId && existing.assigneeId === actor.userId) return true;
  // Unassigned, unowned cases are editable by any authenticated user.
  if (!existing.userId && !existing.assigneeId) return true;
  return false;
}

export type UpdateCaseResult =
  | { notFound: true }
  | { forbidden: true }
  | { claim: Awaited<ReturnType<typeof prisma.claim.update>> };

export async function updateCase(
  caseId: string,
  input: UpdateCaseInput,
  actor: ActorContext,
): Promise<UpdateCaseResult> {
  const existing = await prisma.claim.findUnique({
    where: { id: caseId },
    select: {
      id: true,
      userId: true,
      assigneeId: true,
      status: true,
      priority: true,
    },
  });

  if (!existing) return { notFound: true };
  if (!canEdit(existing, actor)) return { forbidden: true };

  const updated = await prisma.claim.update({
    where: { id: caseId },
    data: {
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.priority !== undefined ? { priority: input.priority } : {}),
      ...(input.assigneeId !== undefined ? { assigneeId: input.assigneeId } : {}),
      ...(input.amount !== undefined ? { amount: input.amount } : {}),
      ...(input.feePercent !== undefined ? { feePercent: input.feePercent } : {}),
      ...(input.deadlineDate !== undefined
        ? { deadlineDate: parseDate(input.deadlineDate) }
        : {}),
      ...(input.filedDate !== undefined ? { filedDate: parseDate(input.filedDate) } : {}),
      ...(input.paidDate !== undefined ? { paidDate: parseDate(input.paidDate) } : {}),
      ...(input.paidAmount !== undefined ? { paidAmount: input.paidAmount } : {}),
      ...(input.hearingDate !== undefined
        ? { hearingDate: parseDate(input.hearingDate) }
        : {}),
      ...(input.requiresCourt !== undefined ? { requiresCourt: input.requiresCourt } : {}),
      ...(input.courtCaseNum !== undefined ? { courtCaseNum: input.courtCaseNum } : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
      activities: {
        create: {
          type: "status_change",
          message: buildActivityMessage(existing, input),
        },
      },
    },
    include: {
      activities: { orderBy: { createdAt: "desc" }, take: 10 },
      claimant: true,
      lead: true,
    },
  });

  return { claim: updated };
}

function buildActivityMessage(
  existing: { status: string; priority: string },
  input: UpdateCaseInput,
): string {
  const changes: string[] = [];
  if (input.status && input.status !== existing.status) {
    changes.push(`Status changed from ${existing.status} to ${input.status}`);
  }
  if (input.priority && input.priority !== existing.priority) {
    changes.push(`Priority changed from ${existing.priority} to ${input.priority}`);
  }
  if (input.assigneeId !== undefined) changes.push("Assignee updated");
  if (input.deadlineDate !== undefined) changes.push("Deadline updated");
  if (input.notes !== undefined) changes.push("Notes updated");
  if (input.amount !== undefined) changes.push("Amount updated");
  if (input.feePercent !== undefined) changes.push("Fee percent updated");
  if (input.requiresCourt !== undefined) changes.push("Court requirement updated");
  if (input.hearingDate !== undefined) changes.push("Hearing date updated");
  if (input.courtCaseNum !== undefined) changes.push("Court case number updated");
  if (input.filedDate !== undefined) changes.push("Filed date updated");
  if (input.paidDate !== undefined) changes.push("Paid date updated");
  if (input.paidAmount !== undefined) changes.push("Paid amount updated");
  return changes.length ? changes.join("; ") : "Case updated";
}
