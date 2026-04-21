import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { handleError } from "@/lib/api-utils";
import { rateLimit } from "@/lib/rate-limit";
import { sendContactSchema } from "@/modules/outbound/schemas";
import { sendAndLogContact } from "@/modules/outbound/server/send-contact";

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

    // Protect against accidental mis-clicks and also prevent a compromised
    // account from burning through Twilio/Resend credits.
    const rl = rateLimit(`send-contact:${session.user.id}`, 20, 60_000);
    if (!rl.success) {
      return NextResponse.json(
        { error: "rate_limited", message: "Too many sends — slow down." },
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
    const result = await sendAndLogContact(id, parsed.data, {
      userId: session.user.id,
      role: session.user.role,
    });

    if ("notFound" in result) {
      return NextResponse.json({ error: "case not found" }, { status: 404 });
    }
    if ("forbidden" in result) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    if ("noClaimant" in result) {
      return NextResponse.json(
        {
          error: "no_claimant",
          message: "No claimant is linked to this case yet.",
        },
        { status: 400 },
      );
    }
    if ("missingContact" in result) {
      return NextResponse.json(
        {
          error: "missing_contact",
          message:
            result.missingContact === "phone"
              ? "Claimant has no phone on file."
              : "Claimant has no email on file.",
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        success: result.sent,
        sent: result.sent,
        providerStatus: result.providerStatus,
        providerError: result.providerError,
        followUpTaskCreated: result.followUpTaskCreated,
        data: result.contactLog,
      },
      { status: result.sent ? 201 : 502 },
    );
  } catch (e) {
    return handleError(e);
  }
}
