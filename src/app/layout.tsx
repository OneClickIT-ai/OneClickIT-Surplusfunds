import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';
import Header from '@/components/Layout/Header';
import Footer from '@/components/Layout/Footer';
import { Analytics } from '@vercel/analytics/react';

export const metadata: Metadata = {
  title: {
    default: 'SurplusClickIT — Surplus Funds Directory',
    template: '%s | SurplusClickIT',
  },
  description:
    'Search publicly available surplus funds lists from US counties. Find unclaimed property overages, tax sale proceeds, and foreclosure surplus funds — all in one place.',
  keywords: [
    'surplus funds',
    'unclaimed property',
    'tax sale proceeds',
    'excess proceeds',
    'foreclosure surplus',
    'county surplus funds',
    'overage funds',
    'asset recovery',
    'surplus funds directory',
    'tax deed surplus',
  ],
  authors: [{ name: 'SurplusClickIT', url: 'https://surplusclickit.com' }],
  creator: 'SurplusClickIT',
  publisher: 'SurplusClickIT',
  metadataBase: new URL('https://surplusclickit.com'),
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
    },
  },
  icons: {
    icon: '/surplusfunds_favicon.png',
    apple: '/surplusfunds_favicon.png',
  },
  openGraph: {
    title: 'SurplusClickIT — Surplus Funds Directory',
    description:
      'Find surplus funds from US county public records. Search tax sale overages, foreclosure proceeds, and unclaimed property across hundreds of counties.',
    url: 'https://surplusclickit.com',
    siteName: 'SurplusClickIT',
    type: 'website',
    locale: 'en_US',
    images: [
      {
        url: '/surplusfunds_flat_minimal.png',
        width: 1200,
        height: 630,
        alt: 'SurplusClickIT — Surplus Funds Directory',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SurplusClickIT — Surplus Funds Directory',
    description:
      'Find surplus funds from US county public records. Tax sale overages, foreclosure proceeds, unclaimed property.',
    images: ['/surplusfunds_flat_minimal.png'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 font-sans">
        <ClerkProvider>
          <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:rounded-lg focus:bg-blue-600 focus:px-4 focus:py-2 focus:text-white focus:shadow-lg">
            Skip to main content
          </a>
          <div className="flex min-h-screen flex-col">
            <Header />
            <main id="main" className="flex-1">{children}</main>
            <Footer />
          </div>
          <Analytics />
        </ClerkProvider>
      </body>
    </html>
  );
}
