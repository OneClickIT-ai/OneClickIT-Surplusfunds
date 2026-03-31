'use client';
import { useState, useEffect } from 'react';
import { ArrowLeft, RefreshCw, Check, X } from 'lucide-react';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';

interface County {
  id: string;
  name: string;
  state: string;
  listUrl: string | null;
  lastScraped: string | null;
}

interface ScrapeResult {
  countyId: string;
  status: 'pending' | 'success' | 'error';
  count?: number;
  error?: string;
}

export default function AdminScrapePage() {
  const [counties, setCounties] = useState<County[]>([]);
  const [scraping, setScraping] = useState<Record<string, boolean>>({});
  const [results, setResults] = useState<Record<string, ScrapeResult>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/counties?limit=100')
      .then(r => r.json())
      .then(d => { setCounties(d.data?.counties || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const scrapeCounty = async (county: County) => {
    setScraping(s => ({ ...s, [county.id]: true }));
    setResults(r => ({ ...r, [county.id]: { countyId: county.id, status: 'pending' } }));

    try {
      const res = await fetch(`/api/scrape/${county.id}`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setResults(r => ({
          ...r,
          [county.id]: { countyId: county.id, status: 'success', count: data.data?.count },
        }));
      } else {
        setResults(r => ({
          ...r,
          [county.id]: { countyId: county.id, status: 'error', error: data.error },
        }));
      }
    } catch {
      setResults(r => ({
        ...r,
        [county.id]: { countyId: county.id, status: 'error', error: 'Network error' },
      }));
    }
    setScraping(s => ({ ...s, [county.id]: false }));
  };

  const scrapableCounties = counties.filter(c => c.listUrl);

  const scrapeAll = async () => {
    for (const county of scrapableCounties) {
      await scrapeCounty(county);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-400">Loading counties...</div>;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <Link href="/admin" className="mb-6 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900">
        <ArrowLeft className="h-4 w-4" /> Back to admin
      </Link>

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Scrape Management</h1>
          <p className="text-sm text-gray-500">
            {scrapableCounties.length} counties with URLs / {counties.length} total
          </p>
        </div>
        <Button onClick={scrapeAll} variant="primary">
          <RefreshCw className="mr-1.5 h-4 w-4" /> Scrape All ({scrapableCounties.length})
        </Button>
      </div>

      <div className="space-y-2">
        {counties.map(county => {
          const result = results[county.id];
          const isScraping = scraping[county.id];

          return (
            <Card key={county.id} padding="sm" className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="font-medium text-gray-900">{county.name}, {county.state}</span>
                {county.listUrl ? (
                  <Badge variant="success">URL set</Badge>
                ) : (
                  <Badge variant="warning">No URL</Badge>
                )}
                {county.lastScraped && (
                  <span className="text-xs text-gray-400">
                    Last: {new Date(county.lastScraped).toLocaleDateString()}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                {result && (
                  <span className="flex items-center gap-1 text-sm">
                    {result.status === 'success' && (
                      <><Check className="h-4 w-4 text-green-500" /> {result.count} records</>
                    )}
                    {result.status === 'error' && (
                      <><X className="h-4 w-4 text-red-500" /> <span className="text-red-500 text-xs">{result.error}</span></>
                    )}
                    {result.status === 'pending' && (
                      <span className="text-gray-400 text-xs">Scraping...</span>
                    )}
                  </span>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => scrapeCounty(county)}
                  loading={isScraping}
                  disabled={!county.listUrl}
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
