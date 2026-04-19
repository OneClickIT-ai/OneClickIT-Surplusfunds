import { prisma } from "@/lib/prisma";

export interface CountyAnalyticsRow {
  countyId: string;
  name: string;
  state: string;
  leadCount: number;
  totalSurplus: number;
  avgScore: number | null;
}

/**
 * Top counties by lead volume. Joins on county to include name/state
 * without exposing the id to the UI consumer alone.
 */
export async function topCountiesByLeads(
  limit = 10,
): Promise<CountyAnalyticsRow[]> {
  const rows = await prisma.surplusLead.groupBy({
    by: ["countyId"],
    _count: { _all: true },
    _sum: { surplusAmount: true },
    _avg: { score: true },
    orderBy: { _count: { countyId: "desc" } },
    take: limit,
  });

  if (rows.length === 0) return [];

  const counties = await prisma.county.findMany({
    where: { id: { in: rows.map((r) => r.countyId) } },
    select: { id: true, name: true, state: true },
  });
  const byId = new Map(counties.map((c) => [c.id, c]));

  return rows.map((r) => {
    const c = byId.get(r.countyId);
    return {
      countyId: r.countyId,
      name: c?.name ?? "(unknown)",
      state: c?.state ?? "??",
      leadCount: r._count._all,
      totalSurplus: r._sum.surplusAmount ?? 0,
      avgScore: r._avg.score,
    };
  });
}
