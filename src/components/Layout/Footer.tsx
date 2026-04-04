import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-gray-50" role="contentinfo">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Image src="/surplusfunds_favicon.png" alt="SF" width={24} height={24} className="h-6 w-6" />
              <span className="font-semibold text-gray-900">SurplusClickIT</span>
            </div>
            <p className="text-sm text-gray-500">
              Free surplus funds research tools for asset recovery professionals.
            </p>
          </div>

          {/* Tools */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-gray-900">Tools</h3>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><Link href="/directory" className="hover:text-gray-900">County Directory</Link></li>
              <li><Link href="/osint" className="hover:text-gray-900">OSINT Tools</Link></li>
              <li><Link href="/claims" className="hover:text-gray-900">Claims Tracker</Link></li>
              <li><Link href="/lookup" className="hover:text-gray-900">Third-Party Lookup</Link></li>
              <li><Link href="/unclaimed" className="hover:text-gray-900">Unclaimed Property</Link></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-gray-900">Resources</h3>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><Link href="/learn" className="hover:text-gray-900">Learning Center</Link></li>
              <li><Link href="/templates" className="hover:text-gray-900">Claim Templates</Link></li>
              <li><Link href="/calculator" className="hover:text-gray-900">Calculator</Link></li>
              <li><Link href="/requirements" className="hover:text-gray-900">Requirements by State</Link></li>
              <li><Link href="/dorks" className="hover:text-gray-900">Google Dorks</Link></li>
              <li><Link href="/export" className="hover:text-gray-900">Export Data</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="mb-3 text-sm font-semibold text-gray-900">Company</h3>
            <ul className="space-y-2 text-sm text-gray-500">
              <li><Link href="/about" className="hover:text-gray-900">About</Link></li>
              <li><Link href="/contact" className="hover:text-gray-900">Contact</Link></li>
              <li><Link href="/faq" className="hover:text-gray-900">FAQ</Link></li>
              <li><Link href="/partners" className="hover:text-gray-900">Partners</Link></li>
              <li><Link href="/pricing" className="hover:text-gray-900">Pricing</Link></li>
              <li><Link href="/terms" className="hover:text-gray-900">Terms of Service</Link></li>
              <li><Link href="/privacy" className="hover:text-gray-900">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-gray-200 pt-6">
          <p className="text-center text-xs text-gray-400">
            Data sourced from publicly available county records. For informational purposes only.
            Users are responsible for verifying claims and complying with local laws.
          </p>
          <p className="mt-2 text-center text-xs text-gray-400">
            &copy; {new Date().getFullYear()} OneClickIT. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
