import { NextRequest } from 'next/server';
import { ok, handleError } from '@/lib/api-utils';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  const limited = rateLimit(request);
  if (limited) return limited;
  try {
    const { query } = await request.json();
    if (!query) return ok({ query, tool: 'username', results: [], source: 'No query' });

    // WhatsMyName API - free, no key needed, searches 1,500+ platforms
    const results: Array<{ site: string; url: string; category: string }> = [];

    try {
      const res = await fetch(
        `https://api.whatsmyname.app/search/${encodeURIComponent(query)}`,
        { signal: AbortSignal.timeout(15000) }
      );
      if (res.ok) {
        const data = await res.json();
        // WhatsMyName returns an array of found profiles
        const found = Array.isArray(data) ? data : (data.found || data.results || []);
        for (const item of found.slice(0, 50)) {
          results.push({
            site: item.site || item.name || 'Unknown',
            url: item.url || item.uri || '#',
            category: item.cat || item.category || 'Social',
          });
        }
      }
    } catch { /* API timeout or error */ }

    return ok({
      query,
      tool: 'username',
      results: results.map(r => ({
        platform: r.site,
        profile_url: r.url,
        category: r.category,
      })),
      source: results.length > 0 ? 'WhatsMyName' : 'WhatsMyName (no results)',
    });
  } catch (e) {
    return handleError(e);
  }
}
