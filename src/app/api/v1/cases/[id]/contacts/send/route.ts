import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { handleError } from "@/lib/api-utils";
import { rateLimit } from "@/lib/rate-limit";
import { sendOutboundSchema } from "@/modules/outbound/schemas";
import { sendOutbound } from "@/modules/outbound/server/send";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/v1/cases/[id]/contacts/send — operator-driven outbound SMS/email
 * via Twilio/Resend. The result is always persisted to ContactLog (success
 * or failure) so the case audit chain stays complete.
 *
 * Rate-limited per user to keep a runaway UI from flooding providers.
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const limit = rateLimit(`send-outbound:${session.user.id}`, 20, 60_000);
    if (!limit.success) {
      return NextResponse.json(
        { error: "rate limit exceeded — please slow down" },
        { status: 429 },
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
    }
    const parsed = sendOutboundSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "validation failed", issues: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { id } = await context.params;
    const result = await sendOutbound(id, parsed.data, {
      userId: session.user.id,
      role: session.user.role,
    });

    if ("notFound" in result) {
      return NextResponse.json({ error: "case not found" }, { status: 404 });
    }
    if ("forbidden" in result) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    if ("missingRecipient" in result) {
      return NextResponse.json(
        {
          error: `no ${result.channel === "SMS" ? "phone number" : "email"} on file for the claimant — provide a recipient`,
        },
        { status: 422 },
      );
    }
    if ("providerNotConfigured" in result) {
      return NextResponse.json(
        {
          error: `provider not configured: ${result.provider}`,
          detail: result.reason,
        },
        { status: 503 },
      );
    }

    const httpStatus = result.providerResult.ok ? 201 : 502;
    return NextResponse.json(
      {
        success: result.providerResult.ok,
        data: result.contactLog,
        provider: {
          ok: result.providerResult.ok,
          status: result.providerResult.status,
          externalId: result.providerResult.externalId,
          errorCode: result.providerResult.errorCode ?? null,
          errorMessage: result.providerResult.errorMessage ?? null,
        },
        followUpTaskCreated: result.followUpTaskCreated,
      },
      { status: httpStatus },
    );
  } catch (e) {
    return handleError(e);
  }
}
