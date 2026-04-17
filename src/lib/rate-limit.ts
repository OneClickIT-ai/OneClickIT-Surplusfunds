// Rate limiter using a simple sliding window
// TODO: For production, replace with Vercel KV or Redis for distributed rate limiting
// This in-memory implementation is per-serverless-instance and ineffective on Vercel

const rateMap = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(identifier: string, limit: number = 10, windowMs: number = 60_000) {
  const now = Date.now();
  const entry = rateMap.get(identifier);

  if (!entry || now > entry.resetTime) {
    rateMap.set(identifier, { count: 1, resetTime: now + windowMs });
    return { success: true, remaining: limit - 1 };
  }

  if (entry.count >= limit) {
    return { success: false, remaining: 0 };
  }

  entry.count++;
  return { success: true, remaining: limit - entry.count };
}

// NOTE: Replace with Vercel KV implementation for distributed environments:
// import { kv } from '@vercel/kv';
// export async function rateLimit(identifier: string, limit = 10, windowMs = 60_000) {
//   const key = `rate_limit:${identifier}`;
//   const count = await kv.incr(key);
//   if (count === 1) await kv.expire(key, Math.ceil(windowMs / 1000));
//   return { success: count <= limit, remaining: Math.max(0, limit - count) };
// }
