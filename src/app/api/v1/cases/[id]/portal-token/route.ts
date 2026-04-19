import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { handleError } from "@/lib/api-utils";
import { issueTokenSchema } from "@/modules/portal/schemas";
import { issuePortalToken } from "@/modules/portal/server/tokens";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/v1/cases/:id/portal-token
 *
 * Mint or rotate the claimant portal token for a case. Previous active
 * tokens for the same case are revoked, so there is always at most one
 * live token per case. Returns the full URL so the operator can copy/paste
 * into an email or SMS.
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    // Body is optional; JSON only when present.
    let raw: unknown = {};
    const contentType = request.headers.get("content-type") ?? "";
    if (contentType.toLowerCase().includes("application/json")) {
      try {
        raw = await request.json();
      } catch {
        raw = {};
      }
    }
    const parsed = issueTokenSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "validation failed", issues: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { id } = await context.params;
    const result = await issuePortalToken(
      id,
      { userId: session.user.id, role: session.user.role },
      { ttlDays: parsed.data.ttlDays },
    );

    if ("notFound" in result) {
      return NextResponse.json({ error: "case not found" }, { status: 404 });
    }
    if ("forbidden" in result) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    return NextResponse.json(
      { success: true, data: result },
      { status: 201 },
    );
  } catch (e) {
    return handleError(e);
  }
}
