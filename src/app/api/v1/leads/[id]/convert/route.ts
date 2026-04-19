import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { handleError } from "@/lib/api-utils";
import { convertLeadSchema } from "@/modules/cases/schemas";
import { convertLeadToCase } from "@/modules/cases/server/service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/v1/leads/:id/convert
 *
 * Atomically turns a SurplusLead into a Claim (case). Body is optional — all
 * fields are overrides for the created case. On success returns the new case.
 * If the lead is already converted, returns 409 + the existing claim id so
 * the caller can navigate to it.
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: "missing lead id" }, { status: 400 });
    }

    // Body is optional. Accept empty / non-JSON bodies gracefully.
    let rawBody: unknown = {};
    const contentType = request.headers.get("content-type") ?? "";
    if (contentType.toLowerCase().includes("application/json")) {
      try {
        rawBody = await request.json();
      } catch {
        rawBody = {};
      }
    }

    const parsed = convertLeadSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "validation failed", issues: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const result = await convertLeadToCase(
      id,
      { userId: session.user.id, role: session.user.role },
      parsed.data,
    );

    if ("notFound" in result) {
      return NextResponse.json({ error: "lead not found" }, { status: 404 });
    }
    if ("alreadyConverted" in result) {
      return NextResponse.json(
        {
          error: "lead already converted",
          existingClaimId: result.existingClaimId,
        },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { success: true, data: result.claim },
      { status: 201 },
    );
  } catch (e) {
    return handleError(e);
  }
}
