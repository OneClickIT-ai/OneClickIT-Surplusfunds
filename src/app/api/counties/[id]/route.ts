import { NextRequest } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ok, err, handleError } from '@/lib/api-utils';
import { countySchema } from '@/lib/validators';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const county = await prisma.county.findUnique({
      where: { id },
      include: { fundsLists: { orderBy: { scrapeDate: 'desc' }, take: 5 } },
    });
    if (!county) return err('County not found', 404);
    return ok(county);
  } catch (e) {
    return handleError(e);
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'admin') return err('Forbidden', 403);

    const { id } = await params;
    const body = await request.json();
    const data = countySchema.partial().parse(body);

    const county = await prisma.county.update({
      where: { id },
      data: {
        ...(data.rank !== undefined && { rank: data.rank }),
        ...(data.name !== undefined && { name: data.name }),
        ...(data.state !== undefined && { state: data.state }),
        ...(data.population !== undefined && { population: data.population }),
        ...(data.listUrl !== undefined && { listUrl: data.listUrl }),
        ...(data.source !== undefined && { source: data.source }),
        ...(data.notes !== undefined && { notes: data.notes }),
        ...(data.rulesText !== undefined && { rulesText: data.rulesText }),
        ...(data.claimDeadline !== undefined && { claimDeadline: data.claimDeadline }),
      },
    });

    return ok(county);
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'admin') return err('Forbidden', 403);

    const { id } = await params;
    await prisma.county.delete({ where: { id } });
    return ok({ deleted: true });
  } catch (e) {
    return handleError(e);
  }
}
