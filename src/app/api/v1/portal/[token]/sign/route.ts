import { NextRequest, NextResponse } from "next/server";

import { handleError } from "@/lib/api-utils";
import { rateLimit } from "@/lib/rate-limit";
import { signAgreementSchema } from "@/modules/portal/schemas";
import { portalSignAgreement } from "@/modules/portal/server/tokens";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ token: string }>;
}

/**
 * POST /api/v1/portal/:token/sign
 *
 * PUBLIC — token-gated. Typed-name signature for v1; the typed name + ISO
 * timestamp + provenance ("via: portal") are appended to the agreement's
 * renderedText as an audit trail. Agreement must be in SENT or VIEWED.
 *
 * Rate-limited hard — this is a public mutating endpoint.
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { token } = await context.params;
    const rl = rateLimit(`portal-sign:${token}`, 10, 60_000);
    if (!rl.success) {
      return NextResponse.json({ error: "rate limit" }, { status: 429 });
    }

    let raw: unknown;
    try {
      raw = await request.json();
    } catch {
      return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
    }
    const parsed = signAgreementSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "validation failed", issues: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const result = await portalSignAgreement(
      token,
      parsed.data.agreementId,
      parsed.data.typedName,
    );

    if ("notFound" in result) {
      return NextResponse.json(
        { error: "invalid link or agreement" },
        { status: 404 },
      );
    }
    if ("badState" in result) {
      return NextResponse.json({ error: result.reason }, { status: 409 });
    }

    return NextResponse.json({ success: true, data: result });
  } catch (e) {
    return handleError(e);
  }
}
