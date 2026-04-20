import { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';

// Regenerated on request so stale DB snapshots aren't baked into the build
// artifact — and, critically, the build doesn't fail when POSTGRES_URL is
// missing in CI (see the try/catch blocks below).
export const dynamic = 'force-dynamic';
export const revalidate = 3600;

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

  // DB-backed pages are best-effort: if the DB is unreachable (local build,
  // CI without POSTGRES_URL, upstream outage) we ship the static pages rather
  // than failing the whole build.
  let countyPages: MetadataRoute.Sitemap = [];
  try {
    const counties = await prisma.county.findMany({
      select: { id: true, updatedAt: true },
    });
    countyPages = counties.map((c) => ({
      url: `${BASE}/county/${c.id}`,
      lastModified: c.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }));
  } catch (e) {
    console.warn('[sitemap] county fetch skipped:', e instanceof Error ? e.message : e);
  }

  let statePages: MetadataRoute.Sitemap = [];
  try {
    const states = await prisma.unclaimedProperty.findMany({
      select: { state: true },
      distinct: ['state'],
    });
    statePages = states.map((s) => ({
      url: `${BASE}/unclaimed/${s.state.toLowerCase()}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));
  } catch (e) {
    console.warn('[sitemap] state fetch skipped:', e instanceof Error ? e.message : e);
  }

  return [...staticPages, ...countyPages, ...statePages];
}
