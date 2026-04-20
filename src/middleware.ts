import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Everything that previously required a NextAuth session. The `(app)` route
// group doesn't appear in the URL path, so /crm, /leads, /cases, /tasks,
// /agreements, etc. are the real matchers for the CRM surface.
const isProtected = createRouteMatcher([
  '/learn/:path*',
  '/templates/:path*',
  '/calculator/:path*',
  '/claims/:path*',
  '/export/:path*',
  '/dashboard/:path*',
  '/admin/:path*',
  '/crm/:path*',
  '/leads/:path*',
  '/cases/:path*',
  '/tasks/:path*',
  '/agreements/:path*',
  '/insights/:path*',
  '/osint/:path*',
  '/dorks/:path*',
  '/settings/:path*',
  '/api/v1/:path*',
  '/api/claims/:path*',
  '/api/alerts/:path*',
  '/api/export/:path*',
  '/api/upload/:path*',
  '/api/counties/:path*',
  '/api/scrape/:path*',
  '/api/stripe/:path*',
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtected(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next internals and static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
