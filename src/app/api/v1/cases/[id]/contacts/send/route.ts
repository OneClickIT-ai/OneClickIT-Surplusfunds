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
  params: { id: string };
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    // Cap real outbound sends per user to keep a misfiring UI (or malicious
    // operator) from spraying claimants. Quick-log path is uncapped.
    const limit = rateLimit(`contact-send:${session.user.id}`, 30, 60_000);
    if (!limit.success) {
      return NextResponse.json(
        { error: "rate limit exceeded — try again in a minute" },
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

    const result = await sendContact(context.params.id, parsed.data, {
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
          error: `no ${result.channel === "SMS" ? "phone number" : "email address"} on file for claimant`,
        },
        { status: 422 },
      );
    }

    if (!result.send.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: result.send.message,
          reason: result.send.reason,
          contactLog: result.contactLog,
          followUpTaskCreated: result.followUpTaskCreated,
        },
        { status: 502 },
      );
    }

    return NextResponse.json(
      {
        ok: true,
        data: result.contactLog,
        providerStatus: result.send.providerStatus,
      },
      { status: 201 },
    );
  } catch (e) {
    return handleError(e);
  }
}
