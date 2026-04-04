export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import { ExternalLink, Users } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import CountyFilters from '@/components/county/CountyFilters';

export const metadata: Metadata = {
  title: 'County Directory',
  description:
    'Browse surplus funds lists from hundreds of US counties. Filter by state, search by county name, and access direct links to official public records.',
  alternates: { canonical: '/directory' },
  openGraph: {
    title: 'County Surplus Funds Directory | SurplusClickIT',
    description: 'Browse surplus funds lists from hundreds of US counties.',
    url: 'https://surplusclickit.com/directory',
  },
};
import Badge from '@/components/ui/Badge';

interface PageProps {
  searchParams: {
    q?: string;
    state?: string;
    minPop?: string;
    maxPop?: string;
    page?: string;
  };
}

const LIMIT = 25;

async function getCounties(params: PageProps['searchParams']) {
  const page = parseInt(params.page || '1');
  const skip = (page - 1) * LIMIT;

  const where: Record<string, unknown> = {};

  if (params.q) {
    where.OR = [
      { name: { contains: params.q, mode: 'insensitive' } },
      { state: { contains: params.q, mode: 'insensitive' } },
      { notes: { contains: params.q, mode: 'insensitive' } },
    ];
  }
  if (params.state) where.state = params.state;
  if (params.minPop) where.population = { ...((where.population as object) || {}), gte: parseInt(params.minPop) };
  if (params.maxPop) where.population = { ...((where.population as object) || {}), lte: parseInt(params.maxPop) };

  const [counties, total] = await Promise.all([
    prisma.county.findMany({ where, orderBy: { rank: 'asc' }, take: LIMIT, skip }),
    prisma.county.count({ where }),
  ]);

  return { counties, total, page, totalPages: Math.ceil(total / LIMIT) };
}

function formatPop(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
  return n.toString();
}

export default async function DirectoryPage({ searchParams }: PageProps) {
  const { counties, total, page, totalPages } = await getCounties(searchParams);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">County Directory</h1>
        <p className="text-sm text-gray-500">Browse surplus funds lists from {total} US counties. Filter by state, population, or keywords, then follow direct links to official county pages to verify amounts and claim procedures.</p>
      </div>

      <div className="mb-6">
        <Suspense fallback={<div />}>
          <CountyFilters />
        </Suspense>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Rank</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">County</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">State</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Population</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Source</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">List</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {counties.map(county => (
              <tr key={county.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-400">#{county.rank}</td>
                <td className="px-4 py-3 font-medium">
                  <Link href={`/county/${county.id}`} className="text-blue-600 hover:underline">
                    {county.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-gray-600">{county.state}</td>
                <td className="px-4 py-3 text-gray-600">
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5 text-gray-400" />
                    {formatPop(county.population)}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500 max-w-xs truncate">{county.source || '—'}</td>
                <td className="px-4 py-3">
                  {county.listUrl ? (
                    <a
                      href={county.listUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                    >
                      <ExternalLink className="h-3.5 w-3.5" /> View
                    </a>
                  ) : (
                    <Badge variant="default">Contact</Badge>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {counties.length === 0 && (
          <div className="py-12 text-center text-sm text-gray-500">
            No counties match your filters. Try adjusting the search.
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-gray-500">Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={`/directory?${new URLSearchParams({ ...searchParams, page: String(page - 1) })}`}
                className="rounded-lg border border-gray-300 px-3 py-1.5 hover:bg-gray-50"
              >
                Previous
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`/directory?${new URLSearchParams({ ...searchParams, page: String(page + 1) })}`}
                className="rounded-lg border border-gray-300 px-3 py-1.5 hover:bg-gray-50"
              >
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
