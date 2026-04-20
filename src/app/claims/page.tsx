'use client';
import { useState, useEffect, useCallback } from 'react';
import { useSession } from '@/lib/auth-client';
import Link from 'next/link';
import { Plus, ArrowRight, AlertTriangle, FileSearch, LogIn } from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Select from '@/components/ui/Select';
import Input from '@/components/ui/Input';
import PlacesAutocomplete from '@/components/ui/PlacesAutocomplete';
import { US_STATES } from '@/lib/constants';

interface Claim {
  id: string;
  countyName: string;
  state: string;
  ownerName: string;
  propertyAddr: string | null;
  parcelId: string | null;
  amount: number | null;
  status: string;
  priority: string;
  notes: string | null;
  filedDate: string | null;
  deadlineDate: string | null;
  paidDate: string | null;
  paidAmount: number | null;
  createdAt: string;
  updatedAt: string;
}

const STATUS_OPTIONS = [
  { value: 'research', label: 'Research', color: 'bg-gray-100 text-gray-700' },
  { value: 'contacted', label: 'Contacted', color: 'bg-blue-100 text-blue-700' },
  { value: 'docs_gathering', label: 'Docs Gathering', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'filed', label: 'Filed', color: 'bg-purple-100 text-purple-700' },
  { value: 'approved', label: 'Approved', color: 'bg-green-100 text-green-700' },
  { value: 'paid', label: 'Paid', color: 'bg-green-200 text-green-800' },
  { value: 'denied', label: 'Denied', color: 'bg-red-100 text-red-700' },
];

