import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Partners',
  description:
    'OneClickIT.ai technology partnership. Get expert tech support, custom development, and AI-powered solutions for your business.',
  alternates: { canonical: '/partners' },
};

export default function PartnersLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
