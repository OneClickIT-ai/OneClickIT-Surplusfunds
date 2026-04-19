"use client";

import { useCallback, useEffect, useState } from "react";

type LeadItem = {
  id: string;
  ownerName: string;
  propertyAddr: string | null;
  parcelId: string | null;
  surplusAmount: number | null;
  status: string;
  score: number;
  surplusType: string;
  county: { name: string; state: string };
  claim?: { id: string } | null;
};

export default function LeadsPage() {
  const [items, setItems] = useState<LeadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLeads = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/leads?limit=50", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load leads");
      setItems(json.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load leads");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadLeads();
  }, [loadLeads]);

  async function createCaseFromLead(lead: LeadItem) {
    const res = await fetch(`/api/v1/leads/${lead.id}/convert`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    if (res.ok) {
      const json = await res.json();
      window.location.href = `/cases/${json.data.id}`;
      return;
    }
    if (res.status === 409) {
      const json = await res.json();
      if (json.existingClaimId) {
        window.location.href = `/cases/${json.existingClaimId}`;
        return;
      }
    }
    await loadLeads();
  }

  if (loading) return <div className="p-6 text-sm text-zinc-500">Loading leads...</div>;
  if (error) return <div className="p-6 text-sm text-red-600">{error}</div>;

  return (
    <main className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Leads</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Ranked surplus-funds leads ready for review, skip tracing, and conversion.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        <table className="min-w-full divide-y divide-zinc-200 text-sm">
          <thead className="bg-zinc-50">
            <tr className="text-left text-xs uppercase tracking-wide text-zinc-500">
              <th className="px-4 py-3">Owner</th>
              <th className="px-4 py-3">County</th>
              <th className="px-4 py-3">Address</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Score</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {items.map((lead) => (
              <tr key={lead.id}>
                <td className="px-4 py-3">
                  <div className="font-medium">{lead.ownerName}</div>
                  <div className="text-xs text-zinc-500">
                    {lead.parcelId ?? "No parcel ID"}
                  </div>
                </td>
                <td className="px-4 py-3">
                  {lead.county.name}, {lead.county.state}
                </td>
                <td className="px-4 py-3">{lead.propertyAddr ?? "—"}</td>
                <td className="px-4 py-3">
                  {lead.surplusAmount != null
                    ? lead.surplusAmount.toLocaleString("en-US", {
                        style: "currency",
                        currency: "USD",
                      })
                    : "—"}
                </td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                    {lead.score}
                  </span>
                </td>
                <td className="px-4 py-3">{lead.status}</td>
                <td className="px-4 py-3">
                  {lead.claim?.id ? (
                    <a
                      href={`/cases/${lead.claim.id}`}
                      className="rounded-lg bg-black px-3 py-1.5 text-xs text-white"
                    >
                      Open Case
                    </a>
                  ) : (
                    <button
                      onClick={() => void createCaseFromLead(lead)}
                      className="rounded-lg border px-3 py-1.5 text-xs hover:bg-zinc-100"
                    >
                      Convert to Case
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {!items.length && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-sm text-zinc-500">
                  No leads yet. Run an ingest to populate this list.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
