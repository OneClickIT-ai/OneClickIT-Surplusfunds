import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import * as Sentry from '@sentry/nextjs';
import type { RateLimitResult } from './rate-limit';

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

/**
 * Copy the RFC 6585-ish `X-RateLimit-*` headers onto a response. Use on both
 * the 429 path and the success path so clients can always see their budget.
 */
export function applyRateLimitHeaders<T extends NextResponse>(
  response: T,
  result: RateLimitResult,
): T {
  response.headers.set('X-RateLimit-Limit', String(result.limit));
  response.headers.set('X-RateLimit-Remaining', String(result.remaining));
  response.headers.set('X-RateLimit-Reset', String(Math.ceil(result.reset / 1000)));
  return response;
}

/**
 * Build the canonical 429 response for a blocked request, including
 * `Retry-After` in seconds so well-behaved clients back off.
 */
export function rateLimitExceeded(result: RateLimitResult): NextResponse {
  const retryAfter = Math.max(1, Math.ceil((result.reset - Date.now()) / 1000));
  const response = NextResponse.json(
    { error: 'rate limit exceeded' },
    { status: 429 },
  );
  applyRateLimitHeaders(response, result);
  response.headers.set('Retry-After', String(retryAfter));
  return response;
}
