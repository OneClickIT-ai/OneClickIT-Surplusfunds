import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authDiagnostics, authOptions } from '@/lib/auth';

// GET /api/auth/diagnostics
// Boolean-only snapshot of auth config (never exposes values, only presence)
// so an operator can see at a glance what's wired. Admin-gated so an
// unauthenticated attacker can't probe which env vars are missing.
export async function GET() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'admin') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }
  return NextResponse.json({
    ...authDiagnostics,
    env: process.env.NODE_ENV,
  });
}
