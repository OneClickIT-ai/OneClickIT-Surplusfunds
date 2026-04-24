import Link from 'next/link';
import { Monitor, Shield, Cpu, Phone, Wifi, HardDrive, Mail, Clock, CheckCircle2, ExternalLink, ArrowRight, Gem } from 'lucide-react';

export default function PartnersPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-10 text-center">
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Our Partners</h1>
        <p className="mt-2 text-gray-500">
          Trusted companies we recommend to help you succeed
        </p>
      </div>

      {/* OneClickIT Feature Card */}
      <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white p-8 shadow-sm mb-10">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left — Info */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="rounded-xl bg-blue-600 p-3">
                <Monitor className="h-7 w-7 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">OneClickIT.ai</h2>
                <p className="text-sm text-blue-600 font-medium">Official Technology Partner</p>
              </div>
            </div>

            <p className="text-gray-700 mb-4 text-lg font-medium">
              One click. Problem solved.
            </p>

            <p className="text-gray-600 mb-6">
              Running a surplus funds recovery business means relying on technology every day —
              from researching county records to managing your claims pipeline.
              When tech issues strike, you need fast, reliable support so you can get back to
              recovering funds. That&apos;s why we partner with <strong>OneClickIT.ai</strong>.
            </p>

            <p className="text-gray-600 mb-6">
              OneClickIT.ai provides AI-powered IT support for homes and small businesses.
              Their Robin AI agent diagnoses issues instantly, and when you need a human,
              their technicians are available 24/7 remotely or onsite in the LA County area.
            </p>

            <a
              href="https://oneclickit.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
            >
              Visit OneClickIT.ai
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>

          {/* Right — Services */}
          <div className="lg:w-80 flex-shrink-0">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
              What They Help With
            </h3>
            <div className="space-y-3">
              {[
                { icon: Cpu, label: 'AI-Powered Diagnostics', desc: 'Instant issue detection with Robin AI' },
                { icon: Shield, label: 'Cybersecurity', desc: 'Breach detection & data protection' },
                { icon: Monitor, label: 'Remote IT Support', desc: '24/7 worldwide remote assistance' },
                { icon: Phone, label: 'Device Troubleshooting', desc: 'Computers, phones, printers & more' },
                { icon: HardDrive, label: 'Data Backup & Recovery', desc: 'Never lose your claims data' },
                { icon: Mail, label: 'Email & Cloud Setup', desc: 'Professional email & cloud services' },
                { icon: Wifi, label: 'Network & Connectivity', desc: 'Keep your home office running' },
                { icon: Clock, label: 'Proactive Monitoring', desc: 'Fixes problems before they happen' },
              ].map(item => (
                <div key={item.label} className="flex items-start gap-3">
                  <div className="rounded-lg bg-blue-100 p-1.5 mt-0.5">
                    <item.icon className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{item.label}</div>
                    <div className="text-xs text-gray-500">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Trust badges */}
        <div className="mt-8 pt-6 border-t border-blue-100 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'SOC 2 Compliant', detail: 'Enterprise-grade security' },
            { label: '256-bit Encryption', detail: 'On all remote sessions' },
            { label: '30-Day Guarantee', detail: 'Money-back, no questions' },
            { label: 'Plans from $19.99/mo', detail: 'Affordable for small business' },
          ].map(badge => (
            <div key={badge.label} className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-sm font-medium text-gray-900">{badge.label}</div>
                <div className="text-xs text-gray-500">{badge.detail}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SleekGemsHall Feature Card */}
      <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-8 shadow-sm mb-10">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left — Info */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="rounded-xl bg-emerald-600 p-3">
                <Gem className="h-7 w-7 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">SleekGemsHall</h2>
                <p className="text-sm text-emerald-600 font-medium">Official Gems & Jewelry Partner</p>
              </div>
            </div>

            <p className="text-gray-700 mb-4 text-lg font-medium">
              Elegance you can feel good about.
            </p>

            <p className="text-gray-600 mb-6">
              SleekGemsHall is a curated gem and jewelry shop offering beautifully crafted pieces at accessible prices.
              Whether you&apos;re treating yourself or looking for a thoughtful gift, their sleek, handpicked collection
              has something for everyone.
            </p>

            <p className="text-gray-600 mb-6">
              Discover their collection of fine gems and jewelry that combine style with quality craftsmanship.
            </p>

            <a
              href="https://sleekgemshall.shop/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
            >
              Visit SleekGemsHall
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>

          {/* Right — Features */}
          <div className="lg:w-80 flex-shrink-0">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
              Why Shop with SleekGemsHall
            </h3>
            <div className="space-y-3">
              {[
                { icon: Gem, label: 'Curated Gem Collection', desc: 'Hand-selected gems and fine jewelry' },
                { icon: Shield, label: 'Quality Guaranteed', desc: 'Premium pieces at accessible prices' },
                { icon: CheckCircle2, label: 'Ethically Sourced', desc: 'Responsibly sourced materials' },
                { icon: ExternalLink, label: 'Easy Online Shopping', desc: 'Browse and buy from anywhere' },
                { icon: ArrowRight, label: 'Thoughtful Gifts', desc: 'Perfect for any occasion' },
              ].map(item => (
                <div key={item.label} className="flex items-start gap-3">
                  <div className="rounded-lg bg-emerald-100 p-1.5 mt-0.5">
                    <item.icon className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{item.label}</div>
                    <div className="text-xs text-gray-500">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Why Tech Support Matters */}
      <div className="rounded-xl bg-gray-50 border border-gray-200 p-6 mb-10">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Why Tech Support Matters for Surplus Funds Recovery
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            {
              title: 'Protect Your Research Data',
              desc: 'County records, claim documents, and client information need reliable backup and security.',
            },
            {
              title: 'Stay Online & Productive',
              desc: 'Downtime means missed deadlines. Fast IT support keeps your business running.',
            },
            {
              title: 'Secure Client Communications',
              desc: 'Handle sensitive financial data with proper email encryption and security practices.',
            },
            {
              title: 'Scale Your Business',
              desc: 'As your claims pipeline grows, so do your tech needs. Get proactive support that grows with you.',
            },
          ].map(item => (
            <div key={item.title} className="rounded-lg bg-white p-4 border border-gray-100">
              <h3 className="font-medium text-gray-900 mb-1">{item.title}</h3>
              <p className="text-sm text-gray-500">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA — both partners */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl bg-blue-600 p-6 text-center text-white">
          <h2 className="text-lg font-bold mb-2">Having Technical Issues?</h2>
          <p className="text-blue-100 mb-4 text-sm">
            Don&apos;t let tech problems slow down your surplus funds business.
          </p>
          <a
            href="https://oneclickit.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-50 transition-colors"
          >
            Get Help from OneClickIT.ai
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
        <div className="rounded-xl bg-emerald-600 p-6 text-center text-white">
          <h2 className="text-lg font-bold mb-2">Discover SleekGemsHall</h2>
          <p className="text-emerald-100 mb-4 text-sm">
            Beautiful gems &amp; jewelry, curated for quality and style.
          </p>
          <a
            href="https://sleekgemshall.shop/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 transition-colors"
          >
            Shop SleekGemsHall
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>

      {/* Back to tools */}
      <div className="mt-8 text-center">
        <Link
          href="/tools"
          className="text-sm text-gray-500 hover:text-gray-700 underline"
        >
          Back to Tools
        </Link>
      </div>
    </div>
  );
}
