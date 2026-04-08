import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ok, err, handleError } from '@/lib/api-utils';
import { claimCreateSchema } from '@/lib/validators';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return err('Unauthorized', 401);

    const { searchParams } = request.nextUrl;
    const status = searchParams.get('status');
    const state = searchParams.get('state');

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (state) where.state = state;

    const claims = await prisma.claim.findMany({
      where,
      include: { activities: { orderBy: { createdAt: 'desc' }, take: 3 } },
      orderBy: { updatedAt: 'desc' },
    });

    return ok(claims);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return err('Unauthorized', 401);

    const body = await request.json();
    const data = claimCreateSchema.parse(body);

    const claim = await prisma.claim.create({
      data: {
        countyName: data.countyName,
        state: data.state,
        ownerName: data.ownerName,
        propertyAddr: data.propertyAddr || null,
        parcelId: data.parcelId || null,
        amount: data.amount ? parseFloat(String(data.amount)) : null,
        deadlineDate: data.deadlineDate ? new Date(data.deadlineDate) : null,
        notes: data.notes || null,
        priority: data.priority,
        activities: {
          create: {
            type: 'note',
            message: 'Claim created',
          },
        },
      },
      include: { activities: true },
    });

    return ok(claim, 201);
  } catch (error) {
    return handleError(error);
  }
}
