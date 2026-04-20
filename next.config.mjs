import { withSentryConfig } from "@sentry/nextjs";

/**
 * Content-Security-Policy. Shipped in Report-Only mode first so any drift
 * from third-party scripts (Stripe, Sentry ingest, Google Sign-In, Vercel
 * Analytics) surfaces as reports without breaking the product. Flip to
 * `Content-Security-Policy` once reports are clean for a full release cycle.
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  // Next.js ships inline bootstrapping scripts; Stripe Checkout + Google OAuth + Vercel Analytics load from their own origins.
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://va.vercel-scripts.com https://accounts.google.com",
  // Tailwind injects runtime style tags, so unsafe-inline stays until we move to nonce-based styles.
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://*.ingest.sentry.io https://*.ingest.us.sentry.io https://api.stripe.com https://accounts.google.com",
  "frame-src https://js.stripe.com https://accounts.google.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join('; ');

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
  },
  // Allow Puppeteer/Chromium to be bundled correctly
  serverExternalPackages: ['puppeteer-core', '@sparticuz/chromium'],
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          // Cross-origin isolation for leaky side-channels (Spectre-style).
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
          { key: 'Content-Security-Policy-Report-Only', value: contentSecurityPolicy },
        ],
      },
    ];
  },
  async redirects() {
    return [
      { source: '/login', destination: '/auth/signin', permanent: true },
      { source: '/register', destination: '/auth/signup', permanent: true },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  silent: !process.env.CI,
  org: "oneclickit",
  project: "surplusfunds",
  widenClientFileUpload: true,
  webpack: {
    treeshake: { removeDebugLogging: true },
    automaticVercelMonitors: false,
  },
});
