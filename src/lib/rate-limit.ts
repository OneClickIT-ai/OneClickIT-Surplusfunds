import { NextRequest } from 'next/server';
import { err } from './api-utils';

const windowMs = 60_000; // 1 minute
const requests = new Map<string, { count: number; resetAt: number }>();

// Cleanup stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  requests.forEach((val, key) => {
    if (now > val.resetAt) requests.delete(key);
  });
}, 300_000);

export function rateLimit(req: NextRequest, limit = 20) {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown';

  const now = Date.now();
  const entry = requests.get(ip);

  if (!entry || now > entry.resetAt) {
    requests.set(ip, { count: 1, resetAt: now + windowMs });
    return null;
  }

  entry.count++;
  if (entry.count > limit) {
    return err('Too many requests. Please try again in a minute.', 429);
  }

  return null;
}
