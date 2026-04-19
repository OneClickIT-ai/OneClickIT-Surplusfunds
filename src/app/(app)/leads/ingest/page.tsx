"use client";

import { useEffect, useMemo, useState } from "react";
import Papa from "papaparse";

type County = { id: string; name: string; state: string };

type IngestItem = {
  ownerName?: string;
  parcelId?: string | null;
  propertyAddr?: string | null;
  surplusAmount?: string | number | null;
  saleDate?: string | null;
  deadlineDate?: string | null;
  surplusType?: "TAX_SALE" | "FORECLOSURE" | "MORTGAGE" | "HOA" | "OTHER";
  claimantPhone?: string | null;
  claimantEmail?: string | null;
  notes?: string | null;
};

type IngestResult = {
  success: boolean;
  batchId: string | null;
  summary: {
    received: number;
    created: number;
    updated: number;
    skipped: number;
    errors: number;
  };
  items: Array<{
    index: number;
    status: "created" | "updated" | "skipped" | "error";
    leadId?: string;
    reason?: string;
  }>;
};

type Source = "csv_upload" | "scraper" | "api_partner" | "manual_entry";

const CSV_TEMPLATE_HEADER =
  "ownerName,parcelId,propertyAddr,surplusAmount,saleDate,deadlineDate,surplusType,claimantPhone,claimantEmail,notes";

