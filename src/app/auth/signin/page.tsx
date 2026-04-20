import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function LegacySignInPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const cb = typeof sp.callbackUrl === 'string' ? sp.callbackUrl : undefined;
  const target = cb
    ? `/sign-in?redirect_url=${encodeURIComponent(cb)}`
    : '/sign-in';
  redirect(target);
}
