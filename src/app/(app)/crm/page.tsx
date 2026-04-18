"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type CaseItem = {
  id: string;
  ownerName: string;
  countyName: string;
  state: string;
  amount: number | null;
  deadlineDate: string | null;
  status: string;
  priority: string;
  surplusType: string;
  assignee?: { name?: string | null } | null;
};

const columns = [
  { key: "research", label: "New / Research" },
  { key: "contacted", label: "Contacted" },
  { key: "docs_gathering", label: "Docs Gathering" },
  { key: "filed", label: "Filed" },
  { key: "approved", label: "Approved" },
  { key: "paid", label: "Paid" },
];

export default function CRMPage() {
  const [items, setItems] = useState<CaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCases = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/cases?limit=100", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load cases");
      setItems(json.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load cases");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCases();
  }, [loadCases]);

  async function moveCase(id: string, status: string) {
    const res = await fetch(`/api/v1/cases/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) await loadCases();
  }

  const grouped = useMemo(() => {
    const map = new Map<string, CaseItem[]>();
    for (const col of columns) map.set(col.key, []);
    for (const item of items) {
      if (!map.has(item.status)) map.set(item.status, []);
      map.get(item.status)!.push(item);
    }
    return map;
  }, [items]);

  if (loading) return <div className="p-6 text-sm text-zinc-500">Loading pipeline...</div>;
  if (error) return <div className="p-6 text-sm text-red-600">{error}</div>;

  return (
    <main className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">CRM Pipeline</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Cases grouped by stage from intake through payout.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-6">
        {columns.map((column) => (
          <section key={column.key} className="rounded-2xl border bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold">{column.label}</h2>
              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600">
                {grouped.get(column.key)?.length ?? 0}
              </span>
            </div>

            <div className="space-y-3">
              {(grouped.get(column.key) ?? []).map((item) => (
                <article key={item.id} className="rounded-xl border bg-zinc-50 p-3 space-y-2">
                  <div>
                    <h3 className="font-medium">{item.ownerName}</h3>
                    <p className="text-xs text-zinc-500">
                      {item.countyName}, {item.state}
                    </p>
                  </div>

                  <div className="text-sm">
                    <div>
                      Amount:{" "}
                      <span className="font-medium">
                        {item.amount != null
                          ? item.amount.toLocaleString("en-US", {
                              style: "currency",
                              currency: "USD",
                            })
                          : "—"}
                      </span>
                    </div>
                    <div className="text-xs text-zinc-500">
                      {item.surplusType} · {item.priority}
                    </div>
                  </div>

                  <div className="text-xs text-zinc-500">
                    Deadline:{" "}
                    {item.deadlineDate
                      ? new Date(item.deadlineDate).toLocaleDateString()
                      : "—"}
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    {columns
                      .filter((c) => c.key !== item.status)
                      .slice(0, 2)
                      .map((next) => (
                        <button
                          key={next.key}
                          onClick={() => void moveCase(item.id, next.key)}
                          className="rounded-lg border px-2 py-1 text-xs hover:bg-zinc-100"
                        >
                          Move to {next.label}
                        </button>
                      ))}
                    <a
                      href={`/cases/${item.id}`}
                      className="rounded-lg bg-black px-2 py-1 text-xs text-white"
                    >
                      Open
                    </a>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
