import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Papa from 'papaparse';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (session.user.role !== 'pro' && session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Pro subscription required' }, { status: 403 });
  }

  const { searchParams } = request.nextUrl;
  const state = searchParams.get('state');
  const maxPop = searchParams.get('maxPop');
  const type = searchParams.get('type') || 'counties'; // counties or funds

  if (type === 'funds') {
    // Export funds data with county info
    const fundsLists = await prisma.fundsList.findMany({
      where: { status: 'success' },
      include: { county: true },
      orderBy: { scrapeDate: 'desc' },
    });

    const rows = fundsLists.flatMap(list => {
      const funds = (list.fundsData as Array<{ property?: string; amount?: string; claimant?: string; date?: string }>) || [];
      return funds.map(fund => ({
        county: list.county.name,
        state: list.county.state,
        population: list.county.population,
        property: fund.property || '',
        amount: fund.amount || '',
        claimant: fund.claimant || '',
        date: fund.date || '',
        scraped_at: list.scrapeDate.toISOString().split('T')[0],
        source: list.county.source || '',
        claim_deadline: list.county.claimDeadline || '',
      }));
    });

    const csv = Papa.unparse(rows);
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename=surplusfunds_data_${new Date().toISOString().split('T')[0]}.csv`,
      },
    });
  }

  // Default: export counties directory
  const where: Record<string, unknown> = {};
  if (state) where.state = state;
  if (maxPop) where.population = { lte: parseInt(maxPop) };

  const counties = await prisma.county.findMany({
    where,
    orderBy: { rank: 'asc' },
  });

  const rows = counties.map(c => ({
    rank: c.rank,
    county: c.name,
    state: c.state,
    population: c.population,
    list_url: c.listUrl || '',
    source: c.source || '',
    notes: c.notes || '',
    claim_rules: c.rulesText || '',
    claim_deadline: c.claimDeadline || '',
    last_scraped: c.lastScraped ? c.lastScraped.toISOString().split('T')[0] : '',
  }));

  const csv = Papa.unparse(rows);
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename=surplusfunds_counties_${new Date().toISOString().split('T')[0]}.csv`,
    },
  });
}
