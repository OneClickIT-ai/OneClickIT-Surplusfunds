import Link from 'next/link';
import Image from 'next/image';

type Props = {
  searchParams: Promise<{ url?: string }>;
};

/**
 * Parses the raw callback URL, validates it targets the NextAuth email
 * callback with the required params, then appends ?_v=1 so middleware
 * lets the request through without another redirect.
 *
 * Returns null for anything that doesn’t look like a legitimate NextAuth
 * email-callback URL, preventing open-redirect phishing.
 */
function buildSignInUrl(rawUrl: string): string | null {
  if (!rawUrl) return null;
  try {
    const parsed = new URL(rawUrl);
    if (
      parsed.pathname !== '/api/auth/callback/email' ||
      !parsed.searchParams.get('token') ||
      !parsed.searchParams.get('email')
    ) {
      return null;
    }
    parsed.searchParams.set('_v', '1');
    return parsed.toString();
  } catch {
    return null;
  }
}

export default async function VerifyPage({ searchParams }: Props) {
  const { url: rawUrl = '' } = await searchParams;
  const signInUrl = buildSignInUrl(rawUrl);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <div className="mb-6 flex justify-center">
          <Image
            src="/surplusfunds_favicon.png"
            alt="SurplusClickIT"
            width={48}
            height={48}
            className="h-12 w-12"
          />
        </div>

        {signInUrl ? (
          <>
            <h1 className="text-2xl font-bold text-gray-900">One tap to sign in</h1>
            <p className="mt-2 text-sm text-gray-500">
              Confirm your identity to access your surplus funds dashboard.
            </p>
            <div className="mt-8">
              <a
                href={signInUrl}
                className="inline-flex w-full items-center justify-center rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Sign in to SurplusClickIT
              </a>
            </div>
            <p className="mt-4 text-xs text-gray-400">
              This link expires in 24 hours.{' '}
              <Link href="/auth/signin" className="underline hover:text-gray-600">
                Send a new link
              </Link>
            </p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-gray-900">Link expired or invalid</h1>
            <p className="mt-2 text-sm text-gray-500">
              This sign-in link has already been used, expired, or is invalid.
              Request a new one below.
            </p>
            <div className="mt-8">
              <Link
                href="/auth/signin"
                className="inline-flex w-full items-center justify-center rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
              >
                Send a new magic link
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
