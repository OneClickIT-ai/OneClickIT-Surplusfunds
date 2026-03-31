'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';

interface CountyData {
  id: string;
  rank: number;
  name: string;
  state: string;
  population: number;
  listUrl: string | null;
  source: string | null;
  notes: string | null;
  rulesText: string | null;
  claimDeadline: string | null;
}

export default function EditCountyPage() {
  const router = useRouter();
  const params = useParams();
  const [county, setCounty] = useState<CountyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch(`/api/counties/${params.id}`)
      .then(r => r.json())
      .then(d => { setCounty(d.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [params.id]);

  const handleSave = async () => {
    if (!county) return;
    setSaving(true);
    setMessage('');
    const res = await fetch(`/api/counties/${params.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(county),
    });
    if (res.ok) {
      setMessage('Saved!');
      setTimeout(() => router.push('/admin/counties'), 1000);
    } else {
      const data = await res.json();
      setMessage(data.error || 'Save failed');
    }
    setSaving(false);
  };

  if (loading) return <div className="p-8 text-center text-gray-400">Loading...</div>;
  if (!county) return <div className="p-8 text-center text-red-500">County not found</div>;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link href="/admin/counties" className="mb-6 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900">
        <ArrowLeft className="h-4 w-4" /> Back to counties
      </Link>

      <h1 className="mb-6 text-2xl font-bold text-gray-900">Edit: {county.name} County, {county.state}</h1>

      <Card>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="County Name" value={county.name} onChange={e => setCounty({ ...county, name: e.target.value })} />
            <Input label="State" value={county.state} onChange={e => setCounty({ ...county, state: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Rank" type="number" value={county.rank} onChange={e => setCounty({ ...county, rank: parseInt(e.target.value) || 0 })} />
            <Input label="Population" type="number" value={county.population} onChange={e => setCounty({ ...county, population: parseInt(e.target.value) || 0 })} />
          </div>
          <Input label="List URL" value={county.listUrl || ''} onChange={e => setCounty({ ...county, listUrl: e.target.value || null })} placeholder="https://county.gov/surplus-list" />
          <Input label="Source" value={county.source || ''} onChange={e => setCounty({ ...county, source: e.target.value || null })} placeholder="e.g. Treasurer-Tax Collector website" />
          <Input label="Claim Deadline" value={county.claimDeadline || ''} onChange={e => setCounty({ ...county, claimDeadline: e.target.value || null })} placeholder="e.g. 1 year from deed recording" />
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Claim Rules</label>
            <textarea
              rows={4}
              className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={county.rulesText || ''}
              onChange={e => setCounty({ ...county, rulesText: e.target.value || null })}
              placeholder="CA Rev & Tax Code §4675..."
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Notes</label>
            <textarea
              rows={3}
              className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={county.notes || ''}
              onChange={e => setCounty({ ...county, notes: e.target.value || null })}
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <Button onClick={handleSave} loading={saving}>
              <Save className="mr-1.5 h-4 w-4" /> Save Changes
            </Button>
            {message && (
              <span className={`text-sm ${message === 'Saved!' ? 'text-green-600' : 'text-red-600'}`}>{message}</span>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
