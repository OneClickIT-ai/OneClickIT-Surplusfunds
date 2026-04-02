import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Unclaimed Property by State',
  description:
    'Search unclaimed property records across all 50 states. Find forgotten bank accounts, insurance payouts, utility deposits, and more.',
  alternates: { canonical: '/unclaimed' },
};

export default function UnclaimedLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
