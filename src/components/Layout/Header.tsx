'use client';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSession, signOut } from 'next-auth/react';
import { Search, LayoutDashboard, Settings, LogOut, LogIn, Shield, Wrench, ClipboardList, BookOpen, Landmark, DollarSign, Menu, X } from 'lucide-react';

const NAV_LINKS = [
  { href: '/directory', label: 'Directory', icon: Search, color: 'text-gray-600 hover:bg-gray-100 hover:text-gray-900' },
  { href: '/osint', label: 'OSINT', icon: Shield, color: 'text-green-600 hover:bg-green-50 hover:text-green-700' },
  { href: '/claims', label: 'Claims', icon: ClipboardList, color: 'text-blue-600 hover:bg-blue-50 hover:text-blue-700' },
  { href: '/unclaimed', label: 'Unclaimed', icon: Landmark, color: 'text-purple-600 hover:bg-purple-50 hover:text-purple-700' },
  { href: '/tools', label: 'Tools', icon: Wrench, color: 'text-gray-600 hover:bg-gray-100 hover:text-gray-900' },
  { href: '/learn', label: 'Learn', icon: BookOpen, color: 'text-gray-600 hover:bg-gray-100 hover:text-gray-900' },
  { href: '/pricing', label: 'Pricing', icon: DollarSign, color: 'text-gray-600 hover:bg-gray-100 hover:text-gray-900' },
];

export default function Header() {
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href={session ? '/dashboard' : '/'} className="flex items-center gap-2">
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

        {/* Desktop nav */}
        <nav aria-label="Main navigation" className="hidden md:flex items-center gap-1 sm:gap-2">
          {NAV_LINKS.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm ${link.color}`}
            >
              <link.icon className="h-4 w-4" />
              <span>{link.label}</span>
            </Link>
          ))}

          {session ? (
            <div className="ml-1 flex items-center gap-2 border-l border-gray-200 pl-3">
              <Link
                href="/dashboard"
                className="flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-100"
              >
                {session.user.image ? (
                  <Image
                    src={session.user.image}
                    alt=""
                    width={20}
                    height={20}
                    className="h-5 w-5 rounded-full"
                  />
                ) : (
                  <LayoutDashboard className="h-4 w-4" />
                )}
                Dashboard
              </Link>

              {session.user.role === 'admin' && (
                <Link
                  href="/admin"
                  className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-gray-500 hover:bg-gray-100"
                >
                  <Settings className="h-4 w-4" />
                </Link>
              )}

              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="ml-1 flex items-center gap-2 border-l border-gray-200 pl-3">
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
                Start free
              </Link>
            </div>
          )}
        </nav>

        {/* Mobile hamburger button */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden flex items-center justify-center rounded-lg p-2 text-gray-600 hover:bg-gray-100"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 pb-4 pt-2">
          <nav aria-label="Mobile navigation" className="space-y-1">
            {NAV_LINKS.map(link => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm ${link.color}`}
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="mt-3 border-t border-gray-100 pt-3">
            {session ? (
              <div className="space-y-1">
                <Link
                  href="/dashboard"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2.5 text-sm font-medium text-blue-700"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Link>
                {session.user.role === 'admin' && (
                  <Link
                    href="/admin"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-gray-600 hover:bg-gray-100"
                  >
                    <Settings className="h-4 w-4" />
                    Admin
                  </Link>
                )}
                <button
                  onClick={() => { signOut({ callbackUrl: '/' }); setMobileOpen(false); }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-gray-600 hover:bg-gray-100"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Link
                  href="/auth/signin"
                  onClick={() => setMobileOpen(false)}
                  className="flex-1 rounded-lg border border-gray-200 px-3 py-2.5 text-center text-sm text-gray-600 hover:bg-gray-50"
                >
                  Sign in
                </Link>
                <Link
                  href="/auth/signup"
                  onClick={() => setMobileOpen(false)}
                  className="flex-1 rounded-lg bg-green-600 px-3 py-2.5 text-center text-sm font-medium text-white hover:bg-green-700"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
