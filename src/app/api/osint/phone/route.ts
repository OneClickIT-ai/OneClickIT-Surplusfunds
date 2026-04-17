import { NextRequest } from 'next/server';
import { ok, handleError } from '@/lib/api-utils';
import { requirePro, lookupPhone } from '@/lib/osint';

export async function POST(request: NextRequest) {
  try {
    const authError = await requirePro();
    if (authError) return authError;

    const { query } = await request.json();
    if (!query) return ok({ results: [], source: 'No query' });

    const result = await lookupPhone(query);
    return ok({ query, tool: 'phone', ...result });
  } catch (e) {
    return handleError(e);
  }
}
