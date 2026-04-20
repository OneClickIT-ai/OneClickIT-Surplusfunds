import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from '@/lib/auth';

import { authOptions } from "@/lib/auth";
import { err, handleError } from "@/lib/api-utils";
import { rateLimit } from "@/lib/rate-limit";
import { leadIngestRequestSchema } from "@/modules/surplus-data/schemas";
import { ingestLeads } from "@/modules/surplus-data/server/ingest";
import type { LeadIngestResponse } from "@/types/api";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * POST /api/v1/leads/ingest
 *
 * Canonical lead ingestion endpoint. Accepts JSON only.
 * See src/modules/surplus-data/server/ingest.ts for the orchestration logic.
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Auth
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return err("unauthorized", 401);
    }

    // 1b. Rate limit — 20 ingest requests per 5 minutes per user.
    // Ingest accepts up to 5000 rows per call; this is a generous envelope
    // that stops runaway loops without blocking real bulk loading.
    const rl = rateLimit(`ingest:${session.user.id}`, 20, 5 * 60_000);
    if (!rl.success) {
      return NextResponse.json(
        { error: "rate limit exceeded — try again in a few minutes" },
        { status: 429, headers: { "X-RateLimit-Remaining": "0" } },
      );
    }

    // 2. Content-Type — JSON only for v1
    const contentType = req.headers.get("content-type") ?? "";
    if (!contentType.toLowerCase().includes("application/json")) {
      return err("Content-Type must be application/json", 415);
    }

    // 3. Parse body
    let rawBody: unknown;
    try {
      rawBody = await req.json();
    } catch {
      return err("invalid JSON body", 400);
    }

    // 4. Validate (use safeParse so we return structured issues without a throw)
    const parsed = leadIngestRequestSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "validation failed",
          issues: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    // 5. Delegate to service
    const { response, httpStatus } = await ingestLeads(parsed.data, {
      userId: session.user.id,
    });

    return NextResponse.json<LeadIngestResponse>(response, {
      status: httpStatus,
    });
  } catch (e) {
    return handleError(e);
  }
}
