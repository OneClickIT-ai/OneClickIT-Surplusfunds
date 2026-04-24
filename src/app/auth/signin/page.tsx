'use client';
import { signIn } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import { useState, FormEvent } from 'react';
import Button from '@/components/ui/Button';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError('');
    try {
      const result = await signIn('email', { email, callbackUrl: '/dashboard', redirect: false });
      if (result?.error) {
        setError('Failed to send magic link. Please try again.');
      } else {
        setSubmitted(true);
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

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

        {submitted ? (
          <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-center">
            <div className="mb-2 text-2xl">📬</div>
            <h2 className="mb-1 text-base font-semibold text-green-800">Check your email</h2>
            <p className="text-sm text-green-700">
              We sent a magic link to <span className="font-medium">{email}</span>. Click the link to sign in — no password needed.
            </p>
            <button
              className="mt-4 text-xs text-green-600 underline hover:text-green-800"
              onClick={() => { setSubmitted(false); setEmail(''); }}
            >
              Use a different email
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <Button type="submit" className="w-full" variant="primary" disabled={loading}>
              {loading ? 'Sending link…' : 'Send magic link'}
            </Button>
            {error && (
              <p className="text-sm text-red-600 text-center">{error}</p>
            )}
          </form>
        )}

        {!submitted && (
          <>
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
          </>
        )}
      </div>
    </div>
  );
}
