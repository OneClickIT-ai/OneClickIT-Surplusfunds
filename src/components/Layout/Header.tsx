'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useSession, signOut } from 'next-auth/react';
import { Search, LayoutDashboard, Settings, LogOut, LogIn, Shield, CreditCard, Download } from 'lucide-react';

export default function Header() {
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/surplusfunds_favicon.png"
            alt="Surplus Funds"
            width={32}
            height={32}
            className="h-8 w-8"
          />
          <Image
            src="/surplusfunds_flat_minimal.png"
            alt="Surplus Funds"
            width={150}
            height={47}
            className="hidden sm:block h-8 w-auto"
          />
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          <Link
            href="/directory"
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900"
          >
            <Search className="h-4 w-4" />
            <span className="hidden sm:block">Directory</span>
          </Link>

          <Link
            href="/pricing"
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900"
          >
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:block">Pricing</span>
          </Link>

          {session ? (
            <>
              <Link
                href="/osint"
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-green-600 hover:bg-green-50 hover:text-green-700"
              >
                <Shield className="h-4 w-4" />
                <span className="hidden sm:block">OSINT</span>
              </Link>

              <Link
                href="/export"
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:block">Export</span>
              </Link>

              <Link
                href="/dashboard"
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              >
                <LayoutDashboard className="h-4 w-4" />
                <span className="hidden sm:block">Dashboard</span>
              </Link>

              {session.user.role === 'admin' && (
                <Link
                  href="/admin"
                  className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                >
                  <Settings className="h-4 w-4" />
                  <span className="hidden sm:block">Admin</span>
                </Link>
              )}

              <button
                onClick={() => signOut()}
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:block">Sign out</span>
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/auth/signin"
                className="rounded-lg px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              >
                Sign in
              </Link>
              <Link
                href="/auth/signup"
                className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700"
              >
                <LogIn className="h-4 w-4" />
                Sign up
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
