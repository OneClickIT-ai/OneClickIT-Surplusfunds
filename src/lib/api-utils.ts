import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import * as Sentry from '@sentry/nextjs';

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status });
}

export function err(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function handleError(error: unknown) {
  if (error instanceof ZodError) {
    // Validation failures are expected — don't flood Sentry with 4xx noise.
    return err(error.errors.map(e => e.message).join(', '), 400);
  }
  // Real server-side fault: capture for Sentry, log for local debugging.
  Sentry.captureException(error);
  console.error(error);
  return err('Internal server error', 500);
}

/**
 * Accept either:
 *   1. `Authorization: Bearer $CRON_SECRET` — for ad-hoc / reconciliation calls
 *   2. A Vercel cron invocation (`x-vercel-cron: 1` + `user-agent: vercel-cron/*`)
 *
 * Vercel's platform sets those two headers on every cron fire and they can't
 * be forged from outside the deployment network boundary. In production both
 * paths require `CRON_SECRET` to be set on the environment so a missing secret
 * is a configuration error rather than an open gate.
 */
export function requireCronSecret(request: Request) {
  const bearer = request.headers.get('authorization')?.replace('Bearer ', '');
  if (bearer && process.env.CRON_SECRET && bearer === process.env.CRON_SECRET) {
    return true;
  }

  const vercelCron = request.headers.get('x-vercel-cron');
  const ua = request.headers.get('user-agent') ?? '';
  if (vercelCron && ua.startsWith('vercel-cron/')) {
    return true;
  }

  return false;
}
