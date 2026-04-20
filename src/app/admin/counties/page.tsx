import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { ArrowLeft, Pencil, ExternalLink } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';

export const dynamic = 'force-dynamic';

export default async function AdminCountiesPage() {
  let session = null;
  try { session = await getServerSession(authOptions); } catch { /* auth unavailable */ }
  if (!session || session.user.role !== 'admin') redirect('/');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let counties: any[] = [];
  try {
    counties = await prisma.county.findMany({
      orderBy: { rank: 'asc' },
      include: { _count: { select: { fundsLists: true } } },
    });
  } catch { /* db unavailable */ }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link href="/admin" className="mb-2 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900">
            <ArrowLeft className="h-4 w-4" /> Back to admin
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Manage Counties ({counties.length})</h1>
        </div>
        <Link
          href="/admin/counties/new"
          className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
        >
          + Add County
        </Link>
      </div>

      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">#</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">County</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">State</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Pop</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">URL</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Scrapes</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Last Scraped</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {counties.map(county => (
                <tr key={county.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-400">{county.rank}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{county.name}</td>
                  <td className="px-4 py-3 text-gray-600">{county.state}</td>
                  <td className="px-4 py-3 text-gray-600">{county.population.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    {county.listUrl ? (
                      <a href={county.listUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    ) : (
                      <Badge variant="warning">None</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{county._count.fundsLists}</td>
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {county.lastScraped ? new Date(county.lastScraped).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/counties/${county.id}`}
                        className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                      >
                        <Pencil className="h-4 w-4" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
