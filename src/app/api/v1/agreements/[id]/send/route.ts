import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from '@/lib/auth';

import { authOptions } from "@/lib/auth";
import { handleError } from "@/lib/api-utils";
import { sendAgreement } from "@/modules/agreements/server/service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/v1/agreements/:id/send
 * Flips DRAFT -> SENT, invokes e-sign provider (currently a placeholder).
 * Requires the agreement's claimant to have an email on file.
 */
export async function POST(_: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    const { id } = await context.params;
    const result = await sendAgreement(id, {
      userId: session.user.id,
      role: session.user.role,
      name: session.user.name ?? "Agent",
    });
    if ("notFound" in result) {
      return NextResponse.json({ error: "agreement not found" }, { status: 404 });
    }
    if ("forbidden" in result) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    if ("badState" in result) {
      return NextResponse.json({ error: result.reason }, { status: 409 });
    }
    return NextResponse.json({ success: true, data: result.agreement });
  } catch (e) {
    return handleError(e);
  }
}
