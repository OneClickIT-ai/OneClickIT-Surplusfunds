import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ok, err, handleError } from '@/lib/api-utils';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { type, message } = body;

    if (!message) return err('Message is required');

    const claim = await prisma.claim.findUnique({ where: { id } });
    if (!claim) return err('Claim not found', 404);

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
