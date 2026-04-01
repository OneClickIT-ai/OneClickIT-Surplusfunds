import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ok, err, handleError } from '@/lib/api-utils';

export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const claim = await prisma.claim.findUnique({
      where: { id },
      include: { activities: { orderBy: { createdAt: 'desc' } } },
    });

    if (!claim) return err('Claim not found', 404);
    return ok(claim);
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, notes, priority, amount, filedDate, paidDate, paidAmount, deadlineDate } = body;

    const existing = await prisma.claim.findUnique({ where: { id } });
    if (!existing) return err('Claim not found', 404);

    const data: Record<string, unknown> = {};
    if (status !== undefined) data.status = status;
    if (notes !== undefined) data.notes = notes;
    if (priority !== undefined) data.priority = priority;
    if (amount !== undefined) data.amount = amount ? parseFloat(amount) : null;
    if (filedDate !== undefined) data.filedDate = filedDate ? new Date(filedDate) : null;
    if (paidDate !== undefined) data.paidDate = paidDate ? new Date(paidDate) : null;
    if (paidAmount !== undefined) data.paidAmount = paidAmount ? parseFloat(paidAmount) : null;
    if (deadlineDate !== undefined) data.deadlineDate = deadlineDate ? new Date(deadlineDate) : null;

    // Log status change as activity
    if (status && status !== existing.status) {
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
    const { id } = await params;
    await prisma.claim.delete({ where: { id } });
    return ok({ deleted: true });
  } catch (error) {
    return handleError(error);
  }
}
