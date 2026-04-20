import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

describe("rateLimit (in-memory fallback)", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Force the fallback path by stripping Upstash env.
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    vi.resetModules();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("allows up to the limit, then blocks", async () => {
    const { rateLimit } = await import("@/lib/rate-limit");
    const key = `test:${Math.random()}`;
    for (let i = 0; i < 3; i++) {
      const r = await rateLimit(key, 3, 1000);
      expect(r.success).toBe(true);
      expect(r.limit).toBe(3);
      expect(r.reset).toBeGreaterThan(Date.now());
    }
    const fourth = await rateLimit(key, 3, 1000);
    expect(fourth.success).toBe(false);
    expect(fourth.remaining).toBe(0);
    expect(fourth.limit).toBe(3);
  });

  it("resets after the window expires", async () => {
    vi.useFakeTimers();
    const { rateLimit } = await import("@/lib/rate-limit");
    const key = `reset:${Math.random()}`;
    await rateLimit(key, 1, 1000);
    const blocked = await rateLimit(key, 1, 1000);
    expect(blocked.success).toBe(false);
    vi.advanceTimersByTime(1500);
    const afterWindow = await rateLimit(key, 1, 1000);
    expect(afterWindow.success).toBe(true);
    vi.useRealTimers();
  });
});

describe("requireCronSecret", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("accepts valid Bearer token", async () => {
    process.env.CRON_SECRET = "s3cret";
    const { requireCronSecret } = await import("@/lib/api-utils");
    const req = new Request("http://x.test", {
      headers: { authorization: "Bearer s3cret" },
    });
    expect(requireCronSecret(req)).toBe(true);
  });

  it("rejects wrong Bearer", async () => {
    process.env.CRON_SECRET = "s3cret";
    const { requireCronSecret } = await import("@/lib/api-utils");
    const req = new Request("http://x.test", {
      headers: { authorization: "Bearer nope" },
    });
    expect(requireCronSecret(req)).toBe(false);
  });

  it("accepts Vercel cron header + user-agent", async () => {
    const { requireCronSecret } = await import("@/lib/api-utils");
    const req = new Request("http://x.test", {
      headers: {
        "x-vercel-cron": "1",
        "user-agent": "vercel-cron/1.0",
      },
    });
    expect(requireCronSecret(req)).toBe(true);
  });

  it("rejects forged Vercel cron header without matching UA", async () => {
    const { requireCronSecret } = await import("@/lib/api-utils");
    const req = new Request("http://x.test", {
      headers: { "x-vercel-cron": "1", "user-agent": "curl/8.0" },
    });
    expect(requireCronSecret(req)).toBe(false);
  });

  it("rejects empty request", async () => {
    const { requireCronSecret } = await import("@/lib/api-utils");
    const req = new Request("http://x.test");
    expect(requireCronSecret(req)).toBe(false);
  });
});

describe("rate-limit response helpers", () => {
  it("applyRateLimitHeaders writes X-RateLimit-* onto the response", async () => {
    const { applyRateLimitHeaders } = await import("@/lib/api-utils");
    const { NextResponse } = await import("next/server");
    const reset = Date.now() + 30_000;
    const out = applyRateLimitHeaders(NextResponse.json({ ok: true }), {
      success: true,
      limit: 30,
      remaining: 29,
      reset,
    });
    expect(out.headers.get("X-RateLimit-Limit")).toBe("30");
    expect(out.headers.get("X-RateLimit-Remaining")).toBe("29");
    expect(out.headers.get("X-RateLimit-Reset")).toBe(String(Math.ceil(reset / 1000)));
  });

  it("rateLimitExceeded returns 429 with Retry-After", async () => {
    const { rateLimitExceeded } = await import("@/lib/api-utils");
    const reset = Date.now() + 10_000;
    const out = rateLimitExceeded({ success: false, limit: 30, remaining: 0, reset });
    expect(out.status).toBe(429);
    const retryAfter = Number(out.headers.get("Retry-After"));
    expect(retryAfter).toBeGreaterThanOrEqual(1);
    expect(retryAfter).toBeLessThanOrEqual(11);
    expect(out.headers.get("X-RateLimit-Remaining")).toBe("0");
  });
});
