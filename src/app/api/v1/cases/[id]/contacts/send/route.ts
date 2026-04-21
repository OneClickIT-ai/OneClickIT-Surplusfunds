import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { handleError } from "@/lib/api-utils";
import { rateLimit } from "@/lib/rate-limit";
import { sendContactSchema } from "@/modules/outbound/schemas";
import { sendContact } from "@/modules/outbound/server/send-contact";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    // Keep abusive / runaway senders bounded per operator. Generous limit
    // because operators may genuinely blast a batch of follow-ups.
    const gate = rateLimit(`contact-send:${session.user.id}`, 30, 60_000);
    if (!gate.success) {
      return NextResponse.json(
        { error: "rate limit exceeded" },
        { status: 429 },
      );
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
    const result = await sendContact(id, parsed.data, {
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
          error:
            result.channel === "SMS"
              ? "no phone number on file for claimant; pass `to`"
              : "no email on file for claimant; pass `to`",
        },
        { status: 422 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: result.contactLog,
        send: {
          status: result.send.status,
          providerStatus: result.send.providerStatus,
          externalId: result.send.externalId,
          error: result.send.error,
        },
        followUpTaskCreated: result.followUpTaskCreated,
      },
      { status: 201 },
    );
  } catch (e) {
    return handleError(e);
  }
}
