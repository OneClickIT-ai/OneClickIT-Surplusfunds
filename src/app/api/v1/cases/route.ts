import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from '@/lib/auth';

import { authOptions } from "@/lib/auth";
import { handleError } from "@/lib/api-utils";
import { createCaseSchema, casesQuerySchema } from "@/modules/cases/schemas";
import { createCase, listCases } from "@/modules/cases/server/service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** GET /api/v1/cases — paginated, filterable listing of Claim rows. */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const searchParams = Object.fromEntries(
      request.nextUrl.searchParams.entries(),
    );
    const parsed = casesQuerySchema.safeParse(searchParams);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "validation failed", issues: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const result = await listCases(parsed.data, {
      userId: session.user.id,
      role: session.user.role,
    });
    return NextResponse.json(result, { status: 200 });
  } catch (e) {
    return handleError(e);
  }
}

/** POST /api/v1/cases — author a new case (Claim row), optionally from a lead. */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.toLowerCase().includes("application/json")) {
      return NextResponse.json(
        { error: "Content-Type must be application/json" },
        { status: 415 },
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
    }

    const parsed = createCaseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "validation failed", issues: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const claim = await createCase(parsed.data, {
      userId: session.user.id,
      role: session.user.role,
    });
    return NextResponse.json({ success: true, data: claim }, { status: 201 });
  } catch (e) {
    return handleError(e);
  }
}
