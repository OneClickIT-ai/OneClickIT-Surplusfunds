import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/**
 * Distributed rate limiter with an in-memory fallback.
 *
 * On Vercel (multi-instance serverless), the in-memory Map resets per cold
 * start and is effectively no limit. When `UPSTASH_REDIS_REST_URL` +
 * `UPSTASH_REDIS_REST_TOKEN` are set, we delegate to @upstash/ratelimit's
 * sliding-window algorithm, which is consistent across instances.
 *
 * The fallback Map is only kept for local dev / CI where Upstash isn't
 * configured; it is NOT safe for production traffic.
 */

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  /** ms epoch when the current window rolls over */
  reset: number;
}

const rateMap = new Map<string, { count: number; resetTime: number }>();
const limiterCache = new Map<string, Ratelimit>();

function getUpstashRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

function getLimiter(limit: number, windowMs: number): Ratelimit | null {
  const redis = getUpstashRedis();
  if (!redis) return null;
  const key = `${limit}:${windowMs}`;
  const cached = limiterCache.get(key);
  if (cached) return cached;
  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(limit, `${windowMs} ms`),
    analytics: false,
    prefix: "oci-rl",
  });
  limiterCache.set(key, limiter);
  return limiter;
}

function fallback(identifier: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const entry = rateMap.get(identifier);
  if (!entry || now > entry.resetTime) {
    const resetTime = now + windowMs;
    rateMap.set(identifier, { count: 1, resetTime });
    return { success: true, limit, remaining: limit - 1, reset: resetTime };
  }
  if (entry.count >= limit) {
    return { success: false, limit, remaining: 0, reset: entry.resetTime };
  }
  entry.count++;
  return { success: true, limit, remaining: limit - entry.count, reset: entry.resetTime };
}

export async function rateLimit(
  identifier: string,
  limit: number = 10,
  windowMs: number = 60_000,
): Promise<RateLimitResult> {
  const limiter = getLimiter(limit, windowMs);
  if (!limiter) return fallback(identifier, limit, windowMs);
  try {
    const { success, limit: responseLimit, remaining, reset } = await limiter.limit(identifier);
    return { success, limit: responseLimit, remaining, reset };
  } catch (e) {
    // If Upstash is configured but unreachable, don't block the request —
    // degrade to the in-memory window so traffic keeps flowing.
    console.error("[rate-limit] upstash call failed, falling back", e);
    return fallback(identifier, limit, windowMs);
  }
}
