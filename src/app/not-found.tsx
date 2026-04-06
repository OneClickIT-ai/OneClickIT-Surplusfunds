import Link from 'next/link';
import { Search, Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="text-center">
        <div className="mb-4 text-6xl font-bold text-gray-200">404</div>
        <h1 className="mb-2 text-2xl font-bold text-gray-900">Page Not Found</h1>
        <p className="mb-8 text-sm text-gray-500">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Home className="h-4 w-4" />
            Go Home
          </Link>
          <Link
            href="/directory"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <Search className="h-4 w-4" />
            Browse Directory
          </Link>
        </div>
        <div className="mt-6">
          <Link href="/" className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600">
            <ArrowLeft className="h-3 w-3" />
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
