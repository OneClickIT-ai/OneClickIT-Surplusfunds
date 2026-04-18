"use client";

import { useCallback, useEffect, useState } from "react";

type CaseDetail = {
  id: string;
  ownerName: string;
  countyName: string;
  state: string;
  propertyAddr: string | null;
  parcelId: string | null;
  amount: number | null;
  status: string;
  priority: string;
  notes: string | null;
  deadlineDate: string | null;
  claimant?: {
    fullName?: string | null;
    phone?: string | null;
    email?: string | null;
  } | null;
  activities: Array<{ id: string; type: string; message: string; createdAt: string }>;
  tasks: Array<{
    id: string;
    title: string;
    type: string;
    dueDate: string | null;
    completedAt: string | null;
  }>;
  agreements: Array<{
    id: string;
    type: string;
    status: string;
    createdAt: string;
  }>;
};

type TimelineEntry = {
  id: string;
  at: string;
  kind: "activity" | "task" | "agreement" | "contact";
  title: string;
  body: string;
  status?: string | null;
};

// Next 14: params is a synchronous object, not a Promise.
export default function CaseDetailPage({
  params,
}: {
  params: { caseId: string };
}) {
  const { caseId } = params;
  const [detail, setDetail] = useState<CaseDetail | null>(null);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusValue, setStatusValue] = useState("research");

  const loadTimeline = useCallback(async () => {
    const res = await fetch(`/api/v1/cases/${caseId}/timeline`, { cache: "no-store" });
    const json = await res.json();
    if (res.ok) setTimeline(json.data.timeline ?? []);
  }, [caseId]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [detailRes] = await Promise.all([
        fetch(`/api/v1/cases/${caseId}`, { cache: "no-store" }),
        loadTimeline(),
      ]);
      const detailJson = await detailRes.json();
      if (detailRes.ok) {
        setDetail(detailJson.data);
        setStatusValue(detailJson.data.status);
      }
      setLoading(false);
    }
    void load();
  }, [caseId, loadTimeline]);

  async function updateStatus() {
    const res = await fetch(`/api/v1/cases/${caseId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: statusValue }),
    });
    if (res.ok) {
      const json = await res.json();
      setDetail(json.data);
      await loadTimeline();
    }
  }

  if (loading) return <div className="p-6 text-sm text-zinc-500">Loading case...</div>;
  if (!detail) return <div className="p-6 text-sm text-red-600">Case not found.</div>;

  return (
    <main className="p-6 space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{detail.ownerName}</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {detail.countyName}, {detail.state}
          </p>
          <p className="mt-2 text-sm text-zinc-700">
            {detail.propertyAddr ?? "No address on file"}
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-4 shadow-sm space-y-3">
          <div className="text-sm">
            <div>
              Status: <span className="font-medium">{detail.status}</span>
            </div>
            <div>
              Priority: <span className="font-medium">{detail.priority}</span>
            </div>
            <div>
              Amount:{" "}
              <span className="font-medium">
                {detail.amount != null
                  ? detail.amount.toLocaleString("en-US", {
                      style: "currency",
                      currency: "USD",
                    })
                  : "—"}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <select
              value={statusValue}
              onChange={(e) => setStatusValue(e.target.value)}
              className="rounded-lg border px-3 py-2 text-sm"
            >
              <option value="research">research</option>
              <option value="contacted">contacted</option>
              <option value="docs_gathering">docs_gathering</option>
              <option value="filed">filed</option>
              <option value="approved">approved</option>
              <option value="paid">paid</option>
              <option value="denied">denied</option>
              <option value="court_petition">court_petition</option>
              <option value="hearing_scheduled">hearing_scheduled</option>
            </select>

            <button
              onClick={() => void updateStatus()}
              className="rounded-lg bg-black px-4 py-2 text-sm text-white"
            >
              Update
            </button>
          </div>
        </div>
      </div>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <h2 className="text-lg font-semibold">Case details</h2>
            <dl className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-zinc-500">Parcel ID</dt>
                <dd>{detail.parcelId ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-zinc-500">Deadline</dt>
                <dd>
                  {detail.deadlineDate
                    ? new Date(detail.deadlineDate).toLocaleDateString()
                    : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-zinc-500">Claimant</dt>
                <dd>{detail.claimant?.fullName ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-zinc-500">Email</dt>
                <dd>{detail.claimant?.email ?? "—"}</dd>
              </div>
            </dl>

            {detail.notes ? (
              <div className="mt-4">
                <h3 className="text-sm font-medium">Notes</h3>
                <p className="mt-1 text-sm text-zinc-700 whitespace-pre-wrap">
                  {detail.notes}
                </p>
              </div>
            ) : null}
          </div>

          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <h2 className="text-lg font-semibold">Timeline</h2>
            <div className="mt-4 space-y-3">
              {timeline.map((entry) => (
                <div key={entry.id} className="rounded-xl border bg-zinc-50 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-medium">
                      {entry.kind}: {entry.title}
                    </div>
                    <div className="text-xs text-zinc-500">
                      {new Date(entry.at).toLocaleString()}
                    </div>
                  </div>
                  <p className="mt-1 text-sm text-zinc-700">{entry.body}</p>
                </div>
              ))}
              {!timeline.length && (
                <p className="text-sm text-zinc-500">No activity yet.</p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <h2 className="text-lg font-semibold">Tasks</h2>
            <div className="mt-4 space-y-3">
              {detail.tasks.map((task) => (
                <div
                  key={task.id}
                  className="rounded-xl border bg-zinc-50 p-3 text-sm"
                >
                  <div className="font-medium">{task.title}</div>
                  <div className="text-zinc-500">
                    {task.type} ·{" "}
                    {task.dueDate
                      ? new Date(task.dueDate).toLocaleDateString()
                      : "No due date"}
                  </div>
                </div>
              ))}
              {!detail.tasks.length && (
                <p className="text-sm text-zinc-500">No tasks yet.</p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <h2 className="text-lg font-semibold">Agreements</h2>
            <div className="mt-4 space-y-3">
              {detail.agreements.map((agreement) => (
                <div
                  key={agreement.id}
                  className="rounded-xl border bg-zinc-50 p-3 text-sm"
                >
                  <div className="font-medium">{agreement.type}</div>
                  <div className="text-zinc-500">
                    {agreement.status} ·{" "}
                    {new Date(agreement.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
              {!detail.agreements.length && (
                <p className="text-sm text-zinc-500">No agreements yet.</p>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
