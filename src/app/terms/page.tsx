import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description:
    'Terms of Service for SurplusClickIT — rules governing your use of our surplus funds research tools and county directory.',
  alternates: { canonical: '/terms' },
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Service</h1>
      <p className="text-sm text-gray-400 mb-8">Last updated: April 4, 2026</p>

      <div className="prose prose-gray max-w-none space-y-6 text-gray-700 text-sm leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">1. Acceptance of Terms</h2>
          <p>
            By accessing or using SurplusClickIT (&ldquo;the Service&rdquo;), operated by OneClickIT
            (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;), you agree to be bound by
            these Terms of Service. If you do not agree, do not use the Service.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">2. Description of Service</h2>
          <p>
            SurplusClickIT provides informational access to publicly available surplus funds data,
            county directory listings, OSINT lookup tools, claims tracking, and educational resources
            for asset recovery professionals. The Service is not affiliated with any government
            agency and does not file claims on your behalf.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">3. Informational Purposes Only</h2>
          <p>
            All data, tools, and content on this site are provided for informational and research
            purposes only. Nothing on SurplusClickIT constitutes legal, tax, financial, or
            professional advice. You are solely responsible for verifying all information with
            official government sources and for complying with applicable federal, state, and local
            laws when filing surplus funds claims.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">4. User Accounts</h2>
          <p>
            You may create a free account using Google OAuth. You are responsible for maintaining the
            security of your account credentials. You agree not to share your account or use another
            person&apos;s account without permission.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">5. Free and Paid Tiers</h2>
          <p>
            The core county directory and basic tools are free to use. Pro plans provide additional
            features including CSV exports, unlimited county views, vetted data access, and priority
            alerts. Paid subscriptions are processed through Stripe and may be cancelled at any time.
            Refunds are handled on a case-by-case basis.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">6. Acceptable Use</h2>
          <p>You agree not to:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Use the Service for any unlawful purpose or in violation of any applicable law.</li>
            <li>Scrape, crawl, or use automated tools to extract data at scale without prior written consent.</li>
            <li>Attempt to gain unauthorized access to any part of the Service or its infrastructure.</li>
            <li>Interfere with the proper functioning of the Service or impose unreasonable load on our systems.</li>
            <li>Use OSINT tools to harass, stalk, or otherwise harm any individual.</li>
            <li>Misrepresent your identity or impersonate others when using the Service.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">7. Data Accuracy</h2>
          <p>
            We aggregate data from publicly available county and state sources. While we strive for
            accuracy, we make no guarantees that any data is complete, current, or error-free.
            County records change frequently. Always verify information directly with the relevant
            county or state office before taking action.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">8. OSINT and Third-Party Tools</h2>
          <p>
            OSINT tools and third-party lookup links provided on this site access publicly available
            data from external services. We do not control, endorse, or guarantee the accuracy of
            results from these external sources. You are responsible for using these tools in
            compliance with all applicable laws and each service&apos;s own terms of use.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">9. Intellectual Property</h2>
          <p>
            The SurplusClickIT name, logo, and original content are the property of OneClickIT. You
            may not reproduce, distribute, or create derivative works from our proprietary content
            without permission. Public records data aggregated on the site remains in the public
            domain.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">10. Limitation of Liability</h2>
          <p>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, ONECLICKIT AND ITS AFFILIATES SHALL NOT BE
            LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES,
            INCLUDING LOSS OF PROFITS, REVENUE, DATA, OR BUSINESS OPPORTUNITIES, ARISING FROM YOUR
            USE OF THE SERVICE. OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT YOU PAID US IN THE
            TWELVE MONTHS PRECEDING THE CLAIM, OR $100, WHICHEVER IS GREATER.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">11. Disclaimer of Warranties</h2>
          <p>
            THE SERVICE IS PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo; WITHOUT
            WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO MERCHANTABILITY,
            FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">12. Modifications</h2>
          <p>
            We may update these Terms at any time. Continued use of the Service after changes
            constitutes acceptance of the revised Terms. Material changes will be communicated via
            the site or email.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">13. Termination</h2>
          <p>
            We reserve the right to suspend or terminate your access to the Service at any time for
            violation of these Terms or for any other reason at our sole discretion.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">14. Contact</h2>
          <p>
            For questions about these Terms, contact us at{' '}
            <a href="mailto:ritacsolutions@gmail.com" className="text-blue-600 hover:underline">
              ritacsolutions@gmail.com
            </a>.
          </p>
        </section>
      </div>

      <div className="mt-10 border-t border-gray-200 pt-6 flex gap-4 text-sm">
        <Link href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link>
        <Link href="/about" className="text-blue-600 hover:underline">About</Link>
        <Link href="/faq" className="text-blue-600 hover:underline">FAQ</Link>
      </div>
    </div>
  );
}
