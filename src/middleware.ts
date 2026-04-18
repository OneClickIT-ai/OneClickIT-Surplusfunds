export { default } from 'next-auth/middleware';

// These routes require any authenticated session (free account).
// Note: the `(app)` route group in src/app does NOT appear in the URL path,
// so /crm, /leads, /cases, /tasks, /agreements, etc. are the real matchers
// for the new CRM surface.
export const config = {
  matcher: [
    '/learn/:path*',
    '/templates/:path*',
    '/calculator/:path*',
    '/claims/:path*',
    '/export/:path*',
    '/dashboard/:path*',
    '/admin/:path*',
    // v1 CRM surface (lives under the (app) route group)
    '/crm/:path*',
    '/leads/:path*',
    '/cases/:path*',
    '/tasks/:path*',
    '/agreements/:path*',
    '/osint/:path*',
    '/dorks/:path*',
    '/settings/:path*',
  ],
};
