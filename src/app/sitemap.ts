import { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';

const BASE = 'https://surplusclickit.com';

// Generate at request time so a missing POSTGRES_URL at build time can't crash
// the build — sitemap falls back to static pages only if the DB is unreachable.
export const dynamic = 'force-dynamic';
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
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

  try {
    const [counties, states] = await Promise.all([
      prisma.county.findMany({ select: { id: true, updatedAt: true } }),
      prisma.unclaimedProperty.findMany({ select: { state: true }, distinct: ['state'] }),
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
  } catch {
    return staticPages;
  }
}
