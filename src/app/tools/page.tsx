import Link from 'next/link';
import { FileText, Calculator, Scale, ClipboardList, Shield, Download, Search, BookOpen, Globe, Landmark, ExternalLink } from 'lucide-react';

const tools = [
  {
    name: 'Claim Tracker',
    desc: 'Track and manage your surplus funds claims pipeline from research to payout.',
    href: '/claims',
    icon: ClipboardList,
    color: 'blue',
  },
  {
    name: 'State Requirements',
    desc: 'View required documents, deadlines, statutes, and filing offices by state.',
    href: '/requirements',
    icon: Scale,
    color: 'purple',
  },
  {
    name: 'Claim Calculator',
    desc: 'Estimate costs, agent fees, filing fees, and net recovery amounts.',
    href: '/calculator',
    icon: Calculator,
    color: 'green',
  },
  {
    name: 'Letter Templates',
    desc: 'Professional claim letters, owner outreach, follow-ups, and assignment agreements.',
    href: '/templates',
    icon: FileText,
    color: 'orange',
  },
  {
    name: 'OSINT Tools',
    desc: 'People search, address lookup, phone checker, email verify, and username search.',
    href: '/osint',
    icon: Shield,
    color: 'green',
  },
  {
    name: 'County Directory',
    desc: 'Browse all counties with surplus funds lists, sources, and claim deadlines.',
    href: '/directory',
    icon: Search,
    color: 'blue',
  },
  {
    name: 'Unclaimed Property',
    desc: 'Search all 50 state unclaimed property programs — bank accounts, insurance, wages, and more.',
    href: '/unclaimed',
    icon: Landmark,
    color: 'purple',
  },
  {
    name: 'Third-Party Lookup',
    desc: '150+ search tools across 14 categories — person, phone, email, court, financial, and more.',
    href: '/lookup',
    icon: ExternalLink,
    color: 'orange',
  },
  {
    name: 'Google Dork Search',
    desc: 'Generate targeted Google searches to find surplus funds lists by state.',
    href: '/dorks',
    icon: Globe,
    color: 'green',
  },
  {
    name: 'Learning Center',
    desc: 'Complete 7-module syllabus on surplus funds recovery — from basics to business.',
    href: '/learn',
    icon: BookOpen,
    color: 'blue',
  },
  {
    name: 'Export Data',
    desc: 'Download county directory and scraped funds data as CSV files.',
    href: '/export',
    icon: Download,
    color: 'purple',
  },
];

const colors: Record<string, { bg: string; text: string; border: string }> = {
  blue:   { bg: 'bg-blue-50',   text: 'text-blue-600',   border: 'hover:border-blue-300' },
  green:  { bg: 'bg-green-50',  text: 'text-green-600',  border: 'hover:border-green-300' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'hover:border-purple-300' },
  orange: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'hover:border-orange-300' },
};

export default function ToolsPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Surplus Funds Recovery Tools</h1>
        <p className="mt-2 text-gray-500">
          Everything you need to find, claim, and recover surplus funds from US counties
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map(tool => {
          const c = colors[tool.color];
          return (
            <Link
              key={tool.href}
              href={tool.href}
              className={`rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:shadow ${c.border}`}
            >
              <div className={`mb-3 inline-flex rounded-lg p-2 ${c.bg}`}>
                <tool.icon className={`h-5 w-5 ${c.text}`} />
              </div>
              <h3 className="font-semibold text-gray-900">{tool.name}</h3>
              <p className="mt-1 text-sm text-gray-500">{tool.desc}</p>
            </Link>
          );
        })}
      </div>

      {/* Partner banners */}
      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
          <h2 className="text-lg font-semibold">Need Tech Support?</h2>
          <p className="text-sm text-blue-100 mt-1 mb-4">
            Our partner <strong>OneClickIT.ai</strong> provides AI-powered IT support for surplus funds professionals.
          </p>
          <Link
            href="/partners"
            className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50 transition-colors"
          >
            View Partners
          </Link>
        </div>
        <div className="rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 p-6 text-white">
          <h2 className="text-lg font-semibold">Shop &amp; Give Back</h2>
          <p className="text-sm text-emerald-100 mt-1 mb-4">
            Our partner <strong>SleekGemsHall</strong> offers curated gems &amp; jewelry — and donates <strong>10% of all proceeds to charity.</strong>
          </p>
          <a
            href="https://sleekgemshall.shop/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50 transition-colors"
          >
            Visit SleekGemsHall
          </a>
        </div>
      </div>

      <div className="mt-6 rounded-xl bg-blue-50 border border-blue-200 p-6 text-center">
        <h2 className="text-lg font-semibold text-blue-900 mb-2">Getting Started</h2>
        <p className="text-sm text-blue-700 max-w-2xl mx-auto">
          Start by browsing the <Link href="/directory" className="underline font-medium">County Directory</Link> to find counties with surplus funds lists.
          Use the <Link href="/requirements" className="underline font-medium">State Requirements</Link> checker to understand what documents you need.
          Track your claims in the <Link href="/claims" className="underline font-medium">Claim Tracker</Link> and use our
          {' '}<Link href="/templates" className="underline font-medium">Letter Templates</Link> to file professionally.
        </p>
      </div>
    </div>
  );
}
