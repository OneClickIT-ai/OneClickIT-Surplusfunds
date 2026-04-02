export const dynamic = 'force-dynamic';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Bell, Bookmark, MapPin, Search, Download, Shield, CreditCard, ArrowRight, Wrench, Globe, FileText, Calculator, ClipboardList, FileDown } from 'lucide-react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  const stats = await prisma.county.count();

  // Authenticated dashboard
  if (session) {
    const alerts = await prisma.alert.findMany({
      where: { userId: session.user.id, active: true },
      include: { county: true },
      orderBy: { createdAt: 'desc' },
    });

    const isPro = session.user.role === 'pro' || session.user.role === 'admin';
    const firstName = session.user.name?.split(' ')[0] || session.user.email?.split('@')[0] || 'there';

    return (
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Welcome back, {firstName}</h1>
          <p className="text-sm text-gray-500">
            {isPro ? (
              <span className="inline-flex items-center gap-1">
                <Badge variant="success">Pro</Badge> Full access to all features
              </span>
            ) : (
              <span>Free plan &mdash; <Link href="/pricing" className="text-blue-600 hover:underline">upgrade to Pro</Link> for CSV exports</span>
            )}
          </p>
        </div>

        {/* Quick start */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <Link
            href="/directory"
            className="group flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:border-blue-300 hover:shadow-md transition-all"
          >
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600 group-hover:bg-blue-200">
              <Search className="h-5 w-5" />
            </div>
            <div>
              <div className="font-medium text-gray-900">Browse Directory</div>
              <div className="text-xs text-gray-500">{stats} counties available</div>
            </div>
            <ArrowRight className="ml-auto h-4 w-4 text-gray-300 group-hover:text-blue-500" />
          </Link>

          <Link
            href="/osint"
            className="group flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:border-purple-300 hover:shadow-md transition-all"
          >
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-purple-100 text-purple-600 group-hover:bg-purple-200">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <div className="font-medium text-gray-900">OSINT Tools</div>
              <div className="text-xs text-gray-500">People &amp; address search</div>
            </div>
            <ArrowRight className="ml-auto h-4 w-4 text-gray-300 group-hover:text-purple-500" />
          </Link>

          <Link
            href={isPro ? '/export' : '/pricing'}
            className="group flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:border-green-300 hover:shadow-md transition-all"
          >
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-green-100 text-green-600 group-hover:bg-green-200">
              <Download className="h-5 w-5" />
            </div>
            <div>
              <div className="font-medium text-gray-900">Export Data</div>
              <div className="text-xs text-gray-500">{isPro ? 'Download CSV files' : 'Pro feature'}</div>
            </div>
            <ArrowRight className="ml-auto h-4 w-4 text-gray-300 group-hover:text-green-500" />
          </Link>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          {/* Alerts */}
          <Card>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <Bell className="h-4 w-4 text-blue-600" /> Active Alerts
              </h2>
              <Badge variant="info">{alerts.length}</Badge>
            </div>
            {alerts.length > 0 ? (
              <ul className="space-y-3">
                {alerts.map(alert => (
                  <li key={alert.id} className="flex items-center justify-between text-sm">
                    <Link href={`/county/${alert.countyId}`} className="text-blue-600 hover:underline">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {alert.county.name}, {alert.county.state}
                      </span>
                    </Link>
                    {alert.minAmount && (
                      <span className="text-xs text-gray-400">&gt;${alert.minAmount.toLocaleString()}</span>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-400">
                No alerts yet.{' '}
                <Link href="/directory" className="text-blue-600 hover:underline">Browse counties</Link>{' '}
                to subscribe to updates.
              </p>
            )}
          </Card>

          {/* Quick actions */}
          <Card>
            <h2 className="mb-4 font-semibold text-gray-900 flex items-center gap-2">
              <Bookmark className="h-4 w-4 text-blue-600" /> Quick Actions
            </h2>
            <div className="space-y-1">
              <Link href="/directory" className="flex items-center gap-2 rounded-lg p-2.5 text-sm text-gray-700 hover:bg-gray-50">
                <MapPin className="h-4 w-4 text-gray-400" /> Browse all counties
              </Link>
              <Link href="/lookup" className="flex items-center gap-2 rounded-lg p-2.5 text-sm text-gray-700 hover:bg-gray-50">
                <Globe className="h-4 w-4 text-gray-400" /> Third-Party Lookup (150+ tools)
              </Link>
              <Link href="/unclaimed" className="flex items-center gap-2 rounded-lg p-2.5 text-sm text-gray-700 hover:bg-gray-50">
                <FileText className="h-4 w-4 text-gray-400" /> Unclaimed Property by State
              </Link>
              <Link href="/claims" className="flex items-center gap-2 rounded-lg p-2.5 text-sm text-gray-700 hover:bg-gray-50">
                <ClipboardList className="h-4 w-4 text-gray-400" /> Claims Tracker
              </Link>
              <Link href="/templates" className="flex items-center gap-2 rounded-lg p-2.5 text-sm text-gray-700 hover:bg-gray-50">
                <FileDown className="h-4 w-4 text-gray-400" /> Claim Templates
              </Link>
              <Link href="/calculator" className="flex items-center gap-2 rounded-lg p-2.5 text-sm text-gray-700 hover:bg-gray-50">
                <Calculator className="h-4 w-4 text-gray-400" /> Calculator
              </Link>
              <Link href="/tools" className="flex items-center gap-2 rounded-lg p-2.5 text-sm text-gray-700 hover:bg-gray-50">
                <Wrench className="h-4 w-4 text-gray-400" /> All Tools
              </Link>
              {!isPro && (
                <Link href="/pricing" className="flex items-center gap-2 rounded-lg p-2.5 text-sm text-green-600 hover:bg-green-50 font-medium">
                  <CreditCard className="h-4 w-4" /> Upgrade to Pro
                </Link>
              )}
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Public dashboard (not signed in)
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500">
          Your hub for surplus funds research tools.{' '}
          <Link href="/auth/signin" className="text-blue-600 hover:underline">Sign in</Link> for personalized alerts and saved searches.
        </p>
      </div>

      {/* Tool cards for public users */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/directory"
          className="group flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:border-blue-300 hover:shadow-md transition-all"
        >
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600 group-hover:bg-blue-200">
            <Search className="h-5 w-5" />
          </div>
          <div>
            <div className="font-medium text-gray-900">County Directory</div>
            <div className="text-xs text-gray-500">{stats} counties available</div>
          </div>
          <ArrowRight className="ml-auto h-4 w-4 text-gray-300 group-hover:text-blue-500" />
        </Link>

        <Link
          href="/osint"
          className="group flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:border-purple-300 hover:shadow-md transition-all"
        >
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-purple-100 text-purple-600 group-hover:bg-purple-200">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <div className="font-medium text-gray-900">OSINT Tools</div>
            <div className="text-xs text-gray-500">People, phone, email, address</div>
          </div>
          <ArrowRight className="ml-auto h-4 w-4 text-gray-300 group-hover:text-purple-500" />
        </Link>

        <Link
          href="/lookup"
          className="group flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:border-orange-300 hover:shadow-md transition-all"
        >
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-orange-100 text-orange-600 group-hover:bg-orange-200">
            <Globe className="h-5 w-5" />
          </div>
          <div>
            <div className="font-medium text-gray-900">Third-Party Lookup</div>
            <div className="text-xs text-gray-500">150+ search tools</div>
          </div>
          <ArrowRight className="ml-auto h-4 w-4 text-gray-300 group-hover:text-orange-500" />
        </Link>

        <Link
          href="/unclaimed"
          className="group flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:border-teal-300 hover:shadow-md transition-all"
        >
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-teal-100 text-teal-600 group-hover:bg-teal-200">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <div className="font-medium text-gray-900">Unclaimed Property</div>
            <div className="text-xs text-gray-500">All 50 states</div>
          </div>
          <ArrowRight className="ml-auto h-4 w-4 text-gray-300 group-hover:text-teal-500" />
        </Link>

        <Link
          href="/dorks"
          className="group flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:border-green-300 hover:shadow-md transition-all"
        >
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-green-100 text-green-600 group-hover:bg-green-200">
            <Search className="h-5 w-5" />
          </div>
          <div>
            <div className="font-medium text-gray-900">Google Dorks</div>
            <div className="text-xs text-gray-500">Advanced search queries</div>
          </div>
          <ArrowRight className="ml-auto h-4 w-4 text-gray-300 group-hover:text-green-500" />
        </Link>

        <Link
          href="/tools"
          className="group flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:border-gray-400 hover:shadow-md transition-all"
        >
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-600 group-hover:bg-gray-200">
            <Wrench className="h-5 w-5" />
          </div>
          <div>
            <div className="font-medium text-gray-900">All Tools</div>
            <div className="text-xs text-gray-500">Full toolkit overview</div>
          </div>
          <ArrowRight className="ml-auto h-4 w-4 text-gray-300 group-hover:text-gray-500" />
        </Link>
      </div>

      {/* Sign-in CTA */}
      <div className="rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-center text-white">
        <h2 className="mb-2 text-lg font-bold">Get More from Your Research</h2>
        <p className="mb-4 text-sm text-blue-100">
          Sign in to set up county alerts, save searches, and track your claims.
        </p>
        <Link
          href="/auth/signin"
          className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-blue-700 shadow-md hover:bg-blue-50 transition-colors"
        >
          Sign in Free <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
