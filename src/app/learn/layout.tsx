import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Learning Center',
  description:
    'Learn surplus funds recovery step by step. Guides on tax sale surplus, heir claims, filing procedures, and building a recovery business.',
  alternates: { canonical: '/learn' },
};

export default function LearnLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
