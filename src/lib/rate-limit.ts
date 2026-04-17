const rateMap = new Map<string, { count: number; resetTime: number }>();

/**
 * Simple in-memory rate limiter.
 * Returns true if the request should be allowed, false if rate-limited.
 */
export function rateLimit(
  key: string,
  { limit = 20, windowMs = 60_000 }: { limit?: number; windowMs?: number } = {}
): boolean {
  const now = Date.now();
  const entry = rateMap.get(key);

  if (!entry || now > entry.resetTime) {
    rateMap.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }

  entry.count++;
  if (entry.count > limit) return false;
  return true;
}

// Periodically clean up expired entries (every 5 minutes)
if (typeof setInterval !== 'undefined') {
  const timer = setInterval(() => {
    const now = Date.now();
    rateMap.forEach((entry, key) => {
      if (now > entry.resetTime) rateMap.delete(key);
    });
  }, 5 * 60_000);
  // Don't prevent Node.js from shutting down cleanly
  if (timer && typeof timer === 'object' && 'unref' in timer) {
    timer.unref();
  }
}

/**
 * Extract client IP — prefer x-real-ip (set by Vercel, not spoofable)
 * over x-forwarded-for (spoofable). Reject requests with no identifiable IP.
 */
export function getClientIP(headers: Headers): string | null {
  return (
    headers.get('x-real-ip') ||
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    null
  );
}
