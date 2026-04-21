import Image from 'next/image';
import Link from 'next/link';
import SignInForm from './SignInForm';
import { authDiagnostics } from '@/lib/auth';

type SearchParams = Promise<{ error?: string; callbackUrl?: string }>;

const ERROR_MESSAGES: Record<string, string> = {
  Configuration:
    'Server auth is misconfigured. Check NEXTAUTH_SECRET, NEXTAUTH_URL, and provider credentials.',
  AccessDenied: 'Access denied. Your account is not authorized for this app.',
  Verification: 'Sign-in link is invalid or has expired. Request a new one.',
  OAuthSignin: 'Could not start Google sign-in. Check GOOGLE_CLIENT_ID/SECRET.',
  OAuthCallback: 'Google returned an error during callback. Check the redirect URI.',
  OAuthCreateAccount: 'Could not create your account from Google. Check the database connection.',
  EmailCreateAccount: 'Could not create your account via email.',
  Callback: 'Sign-in callback failed. See server logs for details.',
  OAuthAccountNotLinked:
    'This email is already linked to another provider. Sign in with the original provider.',
  EmailSignin: 'Could not send the sign-in email. Check EMAIL_SERVER/EMAIL_FROM.',
  CredentialsSignin: 'Invalid dev credentials.',
  SessionRequired: 'You must be signed in to view this page.',
  Default: 'Something went wrong signing you in.',
};

export default async function SignInPage({ searchParams }: { searchParams: SearchParams }) {
  const { error, callbackUrl } = await searchParams;
  const errorMessage = error ? ERROR_MESSAGES[error] ?? ERROR_MESSAGES.Default : null;

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mb-3 flex justify-center">
            <Image src="/surplusfunds_favicon.png" alt="Surplus Funds" width={48} height={48} className="h-12 w-12" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
          <p className="text-sm text-gray-500">Sign in to your surplus funds dashboard</p>
        </div>

        {errorMessage && (
          <div
            role="alert"
            className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          >
            <strong className="font-semibold">Sign-in failed:</strong> {errorMessage}
            <div className="mt-1 font-mono text-xs text-red-500">code: {error}</div>
          </div>
        )}

        {!authDiagnostics.hasGoogleOAuth &&
          !authDiagnostics.hasEmailProvider &&
          !authDiagnostics.isDevCredentialsEnabled && (
            <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              <strong className="font-semibold">No sign-in providers are configured.</strong> Set
              <code className="mx-1">GOOGLE_CLIENT_ID</code>/<code>GOOGLE_CLIENT_SECRET</code>, or
              set <code>EMAIL_SERVER</code>/<code>EMAIL_FROM</code>, or (local only) set{' '}
              <code>AUTH_DEV_MODE=true</code> to enable dev credentials.
            </div>
          )}

        <SignInForm
          callbackUrl={callbackUrl ?? '/dashboard'}
          hasGoogle={authDiagnostics.hasGoogleOAuth}
          hasEmail={authDiagnostics.hasEmailProvider}
          hasDevCredentials={authDiagnostics.isDevCredentialsEnabled}
        />

        <p className="mt-6 text-center text-sm text-gray-500">
          Don&apos;t have an account?{' '}
          <Link href="/auth/signup" className="text-blue-600 hover:underline font-medium">
            Sign up free
          </Link>
        </p>

        <p className="mt-4 text-center text-xs text-gray-400">
          By signing in, you agree to our{' '}
          <Link href="/terms" className="underline hover:text-gray-600">Terms of Service</Link>{' '}
          and{' '}
          <Link href="/privacy" className="underline hover:text-gray-600">Privacy Policy</Link>.
          No legal claims are made on your behalf.
        </p>
      </div>
    </div>
  );
}
