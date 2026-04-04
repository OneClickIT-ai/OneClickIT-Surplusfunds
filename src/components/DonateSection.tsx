'use client';

import { useState } from 'react';
import { Heart, CreditCard, Loader2 } from 'lucide-react';

const AMOUNTS = [5, 10, 25, 50, 100];

export default function DonateSection() {
  const [selected, setSelected] = useState(10);
  const [custom, setCustom] = useState('');
  const [loading, setLoading] = useState(false);

  const donationAmount = custom ? Number(custom) : selected;

  const handleStripe = async () => {
    if (!donationAmount || donationAmount < 1) return;
    setLoading(true);
    try {
      const res = await fetch('/api/stripe/donate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: donationAmount }),
      });
      const data = await res.json();
      if (data.data?.url) {
        window.location.href = data.data.url;
      }
    } catch {
      setLoading(false);
    }
  };

  return (
    <section className="border-t border-gray-200 bg-white px-4 py-16">
      <div className="mx-auto max-w-2xl text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-pink-100">
          <Heart className="h-7 w-7 text-pink-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">Help Keep the Core Directory Free</h2>
        <p className="mt-3 text-gray-500">
          SurplusClickIT keeps the core county directory free for everyone. Donations help cover
          server costs and ongoing data updates so researchers and claimants can access public
          records without barriers. Pro plans are available for professionals who need CSV exports,
          vetted data, and advanced tools.
        </p>

        {/* Amount selector */}
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {AMOUNTS.map((amt) => (
            <button
              key={amt}
              onClick={() => { setSelected(amt); setCustom(''); }}
              className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                !custom && selected === amt
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              ${amt}
            </button>
          ))}
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">$</span>
            <input
              type="number"
              min="1"
              max="1000"
              placeholder="Other"
              aria-label="Custom donation amount"
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              className="w-24 rounded-lg border border-gray-200 py-2 pl-7 pr-2 text-sm text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Payment buttons */}
        <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={handleStripe}
            disabled={loading || !donationAmount || donationAmount < 1}
            className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-6 py-3 text-sm font-semibold text-white shadow-md hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CreditCard className="h-4 w-4" />
            )}
            Donate ${donationAmount || '...'} with Card
          </button>

          <a
            href={`https://www.paypal.com/donate/?business=ritacsolutions%40gmail.com&amount=${donationAmount || 10}&no_recurring=0&currency_code=USD`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-[#0070ba] px-6 py-3 text-sm font-semibold text-white shadow-md hover:bg-[#005ea6] transition-colors"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.93 4.778-4.005 7.201-9.138 7.201h-2.19a.563.563 0 0 0-.556.479l-1.187 7.527h-.506l-.24 1.516a.56.56 0 0 0 .554.647h3.882c.46 0 .85-.334.922-.788.06-.26.76-4.852.816-5.09a.932.932 0 0 1 .923-.788h.58c3.76 0 6.705-1.528 7.565-5.946.36-1.847.174-3.388-.777-4.471z"/>
            </svg>
            Donate with PayPal
          </a>
        </div>

        <p className="mt-4 text-xs text-gray-400">Every dollar helps. Thank you for your support!</p>
      </div>
    </section>
  );
}
