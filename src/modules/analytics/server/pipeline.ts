import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export interface ActorContext {
  userId: string;
  role: string;
}

function claimScope(actor: ActorContext): Prisma.ClaimWhereInput {
  if (actor.role === "admin") return {};
  return {
    OR: [{ userId: actor.userId }, { assigneeId: actor.userId }],
  };
}

export interface PipelineStage {
  status: string;
  count: number;
  value: number;
}

/**
 * Count + sum(amount) per case status. Useful for the pipeline chart on
 * the insights page. Unknown / blank statuses still surface so operators
 * see bad data rather than silently losing rows.
 */
export async function pipelineByStatus(
  actor: ActorContext,
): Promise<PipelineStage[]> {
  const rows = await prisma.claim.groupBy({
    by: ["status"],
    where: claimScope(actor),
    _count: { _all: true },
    _sum: { amount: true },
  });
  return rows
    .map((r) => ({
      status: r.status,
      count: r._count._all,
      value: r._sum.amount ?? 0,
    }))
    .sort((a, b) => b.count - a.count);
}
