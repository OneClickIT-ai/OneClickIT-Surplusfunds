import { NextRequest } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ok, err, handleError } from '@/lib/api-utils';
import { claimActivitySchema } from '@/lib/validators';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return err('Unauthorized', 401);

    const { id } = await params;
    const body = await request.json();
    const data = claimActivitySchema.parse(body);

    const claim = await prisma.claim.findUnique({ where: { id } });
    if (!claim) return err('Claim not found', 404);

    const activity = await prisma.claimActivity.create({
      data: {
        claimId: id,
        type: data.type,
        message: data.message,
      },
    });

    return ok(activity, 201);
  } catch (error) {
    return handleError(error);
  }
}
