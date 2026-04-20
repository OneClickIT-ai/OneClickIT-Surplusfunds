import { NextRequest } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ok, err, handleError } from '@/lib/api-utils';
import { searchSchema, countySchema } from '@/lib/validators';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const params = searchSchema.parse({
      q: searchParams.get('q'),
      state: searchParams.get('state'),
      minPop: searchParams.get('minPop'),
      maxPop: searchParams.get('maxPop'),
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
    });

    const where: Record<string, unknown> = {};
    if (params.q) {
      where.OR = [
        { name: { contains: params.q, mode: 'insensitive' } },
        { state: { contains: params.q, mode: 'insensitive' } },
      ];
    }
    if (params.state) where.state = params.state;
    if (params.minPop !== undefined || params.maxPop !== undefined) {
      where.population = {
        ...(params.minPop !== undefined ? { gte: params.minPop } : {}),
        ...(params.maxPop !== undefined ? { lte: params.maxPop } : {}),
      };
    }

    const skip = (params.page - 1) * params.limit;
    const [counties, total] = await Promise.all([
      prisma.county.findMany({ where, orderBy: { rank: 'asc' }, take: params.limit, skip }),
      prisma.county.count({ where }),
    ]);

    return ok({ counties, total, page: params.page, limit: params.limit });
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'admin') return err('Forbidden', 403);

    const body = await request.json();
    const data = countySchema.parse(body);

    const county = await prisma.county.create({
      data: {
        rank: data.rank,
        name: data.name,
        state: data.state,
        population: data.population,
        listUrl: data.listUrl,
        source: data.source,
        notes: data.notes,
        rulesText: data.rulesText,
        claimDeadline: data.claimDeadline,
      },
    });

    return ok(county, 201);
  } catch (e) {
    return handleError(e);
  }
}
