import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { handleError } from "@/lib/api-utils";
import { updateAgreementSchema } from "@/modules/agreements/schemas";
import {
  getAgreement,
  updateAgreement,
} from "@/modules/agreements/server/service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface RouteContext {
  params: { id: string };
}

function actorFrom(session: {
  user: { id: string; role: string; name?: string | null };
}) {
  return {
    userId: session.user.id,
    role: session.user.role,
    name: session.user.name ?? "Agent",
  };
}

export async function GET(_: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    const result = await getAgreement(context.params.id, actorFrom(session));
    if ("notFound" in result) {
      return NextResponse.json({ error: "agreement not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: result.agreement });
  } catch (e) {
    return handleError(e);
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
    }
    const parsed = updateAgreementSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "validation failed", issues: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const result = await updateAgreement(
      context.params.id,
      parsed.data,
      actorFrom(session),
    );
    if ("notFound" in result) {
      return NextResponse.json({ error: "agreement not found" }, { status: 404 });
    }
    if ("forbidden" in result) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    return NextResponse.json({ success: true, data: result.agreement });
  } catch (e) {
    return handleError(e);
  }
}
