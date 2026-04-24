import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'Privacy Policy for SurplusClickIT — how we collect, use, and protect your data when you use our surplus funds research tools.',
  alternates: { canonical: '/privacy' },
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
      <p className="text-sm text-gray-400 mb-8">Last updated: April 4, 2026</p>

      <div className="prose prose-gray max-w-none space-y-6 text-gray-700 text-sm leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">1. Who We Are</h2>
          <p>
            SurplusClickIT is operated by OneClickIT (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or
            &ldquo;our&rdquo;). This Privacy Policy explains how we collect, use, store, and protect
            your information when you use our website at surplusclickit.com and any related services.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">2. Information We Collect</h2>

          <h3 className="text-base font-medium text-gray-800 mt-3 mb-1">Account Information</h3>
          <p>
            When you create an account we collect your email address, which you provide when
            requesting a magic link sign-in. We store this to manage your account and personalize
            your experience.
          </p>

          <h3 className="text-base font-medium text-gray-800 mt-3 mb-1">Usage Data</h3>
          <p>
            We automatically collect information about how you interact with the Service, including
            pages visited, features used, search queries, IP address, browser type, device
            information, and timestamps. This data helps us improve the Service and monitor for abuse.
          </p>

          <h3 className="text-base font-medium text-gray-800 mt-3 mb-1">Payment Information</h3>
          <p>
            If you subscribe to a Pro plan or make a donation, payment is processed by Stripe. We do
            not store your credit card number or bank details. Stripe&apos;s privacy practices are
            governed by their own{' '}
            <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
              Privacy Policy
            </a>.
          </p>

          <h3 className="text-base font-medium text-gray-800 mt-3 mb-1">Claims Data</h3>
          <p>
            Information you enter into the Claims Tracker (county names, owner names, property
            addresses, claim amounts, notes) is stored in our database and associated with your
            account. This data is private to your account and not shared with other users.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">3. How We Use Your Information</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>To provide and maintain the Service, including account management and claims tracking.</li>
            <li>To process payments and donations.</li>
            <li>To improve the Service, analyze usage patterns, and fix bugs.</li>
            <li>To enforce our Terms of Service and protect against misuse.</li>
            <li>To communicate with you about your account, billing, or Service updates.</li>
            <li>To comply with legal obligations.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">4. Information Sharing</h2>
          <p>We do not sell your personal information. We may share data with:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li><strong>Stripe</strong> &mdash; for payment processing.</li>
            <li><strong>Resend</strong> &mdash; for sending magic link authentication emails.</li>
            <li><strong>Vercel</strong> &mdash; our hosting provider, which processes server requests.</li>
            <li><strong>Law enforcement</strong> &mdash; if required by law or valid legal process.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">5. Cookies and Tracking</h2>
          <p>
            We use essential cookies to manage your session and authentication state. We may use
            analytics tools to understand aggregate usage patterns. We do not use third-party
            advertising cookies or trackers.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">6. Data Security</h2>
          <p>
            We use industry-standard security measures including HTTPS encryption, secure database
            hosting (Vercel Postgres), and passwordless email-based authentication. However, no
            method of transmission over the internet is 100% secure. We cannot guarantee absolute
            security of your data.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">7. Data Retention</h2>
          <p>
            We retain your account information and claims data for as long as your account is active.
            If you delete your account, we will remove your personal data within 30 days, except
            where retention is required by law or for legitimate business purposes (e.g., payment
            records for tax compliance).
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">8. Your Rights</h2>
          <p>Depending on your jurisdiction, you may have the right to:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Access the personal data we hold about you.</li>
            <li>Request correction of inaccurate data.</li>
            <li>Request deletion of your data.</li>
            <li>Object to or restrict certain processing of your data.</li>
            <li>Request a portable copy of your data.</li>
          </ul>
          <p className="mt-2">
            To exercise these rights, contact us at{' '}
            <a href="mailto:ritacsolutions@gmail.com" className="text-blue-600 hover:underline">
              ritacsolutions@gmail.com
            </a>.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">9. Children&apos;s Privacy</h2>
          <p>
            The Service is not intended for individuals under the age of 18. We do not knowingly
            collect personal information from children. If we become aware that we have collected data
            from a child, we will delete it promptly.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">10. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy periodically. We will post the revised version on this
            page with an updated &ldquo;Last updated&rdquo; date. Continued use of the Service after
            changes constitutes acceptance.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">11. Contact</h2>
          <p>
            For privacy-related questions or requests, contact us at{' '}
            <a href="mailto:ritacsolutions@gmail.com" className="text-blue-600 hover:underline">
              ritacsolutions@gmail.com
            </a>.
          </p>
        </section>
      </div>

      <div className="mt-10 border-t border-gray-200 pt-6 flex gap-4 text-sm">
        <Link href="/terms" className="text-blue-600 hover:underline">Terms of Service</Link>
        <Link href="/about" className="text-blue-600 hover:underline">About</Link>
        <Link href="/faq" className="text-blue-600 hover:underline">FAQ</Link>
      </div>
    </div>
  );
}
