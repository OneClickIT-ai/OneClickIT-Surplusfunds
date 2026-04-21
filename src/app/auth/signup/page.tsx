import { Check } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import SignUpButtons from './SignUpButtons';
import { authDiagnostics } from '@/lib/auth';

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
        <SignUpButtons
          hasGoogle={authDiagnostics.hasGoogleOAuth}
          hasEmail={authDiagnostics.hasEmailProvider}
          hasDevCredentials={authDiagnostics.isDevCredentialsEnabled}
        />

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
