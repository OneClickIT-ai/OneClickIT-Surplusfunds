import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Surplus Funds Calculator',
  description:
    'Calculate your potential surplus funds recovery amount. Estimate fees, timelines, and net proceeds from tax sale surplus claims.',
  alternates: { canonical: '/calculator' },
};

export default function CalculatorLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
