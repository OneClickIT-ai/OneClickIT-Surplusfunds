'use client';
import { useState } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { Search, Users, MapPin, Phone, Mail, Lock, AtSign } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';

type ToolType = 'people' | 'username' | 'address' | 'phone' | 'email';

interface SearchResult {
  query: string;
  tool: string;
  results: Record<string, unknown>[];
  source: string;
}

const TOOLS = [
  { id: 'people' as ToolType, name: 'People Search', icon: Users, placeholder: 'Enter full name (e.g. John Smith)' },
  { id: 'username' as ToolType, name: 'Username Search', icon: AtSign, placeholder: 'Enter username (e.g. johndoe123)' },
  { id: 'address' as ToolType, name: 'Address Lookup', icon: MapPin, placeholder: 'Enter address (e.g. 123 Main St, City, ST)' },
  { id: 'phone' as ToolType, name: 'Phone Checker', icon: Phone, placeholder: 'Enter phone number (e.g. 555-123-4567)' },
  { id: 'email' as ToolType, name: 'Email Verify', icon: Mail, placeholder: 'Enter email address' },
];

export default function OsintPage() {
  const { data: session } = useSession();
  const [activeTool, setActiveTool] = useState<ToolType>('people');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [error, setError] = useState('');

  const isPro = session?.user?.role === 'pro' || session?.user?.role === 'admin';

  const handleSearch = async () => {
    if (!query.trim()) return;

    if (!session) {
      signIn(undefined, { callbackUrl: '/osint' });
      return;
    }

    if (!isPro) {
      setError('OSINT tools require a Pro subscription. Upgrade on the pricing page.');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch(`/api/osint/${activeTool}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult(data.data);
      } else {
        setError(data.error || 'Search failed');
      }
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const tool = TOOLS.find(t => t.id === activeTool)!;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">OSINT Tools</h1>
        <p className="text-sm text-gray-500">
          Public records lookup for asset recovery and skip tracing
        </p>
        {!isPro && session && (
          <div className="mt-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-700">
            <Lock className="inline h-4 w-4 mr-1" />
            OSINT tools are available with a Pro subscription.{' '}
            <a href="/pricing" className="font-medium underline">Upgrade now</a>
          </div>
        )}
      </div>

      {/* Tool selector */}
      <div className="mb-6 flex flex-wrap gap-2">
        {TOOLS.map(t => (
          <button
            key={t.id}
            onClick={() => { setActiveTool(t.id); setResult(null); setError(''); }}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              activeTool === t.id
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <t.icon className="h-4 w-4" />
            {t.name}
          </button>
        ))}
      </div>

      {/* Search input */}
      <Card className="mb-6">
        <div className="flex gap-3">
          <div className="flex-1">
            <Input
              placeholder={tool.placeholder}
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <Button onClick={handleSearch} loading={loading} disabled={!isPro && !!session}>
            <Search className="mr-1.5 h-4 w-4" />
            Search
          </Button>
        </div>
      </Card>

      {/* Error */}
      {error && (
        <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</div>
      )}

      {/* Results */}
      {result && (
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Results for &ldquo;{result.query}&rdquo;</h3>
            <Badge variant="info">{result.source}</Badge>
          </div>

          {result.results.length > 0 ? (
            <div className="space-y-3">
              {result.results.map((r, i) => (
                <div key={i} className="rounded-lg border border-gray-100 p-3 text-sm">
                  {Object.entries(r).map(([key, value]) => (
                    <div key={key} className="flex gap-2 py-0.5">
                      <span className="font-medium text-gray-500 capitalize min-w-[100px]">
                        {key.replace(/_/g, ' ')}:
                      </span>
                      <span className="text-gray-900">{String(value || '—')}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">No results found for this query.</p>
          )}
        </Card>
      )}

      {/* Disclaimer */}
      <p className="mt-6 text-center text-xs text-gray-400">
        OSINT tools use publicly available data only. Results may not be current or complete.
        Users are responsible for verifying information and complying with applicable laws.
      </p>
    </div>
  );
}
