'use client';
import { signIn } from 'next-auth/react';
import { Check } from 'lucide-react';
import Image from 'next/image';
import Button from '@/components/ui/Button';
import Link from 'next/link';
import { useState, FormEvent } from 'react';

const BENEFITS = [
  'Browse 200+ county surplus funds lists across 10 states',
  'Search by state, population, and keywords',
  'Direct links to official county surplus funds pages',
  'View claim rules, deadlines, and statutes per county',
  'Free OSINT tools: people search, address, phone & email lookup',
  'Upgrade to Pro for CSV exports, vetted data, and priority alerts',
];

export default function SignUpPage() {
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
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mb-3 flex justify-center">
            <Image src="/surplusfunds_favicon.png" alt="Surplus Funds" width={48} height={48} className="h-12 w-12" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Create Your Account</h1>
          <p className="mt-1 text-sm text-gray-500">Join the surplus funds intelligence platform</p>
          <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
            100% Free — No Password Required
          </div>
        </div>

        {/* Benefits */}
        <div className="mb-6 rounded-xl bg-gray-50 p-4">
          <p className="mb-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Free account includes:</p>
          <ul className="space-y-2">
            {BENEFITS.map(b => (
              <li key={b} className="flex items-start gap-2 text-sm text-gray-600">
                <Check className="h-4 w-4 mt-0.5 text-green-500 flex-shrink-0" />
                {b}
              </li>
            ))}
          </ul>
        </div>

        {submitted ? (
          <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-center">
            <div className="mb-2 text-2xl">📬</div>
            <h2 className="mb-1 text-base font-semibold text-green-800">Check your email</h2>
            <p className="text-sm text-green-700">
              We sent a magic link to <span className="font-medium">{email}</span>. Click it to create your account — no password needed.
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
              {loading ? 'Sending link…' : 'Get my free access'}
            </Button>
            {error && (
              <p className="text-sm text-red-600 text-center">{error}</p>
            )}
          </form>
        )}

        {!submitted && (
          <>
            <p className="mt-6 text-center text-sm text-gray-500">
              Already have an account?{' '}
              <Link href="/auth/signin" className="text-blue-600 hover:underline font-medium">
                Sign in
              </Link>
            </p>
            <p className="mt-4 text-center text-xs text-gray-400">
              By creating an account you agree to our{' '}
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
