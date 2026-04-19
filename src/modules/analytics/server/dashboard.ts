import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export interface ActorContext {
  userId: string;
  role: string;
}

/**
 * Build the visibility scope shared by all analytics queries.
 * Admins see the full picture; everyone else sees only cases they
 * own or are assigned to.
 */
function claimScope(actor: ActorContext): Prisma.ClaimWhereInput {
  if (actor.role === "admin") return {};
  return {
    OR: [{ userId: actor.userId }, { assigneeId: actor.userId }],
  };
}

export interface DashboardKpis {
  leads: {
    total: number;
    enriched: number;
    new: number;
    avgScore: number | null;
  };
  cases: {
    total: number;
    open: number;
    paid: number;
    pipelineValue: number;
    paidValue: number;
  };
  agreements: {
    total: number;
    signed: number;
    sent: number;
    expired: number;
  };
  tasks: {
    overdue: number;
    dueToday: number;
    openAll: number;
  };
}

const TERMINAL_STATUSES = ["paid", "denied"];

export async function dashboardKpis(actor: ActorContext): Promise<DashboardKpis> {
  const scope = claimScope(actor);

  // Leads + agreement aggregates: leads aren't user-scoped yet, so these are
  // global for non-admin callers too. Keeping the aggregate simple for v1.
  const [
    totalLeads,
    enrichedLeads,
    newLeads,
    leadScoreAgg,

    totalCases,
    openCasesAgg,
    paidCasesAgg,

    totalAgreements,
    signedAgreements,
    sentAgreements,
    expiredAgreements,

    overdueTasksCount,
    dueTodayCount,
    openTasksCount,
  ] = await Promise.all([
    prisma.surplusLead.count(),
    prisma.surplusLead.count({ where: { enriched: true } }),
    prisma.surplusLead.count({ where: { status: "NEW" } }),
    prisma.surplusLead.aggregate({ _avg: { score: true } }),

    prisma.claim.count({ where: scope }),
    prisma.claim.aggregate({
      where: { AND: [scope, { status: { notIn: TERMINAL_STATUSES } }] },
      _count: { _all: true },
      _sum: { amount: true },
    }),
    prisma.claim.aggregate({
      where: { AND: [scope, { status: "paid" }] },
      _count: { _all: true },
      _sum: { paidAmount: true },
    }),

    prisma.agreement.count({ where: { claim: scope } }),
    prisma.agreement.count({ where: { claim: scope, status: "SIGNED" } }),
    prisma.agreement.count({ where: { claim: scope, status: "SENT" } }),
    prisma.agreement.count({ where: { claim: scope, status: "EXPIRED" } }),

    prisma.task.count({
      where: {
        completedAt: null,
        dueDate: { lt: new Date() },
        claim: scope,
      },
    }),
    (() => {
      const now = new Date();
      const start = new Date(
        Date.UTC(
          now.getUTCFullYear(),
          now.getUTCMonth(),
          now.getUTCDate(),
          0,
          0,
          0,
        ),
      );
      const end = new Date(start.getTime() + 86_400_000);
      return prisma.task.count({
        where: {
          completedAt: null,
          dueDate: { gte: start, lt: end },
          claim: scope,
        },
      });
    })(),
    prisma.task.count({
      where: { completedAt: null, claim: scope },
    }),
  ]);

  return {
    leads: {
      total: totalLeads,
      enriched: enrichedLeads,
      new: newLeads,
      avgScore: leadScoreAgg._avg.score,
    },
    cases: {
      total: totalCases,
      open: openCasesAgg._count._all,
      paid: paidCasesAgg._count._all,
      pipelineValue: openCasesAgg._sum.amount ?? 0,
      paidValue: paidCasesAgg._sum.paidAmount ?? 0,
    },
    agreements: {
      total: totalAgreements,
      signed: signedAgreements,
      sent: sentAgreements,
      expired: expiredAgreements,
    },
    tasks: {
      overdue: overdueTasksCount,
      dueToday: dueTodayCount,
      openAll: openTasksCount,
    },
  };
}
