import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About',
  description:
    'About SurplusClickIT — free surplus funds research tools for asset recovery professionals. Learn about our mission, data sources, and contact information.',
  alternates: { canonical: '/about' },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
