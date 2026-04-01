'use client';
import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { ArrowLeft, Send, Clock, FileText, MessageSquare, UserCheck, AlertTriangle } from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';

interface ClaimActivity {
  id: string;
  type: string;
  message: string;
  createdAt: string;
}

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
  activities: ClaimActivity[];
}

const STATUS_OPTIONS = [
  { value: 'research', label: 'Research' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'docs_gathering', label: 'Docs Gathering' },
  { value: 'filed', label: 'Filed' },
  { value: 'approved', label: 'Approved' },
  { value: 'paid', label: 'Paid' },
  { value: 'denied', label: 'Denied' },
];

const ACTIVITY_ICONS: Record<string, React.ReactNode> = {
  note: <MessageSquare className="h-4 w-4 text-gray-400" />,
  status_change: <Clock className="h-4 w-4 text-blue-400" />,
  document: <FileText className="h-4 w-4 text-green-400" />,
  contact: <UserCheck className="h-4 w-4 text-purple-400" />,
  filing: <Send className="h-4 w-4 text-orange-400" />,
};

export default function ClaimDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [claim, setClaim] = useState<Claim | null>(null);
  const [loading, setLoading] = useState(true);
  const [activityMsg, setActivityMsg] = useState('');
  const [activityType, setActivityType] = useState('note');
  const [saving, setSaving] = useState(false);

  const fetchClaim = async () => {
    const res = await fetch(`/api/claims/${id}`);
    const data = await res.json();
    if (res.ok) setClaim(data.data);
    setLoading(false);
  };

  useEffect(() => { fetchClaim(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateField = async (field: string, value: string) => {
    await fetch(`/api/claims/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: value }),
    });
    fetchClaim();
  };

  const addActivity = async () => {
    if (!activityMsg.trim()) return;
    setSaving(true);
    await fetch(`/api/claims/${id}/activity`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: activityType, message: activityMsg }),
    });
    setActivityMsg('');
    fetchClaim();
    setSaving(false);
  };

  if (loading) return <div className="py-12 text-center text-sm text-gray-400">Loading...</div>;
  if (!claim) return <div className="py-12 text-center text-sm text-red-500">Claim not found</div>;

  const daysLeft = claim.deadlineDate ? Math.ceil((new Date(claim.deadlineDate).getTime() - Date.now()) / 86400000) : null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <Link href="/claims" className="mb-4 inline-flex items-center gap-1 text-sm text-blue-600 hover:underline">
        <ArrowLeft className="h-4 w-4" /> Back to Claims
      </Link>

      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{claim.ownerName}</h1>
          <p className="text-sm text-gray-500">{claim.countyName} County, {claim.state}</p>
        </div>
        <Badge variant={claim.priority === 'high' ? 'error' : claim.priority === 'medium' ? 'warning' : 'default'}>
          {claim.priority} priority
        </Badge>
      </div>

      {/* Deadline warning */}
      {daysLeft !== null && daysLeft < 30 && daysLeft > 0 && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-orange-50 px-4 py-3 text-sm text-orange-700">
          <AlertTriangle className="h-4 w-4" />
          <span>Deadline in {daysLeft} days ({new Date(claim.deadlineDate!).toLocaleDateString()})</span>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main info */}
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <h3 className="mb-3 font-semibold text-gray-900">Claim Details</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-medium text-gray-500">Status</label>
                <select
                  value={claim.status}
                  onChange={e => updateField('status', e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                >
                  {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">Amount</label>
                <div className="mt-1 text-lg font-bold text-gray-900">
                  {claim.amount ? `$${claim.amount.toLocaleString()}` : 'Not set'}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">Property Address</label>
                <div className="mt-1 text-sm text-gray-700">{claim.propertyAddr || '—'}</div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">Parcel ID</label>
                <div className="mt-1 text-sm text-gray-700">{claim.parcelId || '—'}</div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">Filed Date</label>
                <div className="mt-1 text-sm text-gray-700">{claim.filedDate ? new Date(claim.filedDate).toLocaleDateString() : '—'}</div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">Deadline</label>
                <div className="mt-1 text-sm text-gray-700">{claim.deadlineDate ? new Date(claim.deadlineDate).toLocaleDateString() : '—'}</div>
              </div>
            </div>
            {claim.notes && (
              <div className="mt-4 rounded-lg bg-gray-50 p-3 text-sm text-gray-600">{claim.notes}</div>
            )}
          </Card>

          {/* Activity log */}
          <Card>
            <h3 className="mb-3 font-semibold text-gray-900">Activity Log</h3>
            <div className="mb-4 flex gap-2">
              <Select value={activityType} onChange={e => setActivityType(e.target.value)}>
                <option value="note">Note</option>
                <option value="contact">Contact</option>
                <option value="document">Document</option>
                <option value="filing">Filing</option>
              </Select>
              <div className="flex-1">
                <Input
                  placeholder="Add activity note..."
                  value={activityMsg}
                  onChange={e => setActivityMsg(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addActivity()}
                />
              </div>
              <Button onClick={addActivity} loading={saving} size="sm">Add</Button>
            </div>

            {claim.activities.length > 0 ? (
              <div className="space-y-3">
                {claim.activities.map(a => (
                  <div key={a.id} className="flex gap-3 border-l-2 border-gray-100 pl-3">
                    {ACTIVITY_ICONS[a.type] || ACTIVITY_ICONS.note}
                    <div className="flex-1">
                      <p className="text-sm text-gray-700">{a.message}</p>
                      <p className="text-xs text-gray-400">{new Date(a.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">No activity yet.</p>
            )}
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <h3 className="mb-3 font-semibold text-gray-900">Quick Actions</h3>
            <div className="space-y-2">
              <Link href={`/requirements?state=${claim.state}`} className="block rounded-lg border border-gray-200 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50">
                View {claim.state} Requirements
              </Link>
              <Link href={`/calculator?state=${claim.state}&amount=${claim.amount || ''}`} className="block rounded-lg border border-gray-200 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50">
                Calculate Fees
              </Link>
              <Link href="/templates" className="block rounded-lg border border-gray-200 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50">
                Claim Letter Templates
              </Link>
            </div>
          </Card>

          <Card>
            <h3 className="mb-3 font-semibold text-gray-900">Timeline</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <div>Created: {new Date(claim.createdAt).toLocaleDateString()}</div>
              <div>Updated: {new Date(claim.updatedAt).toLocaleDateString()}</div>
              {claim.filedDate && <div>Filed: {new Date(claim.filedDate).toLocaleDateString()}</div>}
              {claim.paidDate && <div>Paid: {new Date(claim.paidDate).toLocaleDateString()}</div>}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
