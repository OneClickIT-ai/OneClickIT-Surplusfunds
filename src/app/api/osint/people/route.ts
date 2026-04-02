import { NextRequest } from 'next/server';
import { ok, handleError } from '@/lib/api-utils';
import { searchPeople } from '@/lib/osint';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  const limited = rateLimit(request);
  if (limited) return limited;
  try {
    const { query } = await request.json();
    if (!query) return ok({ results: [], source: 'No query' });

    const result = await searchPeople(query);
    return ok({ query, tool: 'people', ...result });
  } catch (e) {
    return handleError(e);
  }
}
