import { NextResponse } from 'next/server';
import { authDiagnostics } from '@/lib/auth';

// GET /api/auth/diagnostics
// Returns a boolean-only snapshot of auth config (no secret values) so an
// operator can see at a glance what's wired. Safe in production because it
// never exposes values — only "is this env var present?".
export async function GET() {
  return NextResponse.json({
    ...authDiagnostics,
    env: process.env.NODE_ENV,
    nextauthUrl: process.env.NEXTAUTH_URL ?? null,
  });
}
