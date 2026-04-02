import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ok, err, handleError } from '@/lib/api-utils';

export const dynamic = 'force-dynamic';

async function ownsClaim(claimId: string, userId: string) {
  const claim = await prisma.claim.findUnique({ where: { id: claimId } });
  if (!claim) return { claim: null, error: err('Claim not found', 404) };
  if (claim.userId && claim.userId !== userId) return { claim: null, error: err('Not authorized', 403) };
  return { claim, error: null };
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return err('Sign in to view claims', 401);

    const { id } = await params;
    const { claim, error } = await ownsClaim(id, session.user.id);
    if (error) return error;

    const full = await prisma.claim.findUnique({
      where: { id },
      include: { activities: { orderBy: { createdAt: 'desc' } } },
    });

    return ok(full ?? claim);
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return err('Sign in to update claims', 401);

    const { id } = await params;
    const { claim: existing, error: authErr } = await ownsClaim(id, session.user.id);
    if (authErr) return authErr;

    const body = await request.json();
    const { status, notes, priority, amount, filedDate, paidDate, paidAmount, deadlineDate } = body;

    const data: Record<string, unknown> = {};
    if (status !== undefined) data.status = status;
    if (notes !== undefined) data.notes = notes;
    if (priority !== undefined) data.priority = priority;
    if (amount !== undefined) data.amount = amount ? parseFloat(amount) : null;
    if (filedDate !== undefined) data.filedDate = filedDate ? new Date(filedDate) : null;
    if (paidDate !== undefined) data.paidDate = paidDate ? new Date(paidDate) : null;
    if (paidAmount !== undefined) data.paidAmount = paidAmount ? parseFloat(paidAmount) : null;
    if (deadlineDate !== undefined) data.deadlineDate = deadlineDate ? new Date(deadlineDate) : null;

    if (status && existing && status !== existing.status) {
      await prisma.claimActivity.create({
        data: {
          claimId: id,
          type: 'status_change',
          message: `Status changed from "${existing.status}" to "${status}"`,
        },
      });
    }

    const claim = await prisma.claim.update({
      where: { id },
      data,
      include: { activities: { orderBy: { createdAt: 'desc' } } },
    });

    return ok(claim);
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return err('Sign in to delete claims', 401);

    const { id } = await params;
    const { error: authErr } = await ownsClaim(id, session.user.id);
    if (authErr) return authErr;

    await prisma.claim.delete({ where: { id } });
    return ok({ deleted: true });
  } catch (error) {
    return handleError(error);
  }
}
