import { getServerSession } from '@/lib/auth';
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";
import { dashboardKpis } from "@/modules/analytics/server/dashboard";
import { pipelineByStatus } from "@/modules/analytics/server/pipeline";
import { topCountiesByLeads } from "@/modules/analytics/server/counties";

export const dynamic = "force-dynamic";

const USD = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function fmtMoney(n: number): string {
  return USD.format(n);
}

const STAGE_LABELS: Record<string, string> = {
  research: "New / Research",
  contacted: "Contacted",
  docs_gathering: "Docs Gathering",
  filed: "Filed",
  approved: "Approved",
  paid: "Paid",
  denied: "Denied",
  court_petition: "Court Petition",
  hearing_scheduled: "Hearing Scheduled",
};

export default async function InsightsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/sign-in");

  const actor = { userId: session.user.id, role: session.user.role };

  const [kpis, pipeline, counties] = await Promise.all([
    dashboardKpis(actor),
    pipelineByStatus(actor),
    topCountiesByLeads(10),
  ]);

  const pipelineMax = Math.max(1, ...pipeline.map((s) => s.count));

  return (
    <main className="p-6 space-y-8">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Insights</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Live CRM metrics across leads, cases, agreements, and tasks.
        </p>
      </header>

      {/* KPI grid */}
      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Kpi
          label="Pipeline value"
          value={fmtMoney(kpis.cases.pipelineValue)}
          sublabel={`${kpis.cases.open} open cases`}
          tone="blue"
        />
        <Kpi
          label="Paid"
          value={fmtMoney(kpis.cases.paidValue)}
          sublabel={`${kpis.cases.paid} paid cases`}
          tone="emerald"
        />
        <Kpi
          label="Leads"
          value={String(kpis.leads.total)}
          sublabel={`${kpis.leads.new} new · ${kpis.leads.enriched} enriched${kpis.leads.avgScore != null ? ` · avg ${Math.round(kpis.leads.avgScore)}` : ""}`}
          tone="indigo"
        />
        <Kpi
          label="Agreements"
          value={String(kpis.agreements.total)}
          sublabel={`${kpis.agreements.signed} signed · ${kpis.agreements.sent} sent · ${kpis.agreements.expired} expired`}
          tone="violet"
        />

        <Kpi
          label="Overdue tasks"
          value={String(kpis.tasks.overdue)}
          sublabel="across all your cases"
          tone={kpis.tasks.overdue > 0 ? "red" : "zinc"}
        />
        <Kpi
          label="Due today"
          value={String(kpis.tasks.dueToday)}
          sublabel={`${kpis.tasks.openAll} open total`}
          tone={kpis.tasks.dueToday > 0 ? "amber" : "zinc"}
        />
        <Kpi
          label="Cases"
          value={String(kpis.cases.total)}
          sublabel="all statuses"
          tone="zinc"
        />
        <Kpi
          label="Win rate"
          value={
            kpis.cases.paid + kpis.cases.open === 0
              ? "—"
              : `${Math.round((kpis.cases.paid / Math.max(1, kpis.cases.paid + kpis.cases.open)) * 100)}%`
          }
          sublabel="paid ÷ (paid + open)"
          tone="zinc"
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Pipeline by stage</h2>
          <div className="mt-4 space-y-3">
            {pipeline.length === 0 ? (
              <p className="text-sm text-zinc-500">No cases yet.</p>
            ) : (
              pipeline.map((s) => (
                <div key={s.status}>
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="font-medium">
                      {STAGE_LABELS[s.status] ?? s.status}
                    </span>
                    <span className="text-zinc-500">
                      {s.count} · {fmtMoney(s.value)}
                    </span>
                  </div>
                  <div className="mt-1 h-2 rounded-full bg-zinc-100">
                    <div
                      className="h-2 rounded-full bg-blue-500"
                      style={{
                        width: `${Math.round((s.count / pipelineMax) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl border bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Top counties by lead volume</h2>
          <div className="mt-4 overflow-hidden rounded-xl border">
            <table className="min-w-full divide-y divide-zinc-200 text-sm">
              <thead className="bg-zinc-50">
                <tr className="text-left text-xs uppercase tracking-wide text-zinc-500">
                  <th className="px-3 py-2">County</th>
                  <th className="px-3 py-2">Leads</th>
                  <th className="px-3 py-2">Surplus</th>
                  <th className="px-3 py-2">Avg score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {counties.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-3 py-6 text-center text-xs text-zinc-500"
                    >
                      No data yet.
                    </td>
                  </tr>
                ) : (
                  counties.map((c) => (
                    <tr key={c.countyId}>
                      <td className="px-3 py-2">
                        {c.name}, {c.state}
                      </td>
                      <td className="px-3 py-2">{c.leadCount}</td>
                      <td className="px-3 py-2">{fmtMoney(c.totalSurplus)}</td>
                      <td className="px-3 py-2">
                        {c.avgScore != null ? Math.round(c.avgScore) : "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
  );
}

type Tone = "blue" | "emerald" | "indigo" | "violet" | "amber" | "red" | "zinc";
const toneCls: Record<Tone, string> = {
  blue: "text-blue-700",
  emerald: "text-emerald-700",
  indigo: "text-indigo-700",
  violet: "text-violet-700",
  amber: "text-amber-700",
  red: "text-red-700",
  zinc: "text-zinc-700",
};

function Kpi({
  label,
  value,
  sublabel,
  tone,
}: {
  label: string;
  value: string;
  sublabel: string;
  tone: Tone;
}) {
  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        {label}
      </div>
      <div className={`mt-1 text-2xl font-semibold ${toneCls[tone]}`}>
        {value}
      </div>
      <div className="mt-1 text-xs text-zinc-500">{sublabel}</div>
    </div>
  );
}
