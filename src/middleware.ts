export { default } from 'next-auth/middleware';

// These routes require any authenticated session (free account)
export const config = {
  matcher: [
    '/learn/:path*',
    '/templates/:path*',
    '/calculator/:path*',
    '/claims/:path*',
    '/export/:path*',
    '/dashboard/:path*',
  ],
};
