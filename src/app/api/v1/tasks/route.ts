import { NextRequest, NextResponse } from "next/server";

import { auth } from '@/lib/auth';
import { handleError, applyRateLimitHeaders, rateLimitExceeded } from "@/lib/api-utils";
import { rateLimit } from "@/lib/rate-limit";
import { createTaskSchema, tasksQuerySchema } from "@/modules/tasks/schemas";
import { createTask, listTasks } from "@/modules/tasks/server/service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const params = Object.fromEntries(request.nextUrl.searchParams.entries());
    const parsed = tasksQuerySchema.safeParse(params);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "validation failed", issues: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const result = await listTasks(parsed.data, {
      userId: session.user.id,
      role: session.user.role,
    });
    return NextResponse.json(result);
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const rl = await rateLimit(`v1:tasks:write:${session.user.id}`, 60, 60_000);
    if (!rl.success) return rateLimitExceeded(rl);

    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.toLowerCase().includes("application/json")) {
      return NextResponse.json(
        { error: "Content-Type must be application/json" },
        { status: 415 },
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
    }

    const parsed = createTaskSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "validation failed", issues: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const task = await createTask(parsed.data, {
      userId: session.user.id,
      role: session.user.role,
    });
    return applyRateLimitHeaders(
      NextResponse.json({ success: true, data: task }, { status: 201 }),
      rl,
    );
  } catch (e) {
    return handleError(e);
  }
}
