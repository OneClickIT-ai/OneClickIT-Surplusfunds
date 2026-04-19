import { NextRequest, NextResponse } from "next/server";
import { requireCronSecret } from "@/lib/api-utils";
import { rescoreAll } from "@/modules/leads/server/scoring";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Scheduled recompute of SurplusLead.score across all active leads.
 *
 * Call pattern:
 *   Vercel cron -> GET /api/cron/score-leads  (with Authorization: Bearer $CRON_SECRET)
 *
 * Safe to invoke on demand for one-off reconciliation.
 */
export async function GET(request: NextRequest) {
  if (!requireCronSecret(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const result = await rescoreAll();
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "rescore failed";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