export default function ClaimsPage() {
  const { data: session, status: authStatus } = useSession();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterState, setFilterState] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    countyName: '', state: '', ownerName: '', propertyAddr: '', parcelId: '', amount: '', deadlineDate: '', notes: '', priority: 'medium',
  });
  const [saving, setSaving] = useState(false);

  const fetchClaims = useCallback(async () => {
    if (!session) { setLoading(false); return; }
    const params = new URLSearchParams();
    if (filterStatus) params.set('status', filterStatus);
    if (filterState) params.set('state', filterState);
    const res = await fetch(`/api/claims?${params}`);
    const data = await res.json();
    if (res.ok) setClaims(data.data);
    setLoading(false);
  }, [filterStatus, filterState, session]);

  useEffect(() => { fetchClaims(); }, [fetchClaims]);

  const handleCreate = async () => {
    if (!form.countyName || !form.state || !form.ownerName) return;
    setSaving(true);
    const res = await fetch('/api/claims', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setShowCreate(false);
      setForm({ countyName: '', state: '', ownerName: '', propertyAddr: '', parcelId: '', amount: '', deadlineDate: '', notes: '', priority: 'medium' });
      fetchClaims();
    }
    setSaving(false);
  };

  const updateStatus = async (id: string, status: string) => {
    await fetch(`/api/claims/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    fetchClaims();
  };

  const deleteClaim = async (id: string) => {
    if (!confirm('Delete this claim?')) return;
    await fetch(`/api/claims/${id}`, { method: 'DELETE' });
    fetchClaims();
  };

  const statusOption = (s: string) => STATUS_OPTIONS.find(o => o.value === s);
  const totalAmount = claims.reduce((sum, c) => sum + (c.amount || 0), 0);
  const paidAmount = claims.filter(c => c.status === 'paid').reduce((sum, c) => sum + (c.paidAmount || c.amount || 0), 0);
  const urgentCount = claims.filter(c => {
    if (!c.deadlineDate) return false;
    const days = (new Date(c.deadlineDate).getTime() - Date.now()) / 86400000;
    return days < 30 && days > 0 && c.status !== 'paid' && c.status !== 'denied';
  }).length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Claim Tracker</h1>
          <p className="text-sm text-gray-500">Keep all your surplus funds cases organized &mdash; add counties, owners, filing dates, and notes so nothing slips through the cracks.</p>
        </div>
        <Button onClick={() => setShowCreate(!showCreate)}>
          <Plus className="mr-1.5 h-4 w-4" />
          New Claim
        </Button>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card padding="sm">
          <div className="text-2xl font-bold text-blue-600">{claims.length}</div>
          <div className="text-xs text-gray-500">Total Claims</div>
        </Card>
        <Card padding="sm">
          <div className="text-2xl font-bold text-green-600">${totalAmount.toLocaleString()}</div>
          <div className="text-xs text-gray-500">Pipeline Value</div>
        </Card>
        <Card padding="sm">
          <div className="text-2xl font-bold text-green-700">${paidAmount.toLocaleString()}</div>
          <div className="text-xs text-gray-500">Recovered</div>
        </Card>
        <Card padding="sm">
          <div className="text-2xl font-bold text-orange-600">{urgentCount}</div>
          <div className="text-xs text-gray-500">Deadlines &lt;30d</div>
        </Card>
      </div>

      {/* Create form */}
      {showCreate && (
        <Card className="mb-6">
          <h3 className="mb-4 font-semibold text-gray-900">Add New Claim</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Input label="Owner Name *" value={form.ownerName} onChange={e => setForm(f => ({ ...f, ownerName: e.target.value }))} placeholder="John Smith" />
            <Input label="County Name *" value={form.countyName} onChange={e => setForm(f => ({ ...f, countyName: e.target.value }))} placeholder="Los Angeles" />
            <Select label="State *" value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))}>
              <option value="">Select state</option>
              {US_STATES.map(s => <option key={s.code} value={s.code}>{s.code} - {s.name}</option>)}
            </Select>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Property Address</label>
              <PlacesAutocomplete
                placeholder="123 Main St, City, ST"
                value={form.propertyAddr}
                onChange={v => setForm(f => ({ ...f, propertyAddr: v }))}
              />
            </div>
            <Input label="Parcel ID" value={form.parcelId} onChange={e => setForm(f => ({ ...f, parcelId: e.target.value }))} placeholder="APN / Parcel #" />
            <Input label="Amount ($)" type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="5000" />
            <Input label="Deadline Date" type="date" value={form.deadlineDate} onChange={e => setForm(f => ({ ...f, deadlineDate: e.target.value }))} />
            <Select label="Priority" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </Select>
          </div>
          <div className="mt-4">
            <Input label="Notes" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Additional notes..." />
          </div>
          <div className="mt-4 flex gap-2">
            <Button onClick={handleCreate} loading={saving}>Create Claim</Button>
            <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
          </div>
        </Card>
      )}

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-3">
        <Select aria-label="Filter by status" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
        </Select>
        <Select aria-label="Filter by state" value={filterState} onChange={e => setFilterState(e.target.value)}>
          <option value="">All states</option>
          {US_STATES.map(s => <option key={s.code} value={s.code}>{s.code}</option>)}
        </Select>
      </div>

      {/* Claims table */}
      {loading ? (
        <div className="py-12 text-center text-sm text-gray-400">Loading claims...</div>
      ) : !session && authStatus !== 'loading' ? (
        <Card className="py-12 text-center">
          <LogIn className="mx-auto mb-3 h-8 w-8 text-gray-300" />
          <p className="text-sm text-gray-500 mb-3">Sign in to track and manage your surplus funds claims.</p>
          <Link
            href="/sign-in"
            className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
          >
            <LogIn className="h-4 w-4" />
            Sign in to get started
          </Link>
        </Card>
      ) : claims.length === 0 ? (
        <Card className="py-12 text-center">
          <FileSearch className="mx-auto mb-3 h-8 w-8 text-gray-300" />
          <p className="text-sm text-gray-500">No claims yet. Click &ldquo;New Claim&rdquo; to start tracking.</p>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Owner</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">County</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Amount</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Status</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Deadline</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {claims.map(claim => {
                const so = statusOption(claim.status);
                const daysLeft = claim.deadlineDate ? Math.ceil((new Date(claim.deadlineDate).getTime() - Date.now()) / 86400000) : null;
                return (
                  <tr key={claim.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">
                      <div className="font-medium text-gray-900">{claim.ownerName}</div>
                      {claim.propertyAddr && <div className="text-xs text-gray-400">{claim.propertyAddr}</div>}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{claim.countyName}, {claim.state}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {claim.amount ? `$${claim.amount.toLocaleString()}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <select
                        value={claim.status}
                        onChange={e => updateStatus(claim.id, e.target.value)}
                        aria-label={`Change status for ${claim.ownerName}`}
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${so?.color || ''}`}
                      >
                        {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {claim.deadlineDate ? (
                        <div className="flex items-center gap-1">
                          {daysLeft !== null && daysLeft < 30 && daysLeft > 0 && (
                            <AlertTriangle className="h-3.5 w-3.5 text-orange-500" />
                          )}
                          <span className={daysLeft !== null && daysLeft < 30 && daysLeft > 0 ? 'text-orange-600 font-medium' : 'text-gray-600'}>
                            {new Date(claim.deadlineDate).toLocaleDateString()}
                          </span>
                          {daysLeft !== null && daysLeft > 0 && (
                            <span className="text-xs text-gray-400">({daysLeft}d)</span>
                          )}
                        </div>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-1">
                        <Link href={`/claims/${claim.id}`} className="text-blue-600 hover:underline text-xs flex items-center gap-0.5">
                          Details <ArrowRight className="h-3 w-3" />
                        </Link>
                        <button onClick={() => deleteClaim(claim.id)} className="ml-2 text-xs text-red-400 hover:text-red-600">
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
