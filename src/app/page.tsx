export const dynamic = 'force-dynamic';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Building2, UserPlus, Search, FileText, Shield, DollarSign, Clock, Scale, Send } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import SearchBar from '@/components/search/SearchBar';
import DonateSection from '@/components/DonateSection';

async function getStats() {
  const [totalCounties, stateGroups, withUrls] = await Promise.all([
    prisma.county.count(),
    prisma.county.groupBy({ by: ['state'] }).then(r => r.length),
    prisma.county.count({ where: { listUrl: { not: null } } }),
  ]);
  return { totalCounties, stateCount: stateGroups, withUrls };
}

async function getRecentCounties() {
  return prisma.county.findMany({
    where: { listUrl: { not: null } },
    orderBy: [{ state: 'asc' }, { name: 'asc' }],
    take: 25,
  });
}

function formatPop(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
  return n.toString();
}

export default async function HomePage() {
  const [stats, counties] = await Promise.all([getStats(), getRecentCounties()]);

  return (
    <div>
      {/* Launch banner */}
      <div className="bg-green-600 px-4 py-2.5 text-center text-sm font-medium text-white">
        Now Live &mdash; Start finding surplus funds today.{' '}
        <a href="/auth/signup" className="underline hover:text-green-100">Create your free account</a>
      </div>

      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-600 to-blue-800 px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6">
            <Image src="/surplusfunds_favicon.png" alt="Surplus Funds" width={64} height={64} className="mx-auto h-16 w-16" />
          </div>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-blue-500/30 px-3 py-1 text-sm text-blue-100">
            {stats.withUrls} counties with online lists across {stats.stateCount} states
          </div>
          <h1 className="mb-4 text-3xl font-bold text-white sm:text-5xl">
            Find Surplus Funds and<br />Unclaimed Money from US Counties
          </h1>
          <p className="mb-8 text-lg text-blue-100">
            Search tax sale surplus, foreclosure overages, and unclaimed property lists from
            county treasurers and clerks nationwide &mdash; all in one searchable directory.
          </p>
          <div className="mx-auto max-w-xl">
            <SearchBar size="large" />
          </div>
          <div className="mt-4 flex justify-center gap-4 text-sm text-blue-200">
            <span>Try: Los Angeles · Sacramento · Maricopa AZ · DeKalb GA</span>
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
              <div className="text-2xl font-bold text-blue-600">{stats.withUrls}</div>
              <div className="text-gray-500">Online lists</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">Free</div>
              <div className="text-gray-500">Public data</div>
            </div>
          </div>
        </div>
      </section>

      {/* Freemium disclaimer */}
      <section className="bg-white px-4 pb-2">
        <p className="mx-auto max-w-2xl text-center text-xs text-gray-400">
          The core county directory is free to browse forever. Pro plans unlock CSV exports,
          vetted data, and advanced tracking for professional surplus-funds businesses.{' '}
          <Link href="/pricing" className="text-blue-500 hover:underline">View pricing</Link>
        </p>
      </section>

      {/* How to Claim Surplus Funds — 8 steps */}
      <section className="bg-gray-50 border-b border-gray-200 px-4 py-16">
        <div className="mx-auto max-w-5xl">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">How to Claim Surplus Funds</h2>
            <p className="mt-2 text-gray-500">The complete process from finding funds to getting paid</p>
          </div>

          {/* Timeline */}
          <div className="relative">
            {/* Vertical line (hidden on mobile) */}
            <div className="absolute left-6 top-0 bottom-0 hidden w-0.5 bg-gray-200 sm:block" />

            <div className="space-y-6">
              {[
                {
                  step: 1,
                  icon: <UserPlus className="h-5 w-5" />,
                  color: 'blue',
                  title: 'Create Your Free Account',
                  desc: 'Sign up in seconds with Google. No credit card required. Get instant access to our county directory.',
                  tag: 'Get started',
                },
                {
                  step: 2,
                  icon: <Search className="h-5 w-5" />,
                  color: 'blue',
                  title: 'Search the County Directory',
                  desc: `Browse ${stats.totalCounties} counties across ${stats.stateCount} states. Filter by state, population, or keyword to find counties with active surplus funds lists.`,
                  tag: 'Research',
                },
                {
                  step: 3,
                  icon: <FileText className="h-5 w-5" />,
                  color: 'green',
                  title: 'Review Surplus Funds Lists',
                  desc: 'Access direct links to official county surplus funds pages. Review property details, amounts, former owner names, and parcel numbers.',
                  tag: 'Research',
                },
                {
                  step: 4,
                  icon: <Clock className="h-5 w-5" />,
                  color: 'green',
                  title: 'Check Deadlines & Eligibility',
                  desc: 'Each county listing shows the applicable state statute (e.g., CA Rev & Tax Code §4675) and claim deadline. Verify you are within the filing window — typically 1 year for CA, 2 years for TX, 120 days for FL.',
                  tag: 'Due diligence',
                },
                {
                  step: 5,
                  icon: <Shield className="h-5 w-5" />,
                  color: 'purple',
                  title: 'Identify the Rightful Claimant',
                  desc: 'Use our free OSINT tools to locate the former property owner or their heirs. Verify addresses, phone numbers, and public records to confirm identity and establish contact.',
                  tag: 'Free tool',
                },
                {
                  step: 6,
                  icon: <Scale className="h-5 w-5" />,
                  color: 'purple',
                  title: 'Prepare Your Claim Package',
                  desc: 'Download the county claim form (linked from our directory). Gather required documents: proof of identity, recorded deed, assignment of rights (if filing on behalf of owner), and any county-specific forms.',
                  tag: 'Documentation',
                },
                {
                  step: 7,
                  icon: <Send className="h-5 w-5" />,
                  color: 'orange',
                  title: 'File the Claim with the County',
                  desc: 'Submit your completed claim package to the county Treasurer-Tax Collector (CA), District Clerk (TX), Clerk of Court (FL), or relevant office. Some counties accept mail; others require in-person filing.',
                  tag: 'Action',
                },
                {
                  step: 8,
                  icon: <DollarSign className="h-5 w-5" />,
                  color: 'green',
                  title: 'Receive Your Funds',
                  desc: 'After review (typically 30-90 days), the county distributes funds to approved claimants. In CA, the Board of Supervisors must approve. Some counties have a 90-day dispute period before payment.',
                  tag: 'Payout',
                },
              ].map((item) => {
                const colors: Record<string, { bg: string; text: string; ring: string; tagBg: string; tagText: string }> = {
                  blue:   { bg: 'bg-blue-100',   text: 'text-blue-600',   ring: 'ring-blue-600',   tagBg: 'bg-blue-50',   tagText: 'text-blue-700' },
                  green:  { bg: 'bg-green-100',  text: 'text-green-600',  ring: 'ring-green-600',  tagBg: 'bg-green-50',  tagText: 'text-green-700' },
                  purple: { bg: 'bg-purple-100', text: 'text-purple-600', ring: 'ring-purple-600', tagBg: 'bg-purple-50', tagText: 'text-purple-700' },
                  orange: { bg: 'bg-orange-100', text: 'text-orange-600', ring: 'ring-orange-600', tagBg: 'bg-orange-50', tagText: 'text-orange-700' },
                };
                const c = colors[item.color];
                return (
                  <div key={item.step} className="relative flex gap-4 sm:gap-6">
                    {/* Step number circle */}
                    <div className={`relative z-10 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full ${c.bg} ${c.text} ring-4 ring-white`}>
                      {item.icon}
                    </div>
                    {/* Content */}
                    <div className="flex-1 rounded-xl bg-white border border-gray-100 p-5 shadow-sm">
                      <div className="mb-1 flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-400">STEP {item.step}</span>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${c.tagBg} ${c.tagText}`}>
                          {item.tag}
                        </span>
                      </div>
                      <h3 className="mb-1 font-semibold text-gray-900">{item.title}</h3>
                      <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/auth/signup"
              className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-6 py-3 text-sm font-medium text-white hover:bg-green-700"
            >
              <UserPlus className="h-4 w-4" />
              Start claiming — create free account
            </Link>
            <Link
              href="/directory"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <Search className="h-4 w-4" />
              Browse county directory
            </Link>
          </div>
        </div>
      </section>

      {/* County Data Table — fully public */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Surplus Funds Directory</h2>
            <p className="text-sm text-gray-500">All data is public — no login required</p>
          </div>
          <Link
            href="/directory"
            className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
          >
            View all {stats.totalCounties} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {counties.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-gray-200" aria-label="Surplus funds county directory">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">County</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">State</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Population</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Source</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Deadline</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">List</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {counties.map(county => (
                  <tr key={county.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">
                      <Link href={`/county/${county.id}`} className="font-medium text-blue-600 hover:underline">
                        {county.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{county.state}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{county.population > 0 ? formatPop(county.population) : '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500 max-w-[200px] truncate">{county.source || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{county.claimDeadline || '—'}</td>
                    <td className="px-4 py-3 text-sm">
                      {county.listUrl ? (
                        <a
                          href={county.listUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-blue-600 hover:underline text-xs"
                        >
                          View list <ArrowRight className="h-3 w-3" />
                        </a>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-gray-300 p-12 text-center">
            <Building2 className="mx-auto mb-3 h-8 w-8 text-gray-300" />
            <p className="text-sm text-gray-500">Counties are being loaded. Check back shortly.</p>
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

      {/* Donate to keep the site free */}
      <DonateSection />

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