export default function IngestWizardPage() {
  // Step state
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1 — configuration
  const [counties, setCounties] = useState<County[]>([]);
  const [countyId, setCountyId] = useState("");
  const [source, setSource] = useState<Source>("csv_upload");
  const [autoScore, setAutoScore] = useState(true);
  const [csvText, setCsvText] = useState("");

  // Parsed rows (stable across steps)
  const [items, setItems] = useState<IngestItem[]>([]);

  // Step 2 — dry run preview
  const [dryRunLoading, setDryRunLoading] = useState(false);
  const [dryRunResult, setDryRunResult] = useState<IngestResult | null>(null);

  // Step 3 — commit result
  const [commitLoading, setCommitLoading] = useState(false);
  const [commitResult, setCommitResult] = useState<IngestResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCounties() {
      try {
        const res = await fetch("/api/counties?limit=100", { cache: "no-store" });
        const json = await res.json();
        const list: County[] = (json?.data?.items ?? json?.items ?? []).map(
          (c: County) => ({ id: c.id, name: c.name, state: c.state }),
        );
        setCounties(list);
      } catch {
        setError("Failed to load counties.");
      }
    }
    void loadCounties();
  }, []);

  function parseCsv(): IngestItem[] {
    const text = csvText.trim();
    if (!text) return [];
    const parsed = Papa.parse<Record<string, string>>(text, {
      header: true,
      skipEmptyLines: true,
    });
    return parsed.data.map((row) => ({
      ownerName: row.ownerName,
      parcelId: row.parcelId || null,
      propertyAddr: row.propertyAddr || null,
      surplusAmount: row.surplusAmount || null,
      saleDate: row.saleDate || null,
      deadlineDate: row.deadlineDate || null,
      surplusType:
        (row.surplusType as IngestItem["surplusType"]) || undefined,
      claimantPhone: row.claimantPhone || null,
      claimantEmail: row.claimantEmail || null,
      notes: row.notes || null,
    }));
  }

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setCsvText(text);
  }

  async function runDryRun() {
    setError(null);
    const parsed = parseCsv();
    if (parsed.length === 0) {
      setError("CSV is empty or missing required columns.");
      return;
    }
    if (!countyId) {
      setError("Pick a county first.");
      return;
    }
    setItems(parsed);
    setDryRunLoading(true);
    try {
      const res = await fetch("/api/v1/leads/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source,
          countyId,
          dryRun: true,
          autoScore,
          items: parsed,
        }),
      });
      const json = await res.json();
      if (!res.ok && !json?.summary) {
        throw new Error(json?.error ?? "Dry run failed");
      }
      setDryRunResult(json);
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Dry run failed");
    } finally {
      setDryRunLoading(false);
    }
  }

  async function commit() {
    setError(null);
    setCommitLoading(true);
    try {
      const res = await fetch("/api/v1/leads/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source,
          countyId,
          dryRun: false,
          autoScore,
          items,
        }),
      });
      const json = await res.json();
      if (!res.ok && !json?.summary) {
        throw new Error(json?.error ?? "Commit failed");
      }
      setCommitResult(json);
      setStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Commit failed");
    } finally {
      setCommitLoading(false);
    }
  }

  function downloadTemplate() {
    const blob = new Blob([CSV_TEMPLATE_HEADER + "\n"], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "leads-ingest-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  const previewRows = useMemo(() => items.slice(0, 5), [items]);

  return (
    <main className="p-6 space-y-6 max-w-5xl">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Ingest Leads</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Upload a CSV or paste rows, preview with dry-run, then commit.
        </p>
      </header>

      <nav className="flex gap-2 text-sm">
        {[
          { n: 1, label: "Configure" },
          { n: 2, label: "Preview" },
          { n: 3, label: "Commit" },
        ].map((s) => (
          <div
            key={s.n}
            className={`rounded-full px-3 py-1 ${
              step === s.n
                ? "bg-black text-white"
                : "border bg-zinc-50 text-zinc-600"
            }`}
          >
            {s.n}. {s.label}
          </div>
        ))}
      </nav>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {step === 1 && (
        <section className="space-y-4 rounded-2xl border bg-white p-5 shadow-sm">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block font-medium">County</span>
              <select
                value={countyId}
                onChange={(e) => setCountyId(e.target.value)}
                className="w-full rounded-lg border px-3 py-2"
              >
                <option value="">— pick a county —</option>
                {counties.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}, {c.state}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm">
              <span className="mb-1 block font-medium">Source</span>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value as Source)}
                className="w-full rounded-lg border px-3 py-2"
              >
                <option value="csv_upload">CSV upload</option>
                <option value="scraper">Scraper</option>
                <option value="api_partner">API partner</option>
                <option value="manual_entry">Manual entry</option>
              </select>
            </label>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={autoScore}
              onChange={(e) => setAutoScore(e.target.checked)}
            />
            Auto-score leads after ingest
          </label>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">CSV data</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={downloadTemplate}
                  className="rounded-lg border px-3 py-1 text-xs hover:bg-zinc-50"
                >
                  Download template
                </button>
                <label className="cursor-pointer rounded-lg border px-3 py-1 text-xs hover:bg-zinc-50">
                  Upload file
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    onChange={onFileChange}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
            <textarea
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder={CSV_TEMPLATE_HEADER + "\nJOHN DOE,ABC-123,123 Main St,$12,500.00,,2026-06-30,TAX_SALE,,,sample"}
              rows={10}
              className="w-full rounded-lg border px-3 py-2 font-mono text-xs"
            />
            <p className="text-xs text-zinc-500">
              Required column: <code>ownerName</code>. At least one of{" "}
              <code>parcelId</code> or <code>propertyAddr</code>.{" "}
              <code>surplusAmount</code> accepts strings like <code>$18,342.22</code>.
            </p>
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => void runDryRun()}
              disabled={dryRunLoading || !countyId || !csvText.trim()}
              className="rounded-lg bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
            >
              {dryRunLoading ? "Running dry run…" : "Preview (dry run)"}
            </button>
          </div>
        </section>
      )}

      {step === 2 && dryRunResult && (
        <section className="space-y-4 rounded-2xl border bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Dry run summary</h2>
          <SummaryGrid summary={dryRunResult.summary} />

          {previewRows.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-medium">First {previewRows.length} rows</h3>
              <div className="overflow-x-auto rounded-lg border">
                <table className="min-w-full divide-y divide-zinc-200 text-xs">
                  <thead className="bg-zinc-50 text-left">
                    <tr>
                      <th className="px-2 py-2">#</th>
                      <th className="px-2 py-2">Owner</th>
                      <th className="px-2 py-2">Parcel / Addr</th>
                      <th className="px-2 py-2">Amount</th>
                      <th className="px-2 py-2">Planned</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {previewRows.map((row, i) => {
                      const plan = dryRunResult.items[i];
                      return (
                        <tr key={i}>
                          <td className="px-2 py-2 text-zinc-500">{i}</td>
                          <td className="px-2 py-2">{row.ownerName ?? "—"}</td>
                          <td className="px-2 py-2 text-zinc-600">
                            {row.parcelId || row.propertyAddr || "—"}
                          </td>
                          <td className="px-2 py-2">{String(row.surplusAmount ?? "—")}</td>
                          <td className="px-2 py-2">
                            <StatusPill status={plan?.status ?? "skipped"} />
                            {plan?.reason ? (
                              <span className="ml-2 text-zinc-500">{plan.reason}</span>
                            ) : null}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex justify-between">
            <button
              onClick={() => setStep(1)}
              className="rounded-lg border px-4 py-2 text-sm hover:bg-zinc-50"
            >
              Back
            </button>
            <button
              onClick={() => void commit()}
              disabled={commitLoading || dryRunResult.summary.received === 0}
              className="rounded-lg bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
            >
              {commitLoading ? "Committing…" : "Commit ingest"}
            </button>
          </div>
        </section>
      )}

      {step === 3 && commitResult && (
        <section className="space-y-4 rounded-2xl border bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Ingest complete</h2>
          <SummaryGrid summary={commitResult.summary} />
          {commitResult.batchId && (
            <p className="text-xs text-zinc-500">
              Batch id: <code>{commitResult.batchId}</code>
            </p>
          )}
          <div className="flex gap-2">
            <a
              href="/leads"
              className="rounded-lg bg-black px-4 py-2 text-sm text-white"
            >
              View leads
            </a>
            <button
              onClick={() => {
                setStep(1);
                setCsvText("");
                setItems([]);
                setDryRunResult(null);
                setCommitResult(null);
              }}
              className="rounded-lg border px-4 py-2 text-sm hover:bg-zinc-50"
            >
              Ingest another batch
            </button>
          </div>
        </section>
      )}
    </main>
  );
}

function SummaryGrid({ summary }: { summary: IngestResult["summary"] }) {
  const cells = [
    { label: "Received", value: summary.received },
    { label: "Created", value: summary.created, cls: "text-emerald-700" },
    { label: "Updated", value: summary.updated, cls: "text-blue-700" },
    { label: "Skipped", value: summary.skipped, cls: "text-amber-700" },
    { label: "Errors", value: summary.errors, cls: "text-red-700" },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
      {cells.map((c) => (
        <div key={c.label} className="rounded-lg border bg-zinc-50 p-3">
          <div className="text-xs text-zinc-500">{c.label}</div>
          <div className={`text-2xl font-semibold ${c.cls ?? ""}`}>{c.value}</div>
        </div>
      ))}
    </div>
  );
}

function StatusPill({
  status,
}: {
  status: "created" | "updated" | "skipped" | "error";
}) {
  const styles: Record<string, string> = {
    created: "bg-emerald-50 text-emerald-700",
    updated: "bg-blue-50 text-blue-700",
    skipped: "bg-amber-50 text-amber-700",
    error: "bg-red-50 text-red-700",
  };
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${styles[status]}`}
    >
      {status}
    </span>
  );
}
