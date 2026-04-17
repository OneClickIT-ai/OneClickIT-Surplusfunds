'use client';
import { signIn } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import Button from '@/components/ui/Button';

export default function SignInPage() {
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

        <div className="space-y-3">
          <Button
            className="w-full"
            variant="primary"
            onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
          >
            Sign in with Google
          </Button>
        </div>

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
