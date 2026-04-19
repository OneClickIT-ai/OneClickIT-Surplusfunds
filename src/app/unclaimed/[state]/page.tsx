export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, Phone, Clock, DollarSign, Search, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { STATE_UNCLAIMED_PROGRAMS } from '@/lib/unclaimed-property-states';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';

interface Props {
  params: Promise<{ state: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { state } = await params;
  const stateCode = state.toUpperCase();
  const program = STATE_UNCLAIMED_PROGRAMS.find(s => s.code === stateCode);
  if (!program) return {};
  return {
    title: `${program.name} Unclaimed Property — Search & Claim Guide`,
    description: `Search for unclaimed property in ${program.name}. Find missing money, forgotten bank accounts, and unclaimed assets through the official ${program.name} state portal.`,
    keywords: [`${program.name} unclaimed property`, `${stateCode} missing money`, `${program.name} unclaimed funds`, 'unclaimed property search'],
    alternates: { canonical: `/unclaimed/${state.toLowerCase()}` },
    openGraph: {
      title: `${program.name} Unclaimed Property Search`,
      description: `Find and claim unclaimed property in ${program.name} — official state portal links, tips, and deadlines.`,
    },
  };
}

export default async function StateUnclaimedPage({ params }: Props) {
  const { state } = await params;
  const stateCode = state.toUpperCase();
  const program = STATE_UNCLAIMED_PROGRAMS.find(s => s.code === stateCode);

  if (!program) notFound();

  // Fetch any scraped unclaimed property records for this state
  let properties: Array<{
    id: string;
    ownerName: string;
    propertyType: string;
    reportedAmount: number | null;
    holderName: string | null;
    city: string | null;
    reportedDate: string | null;
  }> = [];
  let totalCount = 0;

  try {
    [properties, totalCount] = await Promise.all([
      prisma.unclaimedProperty.findMany({
        where: { state: stateCode },
        orderBy: { reportedAmount: 'desc' },
        take: 100,
        select: {
          id: true,
          ownerName: true,
          propertyType: true,
          reportedAmount: true,
          holderName: true,
          city: true,
          reportedDate: true,
        },
      }),
      prisma.unclaimedProperty.count({ where: { state: stateCode } }),
    ]);
  } catch {
    // Table may not exist yet
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Back link */}
      <Link href="/unclaimed" className="mb-6 inline-flex items-center gap-1 text-sm text-blue-600 hover:underline">
        <ArrowLeft className="h-4 w-4" />
        All States
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-lg font-bold text-blue-700">
            {program.code}
          </span>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{program.name} Unclaimed Property</h1>
            <p className="text-sm text-gray-500">{program.agency}</p>
          </div>
        </div>
      </div>

      {/* Quick action */}
      <div className="mb-8 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white shadow-lg">
        <h2 className="text-lg font-semibold mb-2">Search {program.name}&apos;s Official Portal</h2>
        <p className="text-blue-100 text-sm mb-4">{program.description}</p>
        <div className="flex flex-wrap gap-3">
          <a
            href={program.searchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-50 transition-colors"
          >
            <Search className="h-4 w-4" />
            Search for Your Name
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
          <a
            href={program.claimUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-white/30 px-5 py-2.5 text-sm font-medium text-white hover:bg-white/10 transition-colors"
          >
            File a Claim
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>

      {/* Info grid */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="h-4 w-4 text-blue-500" />
            <span className="text-xs font-medium text-gray-500 uppercase">Dormancy Period</span>
          </div>
          <p className="text-lg font-semibold text-gray-900">{program.dormancyPeriod}</p>
          <p className="text-xs text-gray-500">before property is reported</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="h-4 w-4 text-green-500" />
            <span className="text-xs font-medium text-gray-500 uppercase">Minimum Amount</span>
          </div>
          <p className="text-lg font-semibold text-gray-900">{program.minAmount}</p>
          <p className="text-xs text-gray-500">to file a claim</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Phone className="h-4 w-4 text-purple-500" />
            <span className="text-xs font-medium text-gray-500 uppercase">Phone</span>
          </div>
          <p className="text-lg font-semibold text-gray-900">{program.phone}</p>
          <p className="text-xs text-gray-500">unclaimed property office</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-xs font-medium text-gray-500 uppercase">Cost to Claim</span>
          </div>
          <p className="text-lg font-semibold text-gray-900">Free</p>
          <p className="text-xs text-gray-500">always free to claim</p>
        </div>
      </div>

      {/* Property types */}
      <div className="mb-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 font-semibold text-gray-900">Types of Unclaimed Property in {program.name}</h2>
        <div className="flex flex-wrap gap-2">
          {program.propertyTypes.map(type => (
            <span key={type} className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-gray-700">
              {type}
            </span>
          ))}
        </div>
      </div>

      {/* Tips */}
      <div className="mb-8 rounded-xl bg-amber-50 border border-amber-200 p-6">
        <div className="flex items-start gap-3">
          <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
          <div>
            <h3 className="font-semibold text-amber-900">Search Tips for {program.name}</h3>
            <p className="mt-1 text-sm text-amber-700">{program.tips}</p>
            <ul className="mt-3 space-y-1 text-sm text-amber-700">
              <li>• Search your current and maiden name</li>
              <li>• Try previous addresses where you lived or worked</li>
              <li>• Check for deceased family members and heirs</li>
              <li>• Search business names if you owned a company</li>
              <li>• Use partial names if the portal supports it</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Scraped data table */}
      {properties.length > 0 ? (
        <div className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Unclaimed Property Records ({totalCount.toLocaleString()} total)
            </h2>
            <span className="text-xs text-gray-400">Showing top 100 by amount</span>
          </div>
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Owner Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Holder</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">City</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {properties.map(prop => (
                  <tr key={prop.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{prop.ownerName}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{prop.propertyType}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {prop.reportedAmount ? `$${prop.reportedAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{prop.holderName || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{prop.city || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="mb-8 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
          <Search className="mx-auto mb-3 h-8 w-8 text-gray-300" />
          <h3 className="font-medium text-gray-700">No scraped records yet for {program.name}</h3>
          <p className="mt-1 text-sm text-gray-500">
            Search directly on the{' '}
            <a href={program.searchUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
              official {program.name} portal
            </a>{' '}
            for the most up-to-date results.
          </p>
        </div>
      )}

      {/* Warning */}
      <div className="rounded-xl bg-red-50 border border-red-200 p-5">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" />
          <div>
            <h3 className="font-semibold text-red-900">Beware of Scams</h3>
            <p className="mt-1 text-sm text-red-700">
              You should <strong>never pay</strong> to search for or claim unclaimed property. All state programs are free.
              Be cautious of letters, emails, or phone calls from companies offering to claim property for a fee.
              Always use official state websites to search and file claims.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
