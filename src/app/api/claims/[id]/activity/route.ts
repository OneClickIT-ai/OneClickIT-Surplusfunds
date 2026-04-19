/**
 * @deprecated Use `/api/v1/cases/[id]/timeline` instead. Scheduled for
 * removal after the next release cycle. Still functional; responses now
 * carry RFC 8594 `Deprecation` + `Sunset` + `Link` headers.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ok, err, handleError } from '@/lib/api-utils';
import { claimActivitySchema } from '@/lib/validators';

export const dynamic = 'force-dynamic';

function withDeprecation(response: NextResponse, id: string): NextResponse {
  response.headers.set('Deprecation', 'true');
  response.headers.set('Sunset', 'Wed, 30 Apr 2026 00:00:00 GMT');
  response.headers.set(
    'Link',
    `</api/v1/cases/${id}/timeline>; rel="successor-version"`,
  );
  return response;
}

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

    return withDeprecation(ok(activity, 201), id);
  } catch (error) {
    return handleError(error);
  }
}
