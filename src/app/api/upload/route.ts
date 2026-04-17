import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ok, err, handleError } from '@/lib/api-utils';
import Papa from 'papaparse';

interface CountyRow {
  rank?: string;
  county?: string;
  name?: string;
  state?: string;
  pop?: string;
  population?: string;
  source?: string;
  notes?: string;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'admin') return err('Forbidden', 403);

    const formData = await request.formData();
    const file = formData.get('file') as File;
    if (!file) return err('No file provided', 400);

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) return err('File too large. Maximum size is 5MB.', 400);

    // Validate file type
    const name = file.name?.toLowerCase() || '';
    if (!name.endsWith('.csv')) return err('Only CSV files are accepted', 400);

    const text = await file.text();
    const { data } = Papa.parse<CountyRow>(text, { header: true, skipEmptyLines: true });

    let imported = 0;
    for (const row of data) {
      const name = row.county || row.name;
      const state = row.state;
      if (!name || !state) continue;

      await prisma.county.upsert({
        where: { name_state: { name, state } },
        update: {
          population: parseInt(row.pop || row.population || '0'),
          source: row.source || undefined,
          notes: row.notes || undefined,
        },
        create: {
          rank: parseInt(row.rank || '99'),
          name,
          state,
          population: parseInt(row.pop || row.population || '0'),
          source: row.source || null,
          notes: row.notes || null,
        },
      });
      imported++;
    }

    return ok({ imported });
  } catch (e) {
    return handleError(e);
  }
}
