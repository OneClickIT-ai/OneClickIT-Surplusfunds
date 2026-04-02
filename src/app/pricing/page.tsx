'use client';
import { useSession, signIn } from 'next-auth/react';
import { Check, Shield, Search, Download, Bell } from 'lucide-react';
import Image from 'next/image';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

const PLANS = [
  {
    name: '3-Day Pass',
    price: '$1',
    period: '3 days',
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_3DAY,
    highlight: false,
  },
  {
    name: 'Weekly',
    price: '$10',
    period: 'week',
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_WEEKLY,
    highlight: false,
  },
  {
    name: 'Monthly',
    price: '$20',
    period: 'month',
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY,
    highlight: true,
    badge: 'Most Popular',
  },
  {
    name: 'Annual',
    price: '$150',
    period: 'year',
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ANNUAL,
    highlight: false,
    badge: 'Save 37%',
  },
];

const FREE_FEATURES = [
  'Browse 50+ county directory',
  'View basic surplus listings',
  '5 county detail views per day',
  'State filter & search',
  'OSINT people search tools',
  'Address verification & lookup',
  'Phone & email checker',
];

const PRO_FEATURES = [
  'Everything in Free, plus:',
  'Full vetted & sorted surplus data',
  'CSV export of filtered results',
  'Priority alert notifications',
  'Unlimited county detail views',
  'Direct claim form links',
];

export default function PricingPage() {
  const { data: session } = useSession();

  const handleSubscribe = async (priceId: string | undefined) => {
    if (!session) {
      signIn(undefined, { callbackUrl: '/pricing' });
      return;
    }
    if (!priceId) {
      alert('Stripe prices not configured yet. Contact admin.');
      return;
    }
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ priceId }),
    });
    const data = await res.json();
    if (data.data?.url) {
      window.location.href = data.data.url;
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-12 text-center">
        <div className="mb-4 flex justify-center">
          <Image src="/surplusfunds_favicon.png" alt="" width={48} height={48} className="h-12 w-12" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
          Unlock the Full Platform
        </h1>
        <p className="mt-3 text-lg text-gray-500">
          Free basic access with OSINT tools. Upgrade for vetted data, CSV exports, and faster claims.
        </p>
      </div>

      {/* Free vs Pro comparison */}
      <div className="mb-12 grid gap-6 lg:grid-cols-2">
        {/* Free */}
        <Card padding="lg" className="border-gray-200">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-gray-900">Free</h2>
            <p className="text-3xl font-bold text-gray-900 mt-2">$0 <span className="text-sm font-normal text-gray-500">forever</span></p>
          </div>
          <ul className="space-y-3 mb-6">
            {FREE_FEATURES.map(f => (
              <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                <Check className="h-4 w-4 mt-0.5 text-green-500 flex-shrink-0" />
                {f}
              </li>
            ))}
          </ul>
          <Button variant="outline" className="w-full" onClick={() => !session && signIn()}>
            {session ? 'Current Plan' : 'Sign Up Free'}
          </Button>
        </Card>

        {/* Pro */}
        <Card padding="lg" className="border-green-500 border-2 relative">
          <div className="absolute -top-3 left-6 rounded-full bg-green-500 px-3 py-0.5 text-xs font-medium text-white">
            PRO
          </div>
          <div className="mb-4">
            <h2 className="text-xl font-bold text-gray-900">Pro Access</h2>
            <p className="text-sm text-gray-500 mt-1">Full platform + exports &amp; unlimited access</p>
          </div>
          <ul className="space-y-3 mb-6">
            {PRO_FEATURES.map(f => (
              <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                <Check className="h-4 w-4 mt-0.5 text-green-500 flex-shrink-0" />
                {f}
              </li>
            ))}
          </ul>

          {/* Pro tools preview */}
          <div className="mb-6 rounded-lg bg-gray-50 p-4">
            <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Pro Exclusive Features</p>
            <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
              <span className="flex items-center gap-1"><Download className="h-3 w-3" /> CSV Export</span>
              <span className="flex items-center gap-1"><Bell className="h-3 w-3" /> Priority Alerts</span>
              <span className="flex items-center gap-1"><Search className="h-3 w-3" /> Unlimited Views</span>
              <span className="flex items-center gap-1"><Shield className="h-3 w-3" /> Vetted Data</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Pricing cards */}
      <div className="mb-8 text-center">
        <h2 className="text-xl font-semibold text-gray-900">Choose Your Pro Plan</h2>
        <p className="text-sm text-gray-500">All plans include full platform access</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PLANS.map(plan => (
          <Card
            key={plan.name}
            padding="md"
            className={`text-center ${plan.highlight ? 'border-green-500 border-2 shadow-lg' : ''} relative`}
          >
            {plan.badge && (
              <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 rounded-full bg-green-500 px-3 py-0.5 text-xs font-medium text-white whitespace-nowrap">
                {plan.badge}
              </div>
            )}
            <h3 className="font-semibold text-gray-900 mt-1">{plan.name}</h3>
            <div className="my-3">
              <span className="text-3xl font-bold text-gray-900">{plan.price}</span>
              <span className="text-sm text-gray-500">/{plan.period}</span>
            </div>
            <Button
              className="w-full"
              variant={plan.highlight ? 'primary' : 'outline'}
              onClick={() => handleSubscribe(plan.priceId)}
            >
              Get Started
            </Button>
          </Card>
        ))}
      </div>

      {/* FAQ / Trust */}
      <div className="mt-12 text-center text-sm text-gray-400">
        <p>Secure payments via Stripe. Cancel anytime. No hidden fees.</p>
        <p className="mt-1">All data sourced from public county records. OSINT tools use publicly available information only.</p>
      </div>
    </div>
  );
}
