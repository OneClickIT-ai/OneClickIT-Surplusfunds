import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { getAgreement } from "@/modules/agreements/server/service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/v1/agreements/:id/pdf
 *
 * v1 placeholder: serves the rendered template as plain text with a filename
 * hint. Kept at this path so the eventual real PDF generator can ship without
 * changing any caller.
 *
 * TODO: swap to @react-pdf/renderer or puppeteer for real PDF output. Response
 * headers (Content-Type, Content-Disposition) stay the same shape.
 */
export async function GET(_: NextRequest, context: RouteContext) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const result = await getAgreement(id, {
    userId: session.user.id,
    role: session.user.role,
    name: session.user.name ?? "Agent",
  });
  if ("notFound" in result || !result.agreement) {
    return NextResponse.json({ error: "agreement not found" }, { status: 404 });
  }

  const ag = result.agreement;
  const body = ag.renderedText ?? "(no rendered text)";
  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `inline; filename="${ag.type}-${ag.id}.txt"`,
      "X-Agreement-Status": ag.status,
    },
  });
}
