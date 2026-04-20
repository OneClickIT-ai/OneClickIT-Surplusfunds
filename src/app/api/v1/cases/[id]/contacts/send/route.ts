import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { handleError } from "@/lib/api-utils";
import { rateLimit } from "@/lib/rate-limit";
import { sendContactSchema } from "@/modules/outbound/schemas";
import {
  sendAndLogEmail,
  sendAndLogSms,
  type SendOutcome,
} from "@/modules/outbound/server/send";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/v1/cases/:id/contacts/send
 *
 * Fires a real outbound SMS (Twilio) or email (Resend) and always writes an
 * audit row to ContactLog — success, provider failure, or DB failure. A
 * follow-up task is auto-seeded when the status maps to a failed attempt.
 *
 * Rate-limited per user to prevent operator mis-click storms from blowing the
 * provider budget.
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const limited = rateLimit(`contact-send:${session.user.id}`, 20, 60_000);
    if (!limited.success) {
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

    const { id: caseId } = await context.params;
    const actor = { userId: session.user.id, role: session.user.role };

    const outcome: SendOutcome =
      parsed.data.channel === "SMS"
        ? await sendAndLogSms(caseId, parsed.data, actor)
        : await sendAndLogEmail(caseId, parsed.data, actor);

    if ("notFound" in outcome) {
      return NextResponse.json({ error: "case not found" }, { status: 404 });
    }
    if ("forbidden" in outcome) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    if ("noRecipient" in outcome) {
      return NextResponse.json(
        { error: "claimant has no phone/email on file" },
        { status: 400 },
      );
    }

    const { sendResult, contactLog, followUpTaskCreated } = outcome;
    const httpStatus = sendResult.ok
      ? 201
      : sendResult.status === "not_configured"
        ? 503
        : 502;

    return NextResponse.json(
      {
        success: sendResult.ok,
        sendResult,
        data: contactLog,
        followUpTaskCreated,
        auditWritten: contactLog !== null,
      },
      { status: httpStatus },
    );
  } catch (e) {
    return handleError(e);
  }
}
