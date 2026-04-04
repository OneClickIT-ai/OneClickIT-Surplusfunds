import { MetadataRoute } from 'next';
import { prisma } from '@/lib/prisma';

const BASE = 'https://surplusclickit.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages = [
    '', '/dashboard', '/directory', '/osint', '/lookup', '/unclaimed',
    '/claims', '/tools', '/learn', '/dorks', '/calculator', '/templates',
    '/requirements', '/pricing', '/partners', '/export', '/about',
    '/contact', '/faq', '/terms', '/privacy',
  ].map(path => ({
    url: `${BASE}${path}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: path === '' ? 1 : 0.8,
  }));

  const counties = await prisma.county.findMany({ select: { id: true, updatedAt: true } });
  const countyPages = counties.map(c => ({
    url: `${BASE}/county/${c.id}`,
    lastModified: c.updatedAt,
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  const states = await prisma.unclaimedProperty.findMany({
    select: { state: true },
    distinct: ['state'],
  });
  const statePages = states.map(s => ({
    url: `${BASE}/unclaimed/${s.state.toLowerCase()}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  return [...staticPages, ...countyPages, ...statePages];
}
