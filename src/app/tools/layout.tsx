import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'All Tools',
  description:
    'Complete toolkit for surplus funds recovery. OSINT search, county directory, claims tracker, unclaimed property lookup, Google dorks, and more.',
  alternates: { canonical: '/tools' },
};

export default function ToolsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
