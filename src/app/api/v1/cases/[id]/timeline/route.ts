import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { handleError } from "@/lib/api-utils";
import { getCaseTimeline } from "@/modules/cases/server/service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/** GET /api/v1/cases/:id/timeline — merged activity/task/agreement/contact stream. */
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

    const timeline = await getCaseTimeline(id, {
      userId: session.user.id,
      role: session.user.role,
    });
    if (!timeline) {
      return NextResponse.json({ error: "case not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: timeline }, { status: 200 });
  } catch (e) {
    return handleError(e);
  }
}
