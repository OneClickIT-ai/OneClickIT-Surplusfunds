import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { handleError } from "@/lib/api-utils";
import { rateLimit } from "@/lib/rate-limit";
import { skiptraceRequestSchema } from "@/modules/osint/schemas";
import { enrichLead } from "@/modules/osint/server/enrich-lead";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/v1/leads/:id/skiptrace
 *
 * Runs the OSINT enrichment pipeline against a single lead. Body optional:
 *   { force?: boolean }  // re-run even if already enriched
 *
 * Rate-limited to 30 runs / 5min per user to protect provider quotas.
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const rl = rateLimit(`skiptrace:${session.user.id}`, 30, 5 * 60_000);
    if (!rl.success) {
      return NextResponse.json(
        { error: "rate limit exceeded — try again in a few minutes" },
        { status: 429, headers: { "X-RateLimit-Remaining": "0" } },
      );
    }

    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: "missing lead id" }, { status: 400 });
    }

    // Body is optional. Default body {} validates fine.
    let rawBody: unknown = {};
    const contentType = request.headers.get("content-type") ?? "";
    if (contentType.toLowerCase().includes("application/json")) {
      try {
        rawBody = await request.json();
      } catch {
        rawBody = {};
      }
    }
    const parsed = skiptraceRequestSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "validation failed", issues: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const result = await enrichLead(
      id,
      { userId: session.user.id, role: session.user.role },
      { force: parsed.data.force },
    );

    if ("notFound" in result) {
      return NextResponse.json({ error: "lead not found" }, { status: 404 });
    }
    if ("forbidden" in result) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    if ("alreadyEnriched" in result) {
      return NextResponse.json(
        { success: true, alreadyEnriched: true, data: { leadId: result.leadId } },
        { status: 200 },
      );
    }

    return NextResponse.json({ success: true, data: result }, { status: 200 });
  } catch (e) {
    return handleError(e);
  }
}
