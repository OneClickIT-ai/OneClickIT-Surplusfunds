import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Building2, Upload, RefreshCw, List } from 'lucide-react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';

export default async function AdminPage() {
  let session = null;
  try { session = await getServerSession(authOptions); } catch { /* auth unavailable */ }
  if (!session || session.user.role !== 'admin') redirect('/');

  let totalCounties = 0;
  let totalFunds = 0;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let recentScrapes: any[] = [];
  try {
    [totalCounties, totalFunds, recentScrapes] = await Promise.all([
      prisma.county.count(),
      prisma.fundsList.count(),
      prisma.fundsList.findMany({
        orderBy: { scrapeDate: 'desc' },
        take: 10,
        include: { county: { select: { name: true, state: true } } },
      }),
    ]);
  } catch { /* db unavailable */ }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
        <p className="text-sm text-gray-500">Manage counties, scrapes, and data uploads</p>
      </div>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card padding="sm">
          <div className="text-2xl font-bold text-blue-600">{totalCounties}</div>
          <div className="text-sm text-gray-500">Counties</div>
        </Card>
        <Card padding="sm">
          <div className="text-2xl font-bold text-green-600">{totalFunds}</div>
          <div className="text-sm text-gray-500">Scrape runs</div>
        </Card>
      </div>

      {/* Actions */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/admin/counties">
          <Card className="cursor-pointer hover:border-blue-200 hover:shadow-md transition-all text-center">
            <List className="mx-auto mb-2 h-6 w-6 text-blue-600" />
            <div className="font-medium">Manage Counties</div>
            <div className="text-sm text-gray-500">Edit, add, remove counties</div>
          </Card>
        </Link>
        <Link href="/admin/upload">
          <Card className="cursor-pointer hover:border-blue-200 hover:shadow-md transition-all text-center">
            <Upload className="mx-auto mb-2 h-6 w-6 text-blue-600" />
            <div className="font-medium">Upload CSV</div>
            <div className="text-sm text-gray-500">Bulk import counties</div>
          </Card>
        </Link>
        <Link href="/admin/scrape">
          <Card className="cursor-pointer hover:border-blue-200 hover:shadow-md transition-all text-center">
            <RefreshCw className="mx-auto mb-2 h-6 w-6 text-blue-600" />
            <div className="font-medium">Scrape Manager</div>
            <div className="text-sm text-gray-500">Run and monitor scrapes</div>
          </Card>
        </Link>
        <Link href="/directory">
          <Card className="cursor-pointer hover:border-blue-200 hover:shadow-md transition-all text-center">
            <Building2 className="mx-auto mb-2 h-6 w-6 text-blue-600" />
            <div className="font-medium">Public Directory</div>
            <div className="text-sm text-gray-500">View public-facing site</div>
          </Card>
        </Link>
      </div>

      {/* Recent scrape activity */}
      <Card padding="none">
        <div className="border-b border-gray-100 px-6 py-4">
          <h2 className="font-semibold text-gray-900">Recent Scrape Activity</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {recentScrapes.map(s => (
            <div key={s.id} className="flex items-center justify-between px-6 py-3 text-sm">
              <span className="font-medium">{s.county.name}, {s.county.state}</span>
              <div className="flex items-center gap-3">
                <span className="text-gray-400 text-xs">
                  {new Date(s.scrapeDate).toLocaleDateString()}
                </span>
                <Badge variant={s.status === 'success' ? 'success' : s.status === 'error' ? 'error' : 'default'}>
                  {s.status}
                </Badge>
              </div>
            </div>
          ))}
          {recentScrapes.length === 0 && (
            <div className="px-6 py-8 text-center text-sm text-gray-400">
              No scrape activity yet
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
