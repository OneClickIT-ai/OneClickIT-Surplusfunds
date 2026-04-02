import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ok, err, handleError } from '@/lib/api-utils';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return err('Sign in to add activity', 401);

    const { id } = await params;
    const body = await request.json();
    const { type, message } = body;

    if (!message) return err('Message is required');

    const claim = await prisma.claim.findUnique({ where: { id } });
    if (!claim) return err('Claim not found', 404);
    if (claim.userId && claim.userId !== session.user.id) return err('Not authorized', 403);

    const activity = await prisma.claimActivity.create({
      data: {
        claimId: id,
        type: type || 'note',
        message,
      },
    });

    return ok(activity, 201);
  } catch (error) {
    return handleError(error);
  }
}
