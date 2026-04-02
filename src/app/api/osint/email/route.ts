import { NextRequest } from 'next/server';
import { ok, handleError } from '@/lib/api-utils';
import { verifyEmail } from '@/lib/osint';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  const limited = rateLimit(request);
  if (limited) return limited;
  try {
    const { query } = await request.json();
    if (!query) return ok({ results: [], source: 'No query' });

    const result = await verifyEmail(query);
    return ok({ query, tool: 'email', ...result });
  } catch (e) {
    return handleError(e);
  }
}
