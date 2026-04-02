import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Claim Templates',
  description:
    'Download free surplus funds claim letter templates. Pre-written templates for county claims, heir claims, and third-party recovery.',
  alternates: { canonical: '/templates' },
};

export default function TemplatesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
