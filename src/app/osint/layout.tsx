import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'OSINT Tools',
  description:
    'Free OSINT tools for asset recovery professionals. Search people, verify addresses, look up phone numbers, check emails, and find social profiles.',
  alternates: { canonical: '/osint' },
  robots: { index: true, follow: true },
};

export default function OsintLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
