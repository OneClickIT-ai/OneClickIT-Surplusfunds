import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Google Dorks for Surplus Funds',
  description:
    'Advanced Google search queries (dorks) to find surplus funds lists, tax sale records, and unclaimed property data from county websites.',
  alternates: { canonical: '/dorks' },
};

export default function DorksLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
