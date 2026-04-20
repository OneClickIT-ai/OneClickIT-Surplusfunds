import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from '@/lib/auth';

import { authOptions } from "@/lib/auth";
import { handleError } from "@/lib/api-utils";
import { markSigned } from "@/modules/agreements/server/service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/v1/agreements/:id/sign
 *
 * Admin-only in v1. Flips SENT (or any state) -> SIGNED with `signedAt=now`.
 * When a real e-sign provider is integrated, this endpoint becomes a backstop
 * for manual reconciliation and the authoritative signal flows through the
 * provider webhook at /api/v1/webhooks/esign.
 */
export async function POST(_: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    const { id } = await context.params;
    const result = await markSigned(id, {
      userId: session.user.id,
      role: session.user.role,
      name: session.user.name ?? "Agent",
    });
    if ("notFound" in result) {
      return NextResponse.json({ error: "agreement not found" }, { status: 404 });
    }
    if ("forbidden" in result) {
      return NextResponse.json(
        { error: "admin only" },
        { status: 403 },
      );
    }
    return NextResponse.json({ success: true, data: result.agreement });
  } catch (e) {
    return handleError(e);
  }
}
