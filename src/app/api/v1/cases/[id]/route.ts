import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from '@/lib/auth';

import { authOptions } from "@/lib/auth";
import { handleError } from "@/lib/api-utils";
import { updateCaseSchema } from "@/modules/cases/schemas";
import { getCaseById, updateCase } from "@/modules/cases/server/service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/** GET /api/v1/cases/:id — fetch a case with full related data. */
export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: "missing case id" }, { status: 400 });
    }

    const claim = await getCaseById(id, {
      userId: session.user.id,
      role: session.user.role,
    });
    if (!claim) {
      return NextResponse.json({ error: "case not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: claim }, { status: 200 });
  } catch (e) {
    return handleError(e);
  }
}

/** PATCH /api/v1/cases/:id — update a case. Owner, assignee, or admin only. */
export async function PATCH(request: NextRequest, context: RouteContext) {
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

    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ error: "missing case id" }, { status: 400 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
    }

    const parsed = updateCaseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "validation failed", issues: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const result = await updateCase(id, parsed.data, {
      userId: session.user.id,
      role: session.user.role,
    });

    if ("notFound" in result) {
      return NextResponse.json({ error: "case not found" }, { status: 404 });
    }
    if ("forbidden" in result) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    return NextResponse.json({ success: true, data: result.claim }, { status: 200 });
  } catch (e) {
    return handleError(e);
  }
}
