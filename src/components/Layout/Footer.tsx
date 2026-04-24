import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-gray-50">
      {/* Partner spotlight — SleekGemsHall */}
      <div className="bg-emerald-600 px-4 py-3 text-center text-sm text-white">
        <span className="font-semibold">Partner Spotlight:</span>{' '}
        <a
          href="https://sleekgemshall.shop/"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-emerald-100 font-medium"
        >
          SleekGemsHall
        </a>
        {' '}— Curated gems &amp; jewelry for every occasion.{' '}
        <Link href="/partners" className="underline hover:text-emerald-100">
          Learn more →
        </Link>
      </div>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Image src="/surplusfunds_favicon.png" alt="SF" width={20} height={20} className="h-5 w-5" />
            <span>Surplus Funds by OneClickIT</span>
          </div>
          <div className="flex gap-4 text-sm text-gray-500">
            <Link href="/directory" className="hover:text-gray-900">Directory</Link>
            <Link href="/dashboard" className="hover:text-gray-900">Dashboard</Link>
            <span>© {new Date().getFullYear()} OneClickIT</span>
          </div>
        </div>
        <p className="mt-4 text-center text-xs text-gray-400">
          Data sourced from publicly available county records. For informational purposes only.
          Users are responsible for verifying claims and complying with local laws.
        </p>
      </div>
    </footer>
  );
}
