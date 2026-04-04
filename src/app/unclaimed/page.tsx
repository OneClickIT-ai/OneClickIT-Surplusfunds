'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, Phone, MapPin, Clock, DollarSign, ChevronRight, Building2 } from 'lucide-react';
import { STATE_UNCLAIMED_PROGRAMS, StateUnclaimedProgram } from '@/lib/unclaimed-property-states';

const PROPERTY_TYPE_COLORS: Record<string, string> = {
  'Bank accounts': 'bg-blue-50 text-blue-700',
  'Insurance': 'bg-green-50 text-green-700',
  'Wages': 'bg-orange-50 text-orange-700',
  'Securities': 'bg-purple-50 text-purple-700',
  'Stocks': 'bg-purple-50 text-purple-700',
  'Stocks/dividends': 'bg-purple-50 text-purple-700',
  'Safe deposit boxes': 'bg-amber-50 text-amber-700',
  'Utility deposits': 'bg-gray-100 text-gray-700',
  'Utility refunds': 'bg-gray-100 text-gray-700',
  'Oil/gas royalties': 'bg-yellow-50 text-yellow-700',
  'Mineral royalties': 'bg-yellow-50 text-yellow-700',
  'Mineral rights': 'bg-yellow-50 text-yellow-700',
  'Court deposits': 'bg-red-50 text-red-700',
  'Court funds': 'bg-red-50 text-red-700',
  'Casino winnings': 'bg-pink-50 text-pink-700',
};

function getTypeColor(type: string) {
  return PROPERTY_TYPE_COLORS[type] || 'bg-gray-50 text-gray-600';
}

export default function UnclaimedPropertyPage() {
  const [search, setSearch] = useState('');
  const [dormancyFilter, setDormancyFilter] = useState<string>('');

  const filtered = STATE_UNCLAIMED_PROGRAMS.filter(s => {
    const matchesSearch = !search ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.code.toLowerCase().includes(search.toLowerCase()) ||
      s.agency.toLowerCase().includes(search.toLowerCase());
    const matchesDormancy = !dormancyFilter || s.dormancyPeriod === dormancyFilter;
    return matchesSearch && matchesDormancy;
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Unclaimed Property by State</h1>
        <p className="mt-2 text-gray-500 max-w-2xl mx-auto">
          Use these official state unclaimed property portals to search for forgotten bank accounts,
          insurance payouts, wages, and other funds. This is separate from county surplus funds
          (tax sale overages), which are listed in the{' '}
          <Link href="/directory" className="text-blue-600 hover:underline">County Directory</Link>.
        </p>
      </div>

      {/* Quick stats */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4 text-center shadow-sm">
          <div className="text-2xl font-bold text-blue-600">50</div>
          <div className="text-xs text-gray-500">State Programs</div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 text-center shadow-sm">
          <div className="text-2xl font-bold text-green-600">$80B+</div>
          <div className="text-xs text-gray-500">Total Held Nationwide</div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 text-center shadow-sm">
          <div className="text-2xl font-bold text-purple-600">1 in 10</div>
          <div className="text-xs text-gray-500">Americans Have Funds</div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 text-center shadow-sm">
          <div className="text-2xl font-bold text-orange-600">Free</div>
          <div className="text-xs text-gray-500">To Search & Claim</div>
        </div>
      </div>

      {/* Multi-state search tip */}
      <div className="mb-6 rounded-xl bg-blue-50 border border-blue-200 p-5">
        <div className="flex items-start gap-3">
          <Search className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
          <div>
            <h3 className="font-semibold text-blue-900">Search Multiple States at Once</h3>
            <p className="mt-1 text-sm text-blue-700">
              If you&apos;ve lived in multiple states, check each one — unclaimed property is held by the state where the company
              last had your address on file. Also search for deceased relatives, maiden names, and previous addresses.
            </p>
          </div>
        </div>
      </div>

      {/* Search and filters */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by state name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
        <select
          value={dormancyFilter}
          onChange={(e) => setDormancyFilter(e.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">All dormancy periods</option>
          <option value="3 years">3-year dormancy</option>
          <option value="5 years">5-year dormancy</option>
        </select>
      </div>

      {/* Results count */}
      <p className="mb-4 text-sm text-gray-500">
        Showing {filtered.length} of 50 state programs
      </p>

      {/* State cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((state) => (
          <StateCard key={state.code} state={state} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-300 p-12 text-center">
          <Building2 className="mx-auto mb-3 h-8 w-8 text-gray-300" />
          <p className="text-sm text-gray-500">No states match your search.</p>
        </div>
      )}

      {/* How it works */}
      <div className="mt-12 rounded-xl bg-gray-50 border border-gray-200 p-8">
        <h2 className="mb-6 text-xl font-bold text-gray-900 text-center">How Unclaimed Property Works</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: <Building2 className="h-6 w-6" />, title: 'Company Reports', desc: 'Banks, insurers, and businesses report dormant accounts to the state after a set period of inactivity.' },
            { icon: <MapPin className="h-6 w-6" />, title: 'State Holds Funds', desc: 'The state treasurer or comptroller holds the funds as custodian until the rightful owner is found.' },
            { icon: <Search className="h-6 w-6" />, title: 'You Search', desc: 'Search your name on each state\'s portal where you\'ve lived, worked, or done business.' },
            { icon: <DollarSign className="h-6 w-6" />, title: 'Claim for Free', desc: 'File a claim with the state. It\'s always free — never pay a "finder" to claim your own property.' },
          ].map((step, i) => (
            <div key={i} className="text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                {step.icon}
              </div>
              <h3 className="font-semibold text-gray-900">{step.title}</h3>
              <p className="mt-1 text-sm text-gray-500">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="mt-8 rounded-xl bg-amber-50 border border-amber-200 p-4 text-center">
        <p className="text-sm text-amber-700">
          <strong>Important:</strong> Searching for and claiming unclaimed property is always free through official state programs.
          Never pay a fee to search for unclaimed property. Be cautious of third-party services that charge fees.
        </p>
      </div>
    </div>
  );
}

function StateCard({ state }: { state: StateUnclaimedProgram }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow transition-shadow">
      <div className="p-5">
        <div className="mb-3 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-xs font-bold text-blue-700">
                {state.code}
              </span>
              <h3 className="font-semibold text-gray-900">{state.name}</h3>
            </div>
            <p className="mt-1 text-xs text-gray-500 line-clamp-1">{state.agency}</p>
          </div>
        </div>

        <p className="mb-3 text-sm text-gray-600 line-clamp-2">{state.description}</p>

        <div className="mb-3 flex flex-wrap gap-1.5">
          {state.propertyTypes.slice(0, 4).map((type) => (
            <span key={type} className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${getTypeColor(type)}`}>
              {type}
            </span>
          ))}
          {state.propertyTypes.length > 4 && (
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500">
              +{state.propertyTypes.length - 4} more
            </span>
          )}
        </div>

        <div className="mb-4 grid grid-cols-2 gap-2 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{state.dormancyPeriod} dormancy</span>
          </div>
          <div className="flex items-center gap-1">
            <Phone className="h-3 w-3" />
            <span>{state.phone}</span>
          </div>
        </div>

        <div className="flex gap-2">
          <a
            href={state.searchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-700 transition-colors"
          >
            <Search className="h-3.5 w-3.5" />
            Search Now
          </a>
          <Link
            href={`/unclaimed/${state.code.toLowerCase()}`}
            className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Details
            <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
