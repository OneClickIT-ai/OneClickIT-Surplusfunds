import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Export Data',
  description:
    'Download surplus funds data as CSV. Export county directory listings and scraped funds data for offline analysis.',
  alternates: { canonical: '/export' },
};

export default function ExportLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
