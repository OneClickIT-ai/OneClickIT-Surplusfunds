import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ok, err } from '@/lib/api-utils';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const state = searchParams.get('state')?.toUpperCase();
  const name = searchParams.get('name');
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit')) || 50));

  const where: Record<string, unknown> = {};
  if (state) where.state = state;
  if (name) where.ownerName = { contains: name, mode: 'insensitive' };

  try {
    const [properties, total] = await Promise.all([
      prisma.unclaimedProperty.findMany({
        where,
        orderBy: { reportedAmount: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.unclaimedProperty.count({ where }),
    ]);

    return ok({
      properties,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch {
    return err('Failed to fetch unclaimed property data', 500);
  }
}
