import { NextRequest, NextResponse } from "next/server";

import { rateLimit } from "@/lib/rate-limit";
import { handleError } from "@/lib/api-utils";
import { resolvePortalToken } from "@/modules/portal/server/tokens";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ token: string }>;
}

/**
 * GET /api/v1/portal/:token
 *
 * PUBLIC — no session needed. The token is the auth. Returns a case summary
 * safe for the claimant to see: owner name, county, property, surplus amount,
 * deadline, and the attached agreements (status, type, rendered text).
 *
 * Rate-limited by token to deter scraping/brute forcing.
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { token } = await context.params;
    const rl = rateLimit(`portal:${token}`, 60, 60_000);
    if (!rl.success) {
      return NextResponse.json({ error: "rate limit" }, { status: 429 });
    }

    const resolved = await resolvePortalToken(token);
    if (!resolved) {
      return NextResponse.json(
        { error: "invalid or expired link" },
        { status: 404 },
      );
    }

    const claim = resolved.claim;
    return NextResponse.json({
      success: true,
      data: {
        expiresAt: resolved.tokenRow.expiresAt,
        claim: {
          id: claim.id,
          ownerName: claim.ownerName,
          countyName: claim.countyName,
          state: claim.state,
          propertyAddr: claim.propertyAddr,
          parcelId: claim.parcelId,
          amount: claim.amount,
          status: claim.status,
          deadlineDate: claim.deadlineDate,
          surplusType: claim.surplusType,
        },
        claimant: claim.claimant,
        agreements: claim.agreements,
      },
    });
  } catch (e) {
    return handleError(e);
  }
}
