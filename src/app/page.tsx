export const dynamic = 'force-dynamic';

import Link from 'next/link';
import { MapPin, ArrowRight, Building2 } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import CountyCard from '@/components/county/CountyCard';
import SearchBar from '@/components/search/SearchBar';

async function getStats() {
  const [totalCounties, stateCount] = await Promise.all([
    prisma.county.count(),
    prisma.county.groupBy({ by: ['state'] }).then(r => r.length),
  ]);
  return { totalCounties, stateCount };
}

async function getFeaturedCounties() {
  return prisma.county.findMany({
    where: { listUrl: { not: null } },
    orderBy: { rank: 'asc' },
    take: 6,
  });
}

export default async function HomePage() {
  const [stats, featured] = await Promise.all([getStats(), getFeaturedCounties()]);

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-blue-500/30 px-3 py-1 text-sm text-blue-100">
            <MapPin className="h-3.5 w-3.5" />
            {stats.totalCounties} counties across {stats.stateCount} states
          </div>
          <h1 className="mb-4 text-3xl font-bold text-white sm:text-5xl">
            Find Surplus Funds<br />from Rural US Counties
          </h1>
          <p className="mb-8 text-lg text-blue-100">
            Search publicly available tax sale proceeds, foreclosure overages, and unclaimed
            property lists from county treasurers and clerks nationwide.
          </p>
          <div className="mx-auto max-w-xl">
            <SearchBar size="large" />
          </div>
          <div className="mt-4 flex justify-center gap-4 text-sm text-blue-200">
            <span>Try: Alpine CA · Inyo CA · Loving TX</span>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-b border-gray-200 bg-white py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-8 text-center text-sm">
            <div>
              <div className="text-2xl font-bold text-blue-600">{stats.totalCounties}</div>
              <div className="text-gray-500">Counties tracked</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">{stats.stateCount}</div>
              <div className="text-gray-500">States covered</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">Weekly</div>
              <div className="text-gray-500">Auto-updated</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">Free</div>
              <div className="text-gray-500">Public data only</div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured counties with confirmed online lists */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Counties with Online Lists</h2>
            <p className="text-sm text-gray-500">Confirmed public surplus funds lists available online</p>
          </div>
          <Link
            href="/directory"
            className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
          >
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {featured.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map(county => (
              <CountyCard key={county.id} county={county} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-gray-300 p-12 text-center">
            <Building2 className="mx-auto mb-3 h-8 w-8 text-gray-300" />
            <p className="text-sm text-gray-500">
              Counties are being seeded. Run <code className="rounded bg-gray-100 px-1">npm run db:seed</code> to populate.
            </p>
          </div>
        )}

        <div className="mt-8 text-center">
          <Link
            href="/directory"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700"
          >
            Browse all {stats.totalCounties} counties
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="bg-amber-50 border-t border-amber-200 px-4 py-6">
        <div className="mx-auto max-w-3xl text-center text-sm text-amber-700">
          <strong>Legal disclaimer:</strong> All data sourced from publicly available county records.
          This tool is for informational purposes only. Users are responsible for verifying
          information and complying with local laws when filing surplus fund claims.
        </div>
      </section>
    </div>
  );
}
