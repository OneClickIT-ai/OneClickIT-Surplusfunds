import { getServerSession } from '@/lib/auth';
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";
import { listLeads } from "@/modules/leads/server/service";
import { ConvertButton } from "./ConvertButton";
import { SkipTraceButton } from "./SkipTraceButton";

export const dynamic = "force-dynamic";

export default async function LeadsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/sign-in");

  const { data: items } = await listLeads({ page: 1, limit: 50 });

  return (
    <main className="p-6 space-y-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Leads</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Ranked surplus-funds leads ready for review, skip tracing, and conversion.
        </p>
      </header>

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
                  <div className="flex flex-wrap items-center gap-1.5">
                    {lead.claim?.id ? (
                      <a
                        href={`/cases/${lead.claim.id}`}
                        className="rounded-lg bg-black px-3 py-1.5 text-xs text-white"
                      >
                        Open Case
                      </a>
                    ) : (
                      <ConvertButton leadId={lead.id} />
                    )}
                    <SkipTraceButton
                      leadId={lead.id}
                      alreadyEnriched={lead.enriched}
                    />
                  </div>
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
