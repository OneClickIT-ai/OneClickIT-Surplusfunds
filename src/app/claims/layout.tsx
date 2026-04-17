import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Claims Tracker',
  description:
    'Track and manage your surplus funds claims. Monitor claim status, add activity notes, and stay organized throughout the recovery process.',
  alternates: { canonical: '/claims' },
};

export default function ClaimsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
