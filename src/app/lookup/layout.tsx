import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Third-Party Lookup Tools',
  description:
    'Access 150+ free search tools for people search, property records, court records, business lookup, and more across 14 categories.',
  alternates: { canonical: '/lookup' },
};

export default function LookupLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
