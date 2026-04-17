'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';

interface FaqItem {
  question: string;
  answer: string;
}

const GENERAL_FAQS: FaqItem[] = [
  {
    question: 'What is SurplusClickIT?',
    answer:
      'SurplusClickIT is an independent research tool that aggregates publicly available surplus funds data from county and state government websites into a single searchable directory. It is not affiliated with any government agency.',
  },
  {
    question: 'Is SurplusClickIT free to use?',
    answer:
      'The core county directory, OSINT lookup tools, claims tracker (limited), and educational resources are free. Pro plans unlock additional features like CSV exports, unlimited county views, vetted data, and priority alerts.',
  },
  {
    question: 'Do I need an account to browse?',
    answer:
      'No. The county directory and most research tools are accessible without an account. Creating a free account unlocks the Claims Tracker, saved preferences, and additional features.',
  },
  {
    question: 'How often is the data updated?',
    answer:
      'County links and data are reviewed and updated regularly, but county records change frequently. Always verify information directly with the relevant county or state office before filing a claim.',
  },
];

const CLAIMS_FAQS: FaqItem[] = [
  {
    question: 'What are surplus funds?',
    answer:
      'Surplus funds (also called excess proceeds or overages) are leftover money from tax sales, foreclosure auctions, or other government proceedings. When a property sells for more than the amount owed, the excess belongs to the former owner or their heirs.',
  },
  {
    question: 'How do I claim surplus funds?',
    answer:
      'The general process is: (1) Find surplus funds in our county directory, (2) Verify the amount and eligibility at the county office, (3) Identify the rightful claimant, (4) Gather required documents, (5) File the claim with the county. Our 8-step guide on the homepage walks you through the full process.',
  },
  {
    question: 'Can I claim surplus funds for someone else?',
    answer:
      'Yes, in most states you can act as an authorized agent or assignee for the rightful claimant. This typically requires a signed assignment agreement and is subject to state-specific fee cap regulations. Check our State Requirements page for details.',
  },
  {
    question: 'How long does the claims process take?',
    answer:
      'It varies by county, but most claims are processed within 30 to 90 days after filing. Some jurisdictions require Board of Supervisors approval or have mandatory dispute periods. Check your specific county and state requirements for estimated timelines.',
  },
];

const BILLING_FAQS: FaqItem[] = [
  {
    question: 'What payment methods do you accept?',
    answer:
      'Pro subscriptions and donations are processed securely through Stripe, which accepts all major credit cards, debit cards, and select digital wallets.',
  },
  {
    question: 'Can I cancel my Pro plan?',
    answer:
      'Yes, you can cancel your Pro subscription at any time. Your access continues until the end of the current billing period. There are no cancellation fees.',
  },
  {
    question: 'Do you offer refunds?',
    answer:
      'Refunds are handled on a case-by-case basis. Contact us at ritacsolutions@gmail.com within 7 days of your purchase if you are unsatisfied.',
  },
  {
    question: 'What is the difference between a donation and a Pro subscription?',
    answer:
      'Donations help cover server costs and keep the free tier available for everyone. Pro subscriptions unlock premium features like CSV exports, unlimited views, and vetted data. Both support the platform, but only Pro plans grant access to paid features.',
  },
];

const DATA_FAQS: FaqItem[] = [
  {
    question: 'Where does the data come from?',
    answer:
      'All county data is sourced from publicly available government records. We link directly to official county websites and do not store or redistribute surplus funds lists. OSINT tools use publicly available APIs and data sources.',
  },
  {
    question: 'Is the data accurate?',
    answer:
      'We strive for accuracy, but county records change frequently. Data may be outdated or incomplete. Always verify information directly with the relevant county or state office before taking any action.',
  },
  {
    question: 'Does SurplusClickIT provide legal advice?',
    answer:
      'No. SurplusClickIT provides informational access to public records only. It does not provide legal, tax, or financial advice. Users should consult with a licensed attorney before filing claims or entering into agreements.',
  },
];

function FaqSection({ title, items }: { title: string; items: FaqItem[] }) {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="mb-10">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">{title}</h2>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="rounded-xl border border-gray-200 bg-white">
            <button
              onClick={() => setOpen(open === i ? null : i)}
              className="flex w-full items-center justify-between px-5 py-4 text-left text-sm font-medium text-gray-900"
              aria-expanded={open === i}
            >
              {item.question}
              <ChevronDown
                className={`h-4 w-4 flex-shrink-0 text-gray-400 transition-transform ${
                  open === i ? 'rotate-180' : ''
                }`}
              />
            </button>
            {open === i && (
              <div className="px-5 pb-4 text-sm text-gray-600 leading-relaxed">
                {item.answer}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">Frequently Asked Questions</h1>
        <p className="mt-3 text-gray-500">
          Common questions about SurplusClickIT, surplus funds claims, and our platform.
        </p>
      </div>

      <FaqSection title="General" items={GENERAL_FAQS} />
      <FaqSection title="Surplus Funds & Claims" items={CLAIMS_FAQS} />
      <FaqSection title="Billing & Subscriptions" items={BILLING_FAQS} />
      <FaqSection title="Data & Legal" items={DATA_FAQS} />

      <div className="rounded-xl bg-blue-50 border border-blue-200 p-6 text-center">
        <h2 className="text-lg font-semibold text-blue-900 mb-2">Still have questions?</h2>
        <p className="text-sm text-blue-700 mb-4">
          We&apos;re here to help. Reach out and we&apos;ll get back to you as soon as possible.
        </p>
        <Link
          href="/contact"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          Contact Us
        </Link>
      </div>

      <div className="mt-8 flex gap-4 text-sm justify-center">
        <Link href="/terms" className="text-blue-600 hover:underline">Terms of Service</Link>
        <Link href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link>
        <Link href="/about" className="text-blue-600 hover:underline">About</Link>
      </div>
    </div>
  );
}
