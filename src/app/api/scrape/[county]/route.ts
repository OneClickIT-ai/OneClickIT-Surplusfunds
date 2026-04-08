import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { scrapeCounty } from '@/lib/scraper';
import { ok, err, handleError } from '@/lib/api-utils';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(_req: NextRequest, { params }: { params: { county: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return err('Unauthorized', 401);

    // Rate limit: 5 scrapes per minute per user
    if (!rateLimit(`scrape:${session.user.id}`, { limit: 5, windowMs: 60_000 })) {
      return err('Too many requests. Please try again later.', 429);
    }

    const county = await prisma.county.findUnique({ where: { id: params.county } });
    if (!county) return err('County not found', 404);
    if (!county.listUrl) return err('No list URL configured for this county', 400);

    // Create a pending record first
    const fundsList = await prisma.fundsList.create({
      data: { countyId: county.id, status: 'pending' },
    });

    // Scrape (async, but we await here for simplicity in serverless)
    const result = await scrapeCounty(county.listUrl);

    // Update with results
    const updated = await prisma.fundsList.update({
      where: { id: fundsList.id },
      data: {
        status: result.success ? 'success' : 'error',
        fundsData: result.funds as unknown as object,
        errorMsg: result.error || null,
      },
    });

    // Update county lastScraped
    await prisma.county.update({
      where: { id: county.id },
      data: { lastScraped: new Date() },
    });

    return ok({ count: result.funds.length, fundsListId: updated.id });
  } catch (e) {
    return handleError(e);
  }
}
