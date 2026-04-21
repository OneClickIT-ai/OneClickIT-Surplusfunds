import { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';

const BASE = 'https://surplusclickit.com';

// Generated on-demand so we don't need a live database at build time.
export const dynamic = 'force-dynamic';

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

  // DB-backed entries are best-effort: if the DB is briefly unreachable we
  // still want the sitemap to serve the static pages rather than 500.
  let countyPages: MetadataRoute.Sitemap = [];
  let statePages: MetadataRoute.Sitemap = [];
  try {
    const counties = await prisma.county.findMany({ select: { id: true, updatedAt: true } });
    countyPages = counties.map(c => ({
      url: `${BASE}/county/${c.id}`,
      lastModified: c.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }));

    const states = await prisma.unclaimedProperty.findMany({
      select: { state: true },
      distinct: ['state'],
    });
    statePages = states.map(s => ({
      url: `${BASE}/unclaimed/${s.state.toLowerCase()}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));
  } catch (err) {
    console.error('[sitemap] DB unavailable, serving static pages only:', err);
  }

  return [...staticPages, ...countyPages, ...statePages];
}
