import Link from 'next/link';
import Image from 'next/image';
import { Mail, Globe, Shield, Users, Search, FileText, BookOpen, ArrowRight } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-12 text-center">
        <Image
          src="/surplusfunds_favicon.png"
          alt="SurplusClickIT"
          width={64}
          height={64}
          className="mx-auto mb-4 h-16 w-16"
        />
        <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">About SurplusClickIT</h1>
        <p className="mt-3 text-lg text-gray-500">
          Free surplus funds research tools built for asset recovery professionals.
        </p>
      </div>

      {/* Mission */}
      <section className="mb-12 rounded-xl border border-blue-200 bg-blue-50 p-8">
        <h2 className="mb-4 text-xl font-bold text-gray-900">Our Mission</h2>
        <p className="text-gray-700 leading-relaxed">
          Surplus funds from tax sales, foreclosure overages, and unclaimed property represent
          real money owed to real people. Our mission is to make that information freely
          accessible so anyone — from individual property owners to professional recovery
          agents — can find and claim what&apos;s rightfully theirs.
        </p>
        <p className="mt-4 text-gray-700 leading-relaxed">
          We believe public county data should be easy to search, not buried across hundreds
          of individual government websites. SurplusClickIT aggregates, organizes, and provides
          tools to act on that data — all for free.
        </p>
      </section>

      {/* What We Offer */}
      <section className="mb-12">
        <h2 className="mb-6 text-xl font-bold text-gray-900">What We Offer</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            {
              icon: Search,
              title: 'County Directory',
              desc: '200+ counties with direct links to surplus funds lists, deadlines, and filing offices.',
              href: '/directory',
            },
            {
              icon: Shield,
              title: 'OSINT Tools',
              desc: 'Free people search, address verification, phone lookup, email checker, and username search.',
              href: '/osint',
            },
            {
              icon: FileText,
              title: 'Claims Toolkit',
              desc: 'Claim tracker, letter templates, fee calculator, and state-by-state filing requirements.',
              href: '/tools',
            },
            {
              icon: BookOpen,
              title: 'Learning Center',
              desc: '7-module course covering everything from finding funds to building a recovery business.',
              href: '/learn',
            },
            {
              icon: Users,
              title: 'Third-Party Lookup',
              desc: '150+ curated free search tools across 14 categories for skip tracing and research.',
              href: '/lookup',
            },
            {
              icon: Globe,
              title: 'Unclaimed Property',
              desc: 'Search unclaimed property records across all 50 states from a single interface.',
              href: '/unclaimed',
            },
          ].map(item => (
            <Link
              key={item.title}
              href={item.href}
              className="group rounded-xl border border-gray-200 bg-white p-5 hover:border-blue-300 hover:shadow-sm transition-all"
            >
              <item.icon className="mb-2 h-5 w-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900 group-hover:text-blue-600">{item.title}</h3>
              <p className="mt-1 text-sm text-gray-500">{item.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Data Sources */}
      <section className="mb-12 rounded-xl border border-gray-200 bg-gray-50 p-8">
        <h2 className="mb-4 text-xl font-bold text-gray-900">Our Data</h2>
        <p className="text-gray-700 leading-relaxed mb-4">
          All county data on SurplusClickIT is sourced from publicly available government
          records. We link directly to official county websites — we don&apos;t store or
          redistribute surplus funds lists ourselves.
        </p>
        <p className="text-gray-700 leading-relaxed">
          OSINT tools use publicly available APIs and data sources. We do not access private
          databases or charge for any search tools. Our goal is to help you use freely
          available information more efficiently.
        </p>
      </section>

      {/* Contact */}
      <section className="mb-12" id="contact">
        <h2 className="mb-6 text-xl font-bold text-gray-900">Contact Us</h2>
        <div className="rounded-xl border border-gray-200 bg-white p-8">
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <h3 className="mb-3 font-semibold text-gray-900">General Inquiries</h3>
              <a
                href="mailto:ritacsolutions@gmail.com"
                className="inline-flex items-center gap-2 text-blue-600 hover:underline"
              >
                <Mail className="h-4 w-4" />
                ritacsolutions@gmail.com
              </a>
              <p className="mt-3 text-sm text-gray-500">
                Questions about the platform, data accuracy, partnership opportunities,
                or feature requests.
              </p>
            </div>
            <div>
              <h3 className="mb-3 font-semibold text-gray-900">Tech Support</h3>
              <a
                href="https://oneclickit.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-blue-600 hover:underline"
              >
                <Globe className="h-4 w-4" />
                OneClickIT.ai
              </a>
              <p className="mt-3 text-sm text-gray-500">
                For technical issues, IT support, or help with your research setup,
                visit our technology partner.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Built by */}
      <section className="mb-12 text-center">
        <p className="text-sm text-gray-500">
          Built by <strong>OneClickIT</strong> &mdash; AI-powered technology solutions
          for small businesses.
        </p>
      </section>

      {/* CTA */}
      <div className="rounded-xl bg-green-600 p-8 text-center text-white">
        <h2 className="text-xl font-bold mb-2">Ready to Start?</h2>
        <p className="text-green-100 mb-6">
          Browse our county directory and start finding surplus funds today — no signup required.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/directory"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-semibold text-green-700 hover:bg-green-50"
          >
            Browse Directory
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/tools"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-green-400 px-6 py-3 text-sm font-semibold text-white hover:bg-green-700"
          >
            View All Tools
          </Link>
        </div>
      </div>
    </div>
  );
}
