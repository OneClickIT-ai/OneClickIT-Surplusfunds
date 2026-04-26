import { NextResponse, type NextRequest } from 'next/server';

/**
 * Routes that require an authenticated session.
 * These mirror the previous `export { default } from 'next-auth/middleware'`
 * matcher config exactly.
 */
const PROTECTED = [
  '/learn',
  '/templates',
  '/calculator',
  '/claims',
  '/export',
  '/dashboard',
  '/admin',
  '/crm',
  '/leads',
  '/cases',
  '/tasks',
  '/agreements',
  '/insights',
  '/osint',
  '/dorks',
  '/settings',
];

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // — Scanner-safe magic-link —
  // Intercept every GET to /api/auth/callback/email BEFORE NextAuth processes
  // it. Email prefetchers (Outlook SafeLinks, Gmail security scanners) make a
  // GET to any URL in an email. Without this guard they would silently consume
  // the one-time token, leaving the real user with an “expired link” error.
  //
  // Flow:
  //   1. Email link hits /api/auth/callback/email?token=...&email=...
  //   2. Middleware redirects to /auth/verify?url=<encoded original URL>
  //   3. Verify page shows a "Sign in" button pointing to the same URL + ?_v=1
  //   4. User clicks → /api/auth/callback/email?...&_v=1
  //   5. Middleware sees _v=1 and passes through to NextAuth → session created
  //
  // Scanners (GET-only, no JS) land on step 3 and stop — token is never used.
  if (pathname === '/api/auth/callback/email' && !searchParams.has('_v')) {
    const verifyUrl = new URL('/auth/verify', request.nextUrl.origin);
    verifyUrl.searchParams.set('url', request.url);
    return NextResponse.redirect(verifyUrl);
  }

  // — Auth guard —
  // Check for a NextAuth session cookie on protected routes. This replicates
  // the cookie-presence check that `next-auth/middleware` performs for
  // database-session strategies — actual session validity is confirmed
  // server-side by getServerSession() inside each page.
  if (PROTECTED.some((p) => pathname.startsWith(p))) {
    const sessionCookie =
      request.cookies.get('next-auth.session-token')?.value ??
      request.cookies.get('__Secure-next-auth.session-token')?.value;
    if (!sessionCookie) {
      const signIn = new URL('/auth/signin', request.url);
      signIn.searchParams.set('callbackUrl', request.url);
      return NextResponse.redirect(signIn);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Intercept the NextAuth email callback for scanner protection.
    '/api/auth/callback/email',
    // Auth-guarded application routes.
    '/learn/:path*',
    '/templates/:path*',
    '/calculator/:path*',
    '/claims/:path*',
    '/export/:path*',
    '/dashboard/:path*',
    '/admin/:path*',
    // CRM surface (lives under the (app) route group; paths are real URL segments)
    '/crm/:path*',
    '/leads/:path*',
    '/cases/:path*',
    '/tasks/:path*',
    '/agreements/:path*',
    '/insights/:path*',
    '/osint/:path*',
    '/dorks/:path*',
    // Settings — all sub-routes protected but always accessible post-login
    '/settings/:path*',
    '/settings/notifications/:path*',
    '/settings/billing/:path*',
    '/settings/api/:path*',
    // Portal
    '/portal/:path*',
  ],
};
