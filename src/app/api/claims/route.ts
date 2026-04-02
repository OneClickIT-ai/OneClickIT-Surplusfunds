import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ok, err, handleError } from '@/lib/api-utils';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return err('Sign in to view your claims', 401);

    const { searchParams } = request.nextUrl;
    const status = searchParams.get('status');
    const state = searchParams.get('state');

    const where: Record<string, unknown> = { userId: session.user.id };
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
    if (!session) return err('Sign in to create claims', 401);

    const body = await request.json();
    const { countyName, state, ownerName, propertyAddr, parcelId, amount, deadlineDate, notes, priority } = body;

    if (!countyName || !state || !ownerName) {
      return err('County name, state, and owner name are required');
    }

    const claim = await prisma.claim.create({
      data: {
        userId: session.user.id,
        countyName,
        state,
        ownerName,
        propertyAddr: propertyAddr || null,
        parcelId: parcelId || null,
        amount: amount ? parseFloat(amount) : null,
        deadlineDate: deadlineDate ? new Date(deadlineDate) : null,
        notes: notes || null,
        priority: priority || 'medium',
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
