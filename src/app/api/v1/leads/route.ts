import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from '@/lib/auth';

import { authOptions } from "@/lib/auth";
import { handleError } from "@/lib/api-utils";
import { leadsQuerySchema } from "@/modules/leads/schemas";
import { listLeads } from "@/modules/leads/server/service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** GET /api/v1/leads — paginated, filterable listing of SurplusLead rows. */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const searchParams = Object.fromEntries(
      request.nextUrl.searchParams.entries(),
    );
    const parsed = leadsQuerySchema.safeParse(searchParams);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "validation failed", issues: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const result = await listLeads(parsed.data);
    return NextResponse.json(result, { status: 200 });
  } catch (e) {
    return handleError(e);
  }
}
