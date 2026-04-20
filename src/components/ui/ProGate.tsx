'use client';
import { useSession } from '@/lib/auth-client';
import Link from 'next/link';
import { Lock, Zap } from 'lucide-react';

interface ProGateProps {
  children: React.ReactNode;
}

export default function ProGate({ children }: ProGateProps) {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <div className="py-24 text-center text-sm text-gray-400">Loading...</div>;
  }

  if (session?.user?.role === 'pro' || session?.user?.role === 'admin') {
    return <>{children}</>;
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
        <Lock className="h-8 w-8 text-amber-600" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900">Pro Feature</h2>
      <p className="mt-3 text-gray-500">
        This feature is available on Pro plans. Upgrade to access CSV exports, vetted data, and advanced tools.
      </p>
      <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <Link
          href="/pricing"
          className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-6 py-3 text-sm font-semibold text-white hover:bg-amber-600"
        >
          <Zap className="h-4 w-4" />
          View Pro Plans
        </Link>
        <Link
          href="/dashboard"
          className="rounded-lg border border-gray-200 px-6 py-3 text-sm text-gray-600 hover:bg-gray-50"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
