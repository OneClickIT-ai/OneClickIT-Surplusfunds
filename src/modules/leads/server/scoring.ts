import { prisma } from "@/lib/prisma";

/**
 * Lead scoring — pure function returning 0-100.
 *
 * Signal weights (total 100):
 *   - surplusAmount (40pt)  log-scaled; $10K ≈ 20pt, $50K ≈ 30pt, $200K+ ≈ 40pt
 *   - deadline proximity (25pt)  sweet spot 21-60 days. Too near = penalty (harder
 *     to land in time), too far = mild discount (risk of claimant moving on).
 *   - county easyRating (20pt)  easyRating is 1-5; linearly mapped.
 *   - enriched (8pt)  skip-tracing completed
 *   - hasClaimant (7pt)  at least one Claimant row attached with phone or email
 */

export interface ScorableLead {
  surplusAmount: number | null;
  deadlineDate: Date | null;
  enriched: boolean;
  county: { easyRating: number | null } | null;
  claimants: Array<{ phone: string | null; email: string | null }>;
}

export function scoreLead(lead: ScorableLead): number {
  let score = 0;

  // Amount (40pt): log10 scaled, clamped
  if (lead.surplusAmount && lead.surplusAmount > 0) {
    // $1K -> 0pt, $10K -> 20pt, $50K -> ~30pt, $200K+ -> 40pt (cap)
    const log = Math.log10(lead.surplusAmount);
    const raw = (log - 3) * 13.33; // 3 (log of 1000) is the 0-pt anchor
    score += Math.max(0, Math.min(40, raw));
  }

  // Deadline proximity (25pt)
  if (lead.deadlineDate) {
    const daysOut = Math.floor(
      (lead.deadlineDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
    );
    if (daysOut < 0) {
      score += 0; // expired
    } else if (daysOut < 7) {
      score += 5; // almost impossible to file in time
    } else if (daysOut < 21) {
      score += 15;
    } else if (daysOut <= 60) {
      score += 25; // sweet spot
    } else if (daysOut <= 120) {
      score += 18;
    } else {
      score += 10;
    }
  }

  // County ease (20pt)
  const rating = lead.county?.easyRating ?? null;
  if (rating !== null) {
    const clamped = Math.max(1, Math.min(5, rating));
    score += (clamped / 5) * 20;
  } else {
    // No rating → neutral middle
    score += 10;
  }

  // Enrichment bonus (8pt)
  if (lead.enriched) score += 8;

  // Claimant attached with real contact (7pt)
  const hasContact = lead.claimants.some((c) => c.phone || c.email);
  if (hasContact) score += 7;

  return Math.round(Math.max(0, Math.min(100, score)));
}

/** Recompute + persist the score for a single lead. */
export async function rescoreOne(leadId: string): Promise<number> {
  const lead = await prisma.surplusLead.findUnique({
    where: { id: leadId },
    select: {
      surplusAmount: true,
      deadlineDate: true,
      enriched: true,
      county: { select: { easyRating: true } },
      claimants: { select: { phone: true, email: true } },
    },
  });
  if (!lead) return 0;
  const score = scoreLead(lead);
  await prisma.surplusLead.update({
    where: { id: leadId },
    data: { score },
  });
  return score;
}

/**
 * Recompute scores for all active leads. Designed to be called from a cron
 * handler. Skips terminal states (CONVERTED, DEAD).
 */
export async function rescoreAll(): Promise<{ scanned: number; updated: number }> {
  const leads = await prisma.surplusLead.findMany({
    where: { status: { notIn: ["CONVERTED", "DEAD"] } },
    select: {
      id: true,
      score: true,
      surplusAmount: true,
      deadlineDate: true,
      enriched: true,
      county: { select: { easyRating: true } },
      claimants: { select: { phone: true, email: true } },
    },
  });

  let updated = 0;
  for (const lead of leads) {
    const next = scoreLead(lead);
    if (next !== lead.score) {
      await prisma.surplusLead.update({
        where: { id: lead.id },
        data: { score: next },
      });
      updated++;
    }
  }

  return { scanned: leads.length, updated };
}
