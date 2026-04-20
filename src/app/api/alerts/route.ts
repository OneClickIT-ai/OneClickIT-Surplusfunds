import { NextRequest } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ok, err, handleError } from '@/lib/api-utils';
import { alertSchema } from '@/lib/validators';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return err('Unauthorized', 401);

    const alerts = await prisma.alert.findMany({
      where: { userId: session.user.id },
      include: { county: true },
      orderBy: { createdAt: 'desc' },
    });

    return ok(alerts);
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return err('Unauthorized', 401);

    const body = await request.json();
    const { countyId, minAmount } = alertSchema.parse(body);

    const alert = await prisma.alert.upsert({
      where: { userId_countyId: { userId: session.user.id, countyId } },
      update: { minAmount, active: true },
      create: { userId: session.user.id, countyId, minAmount },
    });

    return ok(alert, 201);
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return err('Unauthorized', 401);

    const { alertId } = await request.json();
    await prisma.alert.deleteMany({
      where: { id: alertId, userId: session.user.id },
    });

    return ok({ deleted: true });
  } catch (e) {
    return handleError(e);
  }
}
