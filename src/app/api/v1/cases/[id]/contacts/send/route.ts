import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { handleError } from "@/lib/api-utils";
import { rateLimit } from "@/lib/rate-limit";
import { sendContactSchema } from "@/modules/outbound/schemas";
import { sendOutboundContact } from "@/modules/outbound/server/send";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/v1/cases/:id/contacts/send
 *
 * Live outbound: hits Twilio (SMS) or Resend (email), then always writes a
 * ContactLog row with the provider outcome. Failed sends auto-seed a
 * follow-up task via the same path as the quick-log endpoint.
 *
 * Rate-limited per operator to keep accidental "send all" loops from
 * generating real external traffic.
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const rl = rateLimit(`contacts:send:${session.user.id}`, 20, 60_000);
    if (!rl.success) {
      return NextResponse.json({ error: "rate limited" }, { status: 429 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
    }

    const parsed = sendContactSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "validation failed", issues: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { id } = await context.params;
    const result = await sendOutboundContact(id, parsed.data, {
      userId: session.user.id,
      role: session.user.role,
    });

    if ("notFound" in result) {
      return NextResponse.json({ error: "case not found" }, { status: 404 });
    }
    if ("forbidden" in result) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    if ("badState" in result) {
      return NextResponse.json({ error: result.reason }, { status: 409 });
    }

    // 201 whether the send itself succeeded or not — the audit row was written.
    return NextResponse.json(
      {
        success: result.ok,
        providerConfigured: result.providerConfigured,
        data: result.contactLog,
        send: {
          ok: result.sendResult.ok,
          status: result.sendResult.status,
          provider: result.sendResult.provider,
          error: result.sendResult.error,
          externalId: result.sendResult.externalId,
        },
        followUpTaskCreated: result.followUpTaskCreated,
      },
      { status: 201 },
    );
  } catch (e) {
    return handleError(e);
  }
}
