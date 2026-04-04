'use client';
import { signIn } from 'next-auth/react';
import { Check } from 'lucide-react';
import Image from 'next/image';
import Button from '@/components/ui/Button';
import Link from 'next/link';

const BENEFITS = [
  'Browse 200+ county surplus funds lists across 10 states',
  'Search by state, population, and keywords',
  'Direct links to official county surplus funds pages',
  'View claim rules, deadlines, and statutes per county',
  'Free OSINT tools: people search, address, phone & email lookup',
  'Upgrade to Pro for CSV exports, vetted data, and priority alerts',
];

export default function SignUpPage() {
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
            100% Free — No Credit Card Required
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

        {/* Sign up buttons */}
        <div className="space-y-3">
          <Button
            className="w-full"
            variant="primary"
            onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path fill="#fff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
              <path fill="#fff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#fff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#fff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Sign up with Google
          </Button>
        </div>

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
      </div>
    </div>
  );
}
