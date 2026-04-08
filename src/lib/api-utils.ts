import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status });
}

export function err(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function handleError(error: unknown) {
  if (error instanceof ZodError) {
    return err(error.errors.map(e => e.message).join(', '), 400);
  }
  console.error(error);
  return err('Internal server error', 500);
}

export function requireCronSecret(request: Request) {
  const cronSecret = request.headers.get('authorization')?.replace('Bearer ', '');
  return !!cronSecret && cronSecret === process.env.CRON_SECRET;
}
