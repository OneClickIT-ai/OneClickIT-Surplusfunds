import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Claim Requirements by State',
  description:
    'State-by-state surplus funds claim requirements. Filing deadlines, required documents, statutes of limitations, and filing procedures.',
  alternates: { canonical: '/requirements' },
};

export default function RequirementsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
