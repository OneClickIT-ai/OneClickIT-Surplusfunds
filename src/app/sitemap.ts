import { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';

// Render at request time — sitemap reads from Postgres, which isn't reachable
// during static prerender (e.g. CI builds without POSTGRES_URL set).
export const dynamic = 'force-dynamic';

const BASE = 'https://surplusclickit.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Only include public, indexable pages — exclude auth-gated routes
  const staticPages = [
    { path: '', priority: 1.0 },
    { path: '/directory', priority: 0.9 },
    { path: '/unclaimed', priority: 0.9 },
    { path: '/osint', priority: 0.8 },
    { path: '/lookup', priority: 0.8 },
    { path: '/tools', priority: 0.8 },
    { path: '/pricing', priority: 0.8 },
    { path: '/requirements', priority: 0.7 },
    { path: '/partners', priority: 0.6 },
    { path: '/about', priority: 0.6 },
    { path: '/contact', priority: 0.6 },
    { path: '/faq', priority: 0.6 },
    { path: '/terms', priority: 0.4 },
    { path: '/privacy', priority: 0.4 },
  ].map(({ path, priority }) => ({
    url: `${BASE}${path}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority,
  }));

  // Skip the DB-derived rows when POSTGRES_URL isn't set so build/preview
  // environments without a database still produce a valid (static-only)
  // sitemap instead of failing the page render.
  if (!process.env.POSTGRES_URL) {
    return staticPages;
  }

  try {
    const [counties, states] = await Promise.all([
      prisma.county.findMany({ select: { id: true, updatedAt: true } }),
      prisma.unclaimedProperty.findMany({
        select: { state: true },
        distinct: ['state'],
      }),
    ]);

    const countyPages = counties.map(c => ({
      url: `${BASE}/county/${c.id}`,
      lastModified: c.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }));
    const statePages = states.map(s => ({
      url: `${BASE}/unclaimed/${s.state.toLowerCase()}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));
    return [...staticPages, ...countyPages, ...statePages];
  } catch (err) {
    // Don't break the public sitemap because of a transient DB issue —
    // serve the static spine and let the next request retry.
    console.error('[sitemap] DB lookup failed; serving static spine only', err);
    return staticPages;
  }
}
