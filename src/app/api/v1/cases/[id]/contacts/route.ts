import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from '@/lib/auth';

import { authOptions } from "@/lib/auth";
import { handleError } from "@/lib/api-utils";
import { createContactLogSchema } from "@/modules/outbound/schemas";
import {
  listContactLogsForClaim,
  logContact,
} from "@/modules/outbound/server/log-contact";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    const { id } = await context.params;
    const result = await listContactLogsForClaim(id, {
      userId: session.user.id,
      role: session.user.role,
    });
    if ("notFound" in result) {
      return NextResponse.json({ error: "case not found" }, { status: 404 });
    }
    if ("forbidden" in result) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    return NextResponse.json({ data: result.items });
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
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
    const parsed = createContactLogSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "validation failed", issues: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const { id } = await context.params;
    const result = await logContact(id, parsed.data, {
      userId: session.user.id,
      role: session.user.role,
    });
    if ("notFound" in result) {
      return NextResponse.json({ error: "case not found" }, { status: 404 });
    }
    if ("forbidden" in result) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    return NextResponse.json(
      {
        success: true,
        data: result.contactLog,
        followUpTaskCreated: result.followUpTaskCreated,
      },
      { status: 201 },
    );
  } catch (e) {
    return handleError(e);
  }
}
