import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from '@/lib/auth';

import { authOptions } from "@/lib/auth";
import { handleError } from "@/lib/api-utils";
import { pipelineByStatus } from "@/modules/analytics/server/pipeline";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    const data = await pipelineByStatus({
      userId: session.user.id,
      role: session.user.role,
    });
    return NextResponse.json({ data });
  } catch (e) {
    return handleError(e);
  }
}
