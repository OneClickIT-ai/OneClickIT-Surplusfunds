import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from '@/lib/auth';

import { authOptions } from "@/lib/auth";
import { handleError } from "@/lib/api-utils";
import {
  agreementsQuerySchema,
  createAgreementSchema,
} from "@/modules/agreements/schemas";
import {
  createAgreement,
  listAgreements,
} from "@/modules/agreements/server/service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function actorFrom(session: {
  user: { id: string; role: string; name?: string | null };
}) {
  return {
    userId: session.user.id,
    role: session.user.role,
    name: session.user.name ?? "Agent",
  };
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    const params = Object.fromEntries(request.nextUrl.searchParams.entries());
    const parsed = agreementsQuerySchema.safeParse(params);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "validation failed", issues: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const result = await listAgreements(parsed.data, actorFrom(session));
    return NextResponse.json(result);
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(request: NextRequest) {
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
    const parsed = createAgreementSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "validation failed", issues: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const result = await createAgreement(parsed.data, actorFrom(session));
    if ("notFound" in result) {
      return NextResponse.json({ error: "case not found" }, { status: 404 });
    }
    if ("forbidden" in result) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    return NextResponse.json(
      { success: true, data: result.agreement },
      { status: 201 },
    );
  } catch (e) {
    return handleError(e);
  }
}
