/**
 * @deprecated Use `/api/v1/cases/[id]` instead. This legacy endpoint is
 * scheduled for removal after the next release cycle. It still works so
 * existing clients aren't broken mid-migration, but every response now
 * carries RFC 8594 `Deprecation` + `Sunset` headers and a `Link` header
 * pointing at the replacement.
 *
 * Tracking issue: https://github.com/ritacsolutionsllc/OneClickIT-Surplusfunds/issues (open one)
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ok, err, handleError } from '@/lib/api-utils';
import { claimUpdateSchema } from '@/lib/validators';

export const dynamic = 'force-dynamic';

function withDeprecation(response: NextResponse, id: string): NextResponse {
  response.headers.set('Deprecation', 'true');
  response.headers.set('Sunset', 'Wed, 30 Apr 2026 00:00:00 GMT');
  response.headers.set(
    'Link',
    `</api/v1/cases/${id}>; rel="successor-version"`,
  );
  return response;
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return err('Unauthorized', 401);

    const { id } = await params;
    const claim = await prisma.claim.findUnique({
      where: { id },
      include: { activities: { orderBy: { createdAt: 'desc' } } },
    });

    if (!claim) return err('Claim not found', 404);
    if (claim.userId && claim.userId !== session.user.id && session.user.role !== 'admin') {
      return err('Forbidden', 403);
    }
    return withDeprecation(ok(claim), id);
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return err('Unauthorized', 401);

    const { id } = await params;
    const body = await request.json();
    const validated = claimUpdateSchema.parse(body);

    const existing = await prisma.claim.findUnique({ where: { id } });
    if (!existing) return err('Claim not found', 404);
    if (existing.userId && existing.userId !== session.user.id && session.user.role !== 'admin') {
      return err('Forbidden', 403);
    }

    const data: Record<string, unknown> = {};
    if (validated.status !== undefined) data.status = validated.status;
    if (validated.notes !== undefined) data.notes = validated.notes;
    if (validated.priority !== undefined) data.priority = validated.priority;
    if (validated.amount !== undefined) data.amount = validated.amount ? parseFloat(String(validated.amount)) : null;
    if (validated.filedDate !== undefined) data.filedDate = validated.filedDate ? new Date(validated.filedDate) : null;
    if (validated.paidDate !== undefined) data.paidDate = validated.paidDate ? new Date(validated.paidDate) : null;
    if (validated.paidAmount !== undefined) data.paidAmount = validated.paidAmount ? parseFloat(String(validated.paidAmount)) : null;
    if (validated.deadlineDate !== undefined) data.deadlineDate = validated.deadlineDate ? new Date(validated.deadlineDate) : null;

    // Log status change as activity
    if (validated.status && validated.status !== existing.status) {
      await prisma.claimActivity.create({
        data: {
          claimId: id,
          type: 'status_change',
          message: `Status changed from "${existing.status}" to "${validated.status}"`,
        },
      });
    }

    const claim = await prisma.claim.update({
      where: { id },
      data,
      include: { activities: { orderBy: { createdAt: 'desc' } } },
    });

    return withDeprecation(ok(claim), id);
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return err('Unauthorized', 401);

    const { id } = await params;
    const claim = await prisma.claim.findUnique({ where: { id } });
    if (!claim) return err('Claim not found', 404);
    if (claim.userId && claim.userId !== session.user.id && session.user.role !== 'admin') {
      return err('Forbidden', 403);
    }
    await prisma.claim.delete({ where: { id } });
    return withDeprecation(ok({ deleted: true }), id);
  } catch (error) {
    return handleError(error);
  }
}
