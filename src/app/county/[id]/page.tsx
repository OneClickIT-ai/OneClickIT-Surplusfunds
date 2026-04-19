import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, Clock, Users } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import FundsTable from '@/components/county/FundsTable';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import ScrapeButton from '@/components/county/ScrapeButton';
import { FundEntry } from '@/types';

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getCounty(id: string) {
  try {
    return await prisma.county.findUnique({
      where: { id },
      include: {
        fundsLists: {
          orderBy: { scrapeDate: 'desc' },
          take: 1,
        },
      },
    });
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: PageProps) {
  try {
    const { id } = await params;
    const county = await prisma.county.findUnique({ where: { id } });
    if (!county) return {};
    return {
      title: `${county.name} County, ${county.state} Surplus Funds`,
      description: `Find surplus funds and excess proceeds from ${county.name} County, ${county.state}. Access the official surplus funds list, claim rules${county.claimDeadline ? `, deadline: ${county.claimDeadline}` : ''}, and filing information.`,
      keywords: [`${county.name} County surplus funds`, `${county.state} surplus funds`, `${county.name} excess proceeds`, 'tax sale surplus', 'foreclosure surplus'],
      alternates: { canonical: `/county/${id}` },
      openGraph: {
        title: `${county.name} County, ${county.state} — Surplus Funds`,
        description: `Official surplus funds data for ${county.name} County, ${county.state}.`,
      },
    };
  } catch {
    return {};
  }
}

export default async function CountyDetailPage({ params }: PageProps) {
  const { id } = await params;
  const county = await getCounty(id);
  if (!county) notFound();

  const latestFunds = county.fundsLists[0];
  const fundsData = (latestFunds?.fundsData as unknown as FundEntry[]) || [];
  const scrapeStatus = latestFunds?.status;

  const statusVariant =
    scrapeStatus === 'success' ? 'success' :
    scrapeStatus === 'error' ? 'error' : 'default';

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <Link href="/directory" className="mb-6 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900">
        <ArrowLeft className="h-4 w-4" /> Back to directory
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {county.name} County
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-500">
              <span>{county.state}</span>
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                {county.population.toLocaleString()} residents
              </span>
              {county.lastScraped && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  Updated {new Date(county.lastScraped).toLocaleDateString()}
                </span>
              )}
              {scrapeStatus && <Badge variant={statusVariant}>{scrapeStatus}</Badge>}
            </div>
          </div>

          <ScrapeButton countyId={county.id} hasListUrl={!!county.listUrl} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Funds table - main column */}
        <div className="lg:col-span-2">
          <Card padding="none">
            <div className="border-b border-gray-100 px-6 py-4">
              <h2 className="font-semibold text-gray-900">Surplus Funds List</h2>
              {latestFunds?.errorMsg && (
                <p className="mt-1 text-xs text-red-600">{latestFunds.errorMsg}</p>
              )}
            </div>
            <div className="p-6">
              <FundsTable
                funds={fundsData}
                scrapedAt={latestFunds?.scrapeDate}
              />
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Source info */}
          <Card>
            <h3 className="mb-3 font-medium text-gray-900">Source Information</h3>
            <dl className="space-y-2 text-sm">
              {county.source && (
                <div>
                  <dt className="text-gray-500">Source</dt>
                  <dd className="text-gray-900">{county.source}</dd>
                </div>
              )}
              {county.listUrl && (
                <div>
                  <dt className="text-gray-500">List URL</dt>
                  <dd>
                    <a
                      href={county.listUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-blue-600 hover:underline break-all text-xs"
                    >
                      <ExternalLink className="h-3 w-3 flex-shrink-0" />
                      View original
                    </a>
                  </dd>
                </div>
              )}
              {county.claimDeadline && (
                <div>
                  <dt className="text-gray-500">Claim deadline</dt>
                  <dd className="text-gray-900">{county.claimDeadline}</dd>
                </div>
              )}
            </dl>
          </Card>

          {/* Rules */}
          {county.rulesText && (
            <Card>
              <h3 className="mb-3 font-medium text-gray-900">Claim Rules</h3>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{county.rulesText}</p>
            </Card>
          )}

          {/* Notes */}
          {county.notes && (
            <Card>
              <h3 className="mb-3 font-medium text-gray-900">Notes</h3>
              <p className="text-sm text-gray-600">{county.notes}</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
