import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import type { LeadsQueryInput } from "../schemas";

const leadListInclude = {
  county: { select: { id: true, name: true, state: true } },
  claimants: true,
  claim: { select: { id: true, status: true } },
} satisfies Prisma.SurplusLeadInclude;

export type LeadListItem = Prisma.SurplusLeadGetPayload<{
  include: typeof leadListInclude;
}>;

export interface LeadsListResult {
  data: LeadListItem[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Paginated, filtered listing of SurplusLead rows.
 *
 * Sort order: score desc, then createdAt desc (newest-first within equal scores).
 */
export async function listLeads(input: LeadsQueryInput): Promise<LeadsListResult> {
  const { page, limit } = input;
  const skip = (page - 1) * limit;

  const where: Prisma.SurplusLeadWhereInput = {
    ...(input.countyId ? { countyId: input.countyId } : {}),
    ...(input.status ? { status: input.status } : {}),
    ...(input.surplusType ? { surplusType: input.surplusType } : {}),
    ...(input.state ? { county: { state: input.state } } : {}),
    ...(input.q
      ? {
          OR: [
            { ownerName: { contains: input.q, mode: "insensitive" } },
            { propertyAddr: { contains: input.q, mode: "insensitive" } },
            { parcelId: { contains: input.q, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(input.minAmount !== undefined || input.maxAmount !== undefined
      ? {
          surplusAmount: {
            ...(input.minAmount !== undefined ? { gte: input.minAmount } : {}),
            ...(input.maxAmount !== undefined ? { lte: input.maxAmount } : {}),
          },
        }
      : {}),
    ...(input.minScore !== undefined ? { score: { gte: input.minScore } } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.surplusLead.findMany({
      where,
      include: leadListInclude,
      orderBy: [{ score: "desc" }, { createdAt: "desc" }],
      skip,
      take: limit,
    }),
    prisma.surplusLead.count({ where }),
  ]);

  return {
    data: items,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}
