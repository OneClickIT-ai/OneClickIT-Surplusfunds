import { getServerSession } from '@/lib/auth';
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";
import { listCases } from "@/modules/cases/server/service";
import { StageButtons } from "./StageButtons";

export const dynamic = "force-dynamic";

const columns = [
  { key: "research", label: "New / Research" },
  { key: "contacted", label: "Contacted" },
  { key: "docs_gathering", label: "Docs Gathering" },
  { key: "filed", label: "Filed" },
  { key: "approved", label: "Approved" },
  { key: "paid", label: "Paid" },
];

export default async function CRMPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/sign-in");

  const { data: items } = await listCases(
    { page: 1, limit: 100 },
    { userId: session.user.id, role: session.user.role },
  );

  const grouped = new Map<string, typeof items>();
  for (const col of columns) grouped.set(col.key, []);
  for (const item of items) {
    if (!grouped.has(item.status)) grouped.set(item.status, []);
    grouped.get(item.status)!.push(item);
  }

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
                <article
                  key={item.id}
                  className="rounded-xl border bg-zinc-50 p-3 space-y-2"
                >
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
                    <StageButtons
                      caseId={item.id}
                      currentStatus={item.status}
                      options={columns}
                    />
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
