import Link from 'next/link';
import type { Metadata } from 'next';
import { Mail, Globe, MessageCircle, Clock } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Contact Us',
  description:
    'Contact SurplusClickIT for questions about surplus funds research tools, data accuracy, partnership opportunities, or technical support.',
  alternates: { canonical: '/contact' },
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">Contact Us</h1>
        <p className="mt-3 text-gray-500">
          Have a question or need help? Reach out and we&apos;ll get back to you.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 mb-10">
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <div className="mb-3 inline-flex rounded-lg bg-blue-50 p-2">
            <Mail className="h-5 w-5 text-blue-600" />
          </div>
          <h2 className="font-semibold text-gray-900 mb-1">General Inquiries</h2>
          <a
            href="mailto:ritacsolutions@gmail.com"
            className="text-blue-600 hover:underline text-sm"
          >
            ritacsolutions@gmail.com
          </a>
          <p className="mt-2 text-sm text-gray-500">
            Questions about the platform, data accuracy, feature requests, partnership opportunities,
            or account issues.
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <div className="mb-3 inline-flex rounded-lg bg-green-50 p-2">
            <Globe className="h-5 w-5 text-green-600" />
          </div>
          <h2 className="font-semibold text-gray-900 mb-1">Tech Support</h2>
          <a
            href="https://oneclickit.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline text-sm"
          >
            OneClickIT.ai
          </a>
          <p className="mt-2 text-sm text-gray-500">
            For technical issues, IT support, or help with your research setup, visit our technology
            partner.
          </p>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 mb-10">
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <div className="mb-3 inline-flex rounded-lg bg-purple-50 p-2">
            <MessageCircle className="h-5 w-5 text-purple-600" />
          </div>
          <h2 className="font-semibold text-gray-900 mb-1">Common Topics</h2>
          <ul className="mt-2 space-y-1 text-sm text-gray-500">
            <li>&bull; Data accuracy or missing counties</li>
            <li>&bull; Account or billing questions</li>
            <li>&bull; Feature requests or bug reports</li>
            <li>&bull; Partnership or integration inquiries</li>
            <li>&bull; Press or media requests</li>
          </ul>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <div className="mb-3 inline-flex rounded-lg bg-orange-50 p-2">
            <Clock className="h-5 w-5 text-orange-600" />
          </div>
          <h2 className="font-semibold text-gray-900 mb-1">Response Times</h2>
          <p className="mt-2 text-sm text-gray-500">
            We typically respond within 1&ndash;2 business days. For urgent technical issues, please
            include &ldquo;URGENT&rdquo; in your subject line.
          </p>
          <p className="mt-2 text-sm text-gray-500">
            Before reaching out, check our{' '}
            <Link href="/faq" className="text-blue-600 hover:underline">FAQ page</Link>{' '}
            &mdash; your question may already be answered there.
          </p>
        </div>
      </div>

      <div className="rounded-xl bg-gray-50 border border-gray-200 p-6 text-center">
        <p className="text-sm text-gray-500">
          SurplusClickIT is operated by <strong>OneClickIT</strong>. We are an independent research
          tool and are not affiliated with any government agency. For questions about specific
          surplus funds claims, please contact the relevant county or state office directly.
        </p>
      </div>

      <div className="mt-8 flex gap-4 text-sm justify-center">
        <Link href="/faq" className="text-blue-600 hover:underline">FAQ</Link>
        <Link href="/about" className="text-blue-600 hover:underline">About</Link>
        <Link href="/terms" className="text-blue-600 hover:underline">Terms</Link>
        <Link href="/privacy" className="text-blue-600 hover:underline">Privacy</Link>
      </div>
    </div>
  );
}
