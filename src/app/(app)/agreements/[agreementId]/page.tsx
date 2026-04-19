"use client";

import { useCallback, useEffect, useState } from "react";

type Agreement = {
  id: string;
  type: "ENGAGEMENT" | "ASSIGNMENT" | "FEE_DISCLOSURE";
  status: "DRAFT" | "SENT" | "VIEWED" | "SIGNED" | "DECLINED" | "EXPIRED";
  feePercent: number | null;
  renderedText: string | null;
  eSignUrl: string | null;
  eSignProvider: string | null;
  sentAt: string | null;
  viewedAt: string | null;
  signedAt: string | null;
  createdAt: string;
  claim: {
    id: string;
    ownerName: string;
    countyName: string;
    state: string;
  };
  claimant?: {
    id: string;
    fullName: string;
    email: string | null;
    phone: string | null;
  } | null;
};

export default function AgreementDetailPage({
  params,
}: {
  params: { agreementId: string };
}) {
  const { agreementId } = params;
  const [ag, setAg] = useState<Agreement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/agreements/${agreementId}`, {
        cache: "no-store",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load");
      setAg(json.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [agreementId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function doSend() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/agreements/${agreementId}/send`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Send failed");
      setAg(json.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Send failed");
    } finally {
      setBusy(false);
    }
  }

  async function doMarkSigned() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/agreements/${agreementId}/sign`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Mark signed failed");
      setAg(json.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Mark signed failed");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <div className="p-6 text-sm text-zinc-500">Loading…</div>;
  if (!ag) return <div className="p-6 text-sm text-red-600">{error ?? "Not found"}</div>;

  const canSend = ag.status === "DRAFT";
  const canMarkSigned = ag.status !== "SIGNED" && ag.status !== "DECLINED";

  return (
    <main className="p-6 space-y-6 max-w-4xl">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{ag.type}</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Case:{" "}
            <a href={`/cases/${ag.claim.id}`} className="text-blue-700 hover:underline">
              {ag.claim.ownerName}
            </a>{" "}
            ({ag.claim.countyName}, {ag.claim.state})
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            Created {new Date(ag.createdAt).toLocaleString()}
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-4 shadow-sm text-sm space-y-2 min-w-[220px]">
          <div>Status: <strong>{ag.status}</strong></div>
          <div>Fee: <strong>{ag.feePercent != null ? `${ag.feePercent}%` : "—"}</strong></div>
          {ag.sentAt && <div className="text-xs text-zinc-500">Sent: {new Date(ag.sentAt).toLocaleString()}</div>}
          {ag.signedAt && <div className="text-xs text-emerald-700">Signed: {new Date(ag.signedAt).toLocaleString()}</div>}
        </div>
      </header>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="rounded-2xl border bg-white p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => void doSend()}
            disabled={busy || !canSend}
            className="rounded-lg bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            {busy ? "Working…" : "Send for signature"}
          </button>
          <button
            onClick={() => void doMarkSigned()}
            disabled={busy || !canMarkSigned}
            className="rounded-lg border px-4 py-2 text-sm hover:bg-zinc-50 disabled:opacity-50"
          >
            Mark signed (admin)
          </button>
          <a
            href={`/api/v1/agreements/${ag.id}/pdf`}
            target="_blank"
            rel="noreferrer"
            className="rounded-lg border px-4 py-2 text-sm hover:bg-zinc-50"
          >
            Download document
          </a>
          {ag.eSignUrl && (
            <a
              href={ag.eSignUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border px-4 py-2 text-sm hover:bg-zinc-50"
            >
              Open signing link
            </a>
          )}
        </div>

        <div>
          <h2 className="text-sm font-medium text-zinc-600 mb-2">Claimant</h2>
          <div className="text-sm">
            {ag.claimant ? (
              <>
                <div>{ag.claimant.fullName}</div>
                {ag.claimant.email && <div className="text-zinc-500">{ag.claimant.email}</div>}
                {ag.claimant.phone && <div className="text-zinc-500">{ag.claimant.phone}</div>}
              </>
            ) : (
              <span className="text-zinc-500">No claimant linked.</span>
            )}
          </div>
        </div>

        <div>
          <h2 className="text-sm font-medium text-zinc-600 mb-2">Rendered text</h2>
          <pre className="whitespace-pre-wrap rounded-lg border bg-zinc-50 p-4 text-xs font-mono">
            {ag.renderedText ?? "(no text rendered)"}
          </pre>
        </div>
      </section>
    </main>
  );
}
