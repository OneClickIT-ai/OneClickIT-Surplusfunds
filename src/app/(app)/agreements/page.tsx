import { getServerSession } from '@/lib/auth';
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";
import { listAgreements } from "@/modules/agreements/server/service";

export const dynamic = "force-dynamic";

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-zinc-100 text-zinc-700",
  SENT: "bg-blue-100 text-blue-700",
  VIEWED: "bg-indigo-100 text-indigo-700",
  SIGNED: "bg-emerald-100 text-emerald-700",
  DECLINED: "bg-red-100 text-red-700",
  EXPIRED: "bg-amber-100 text-amber-700",
};

export default async function AgreementsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/sign-in");

  const { data: items } = await listAgreements(
    { page: 1, limit: 100 },
    {
      userId: session.user.id,
      role: session.user.role,
      name: session.user.name ?? "Agent",
    },
  );

  return (
    <main className="p-6 space-y-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Agreements</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Drafts, sent requests, and signed engagements across all your cases.
        </p>
      </header>

      <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
        <table className="min-w-full divide-y divide-zinc-200 text-sm">
          <thead className="bg-zinc-50">
            <tr className="text-left text-xs uppercase tracking-wide text-zinc-500">
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Case</th>
              <th className="px-4 py-3">Claimant</th>
              <th className="px-4 py-3">Fee</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Sent</th>
              <th className="px-4 py-3">Signed</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {items.map((a) => (
              <tr key={a.id}>
                <td className="px-4 py-3 font-medium">{a.type}</td>
                <td className="px-4 py-3">
                  <a
                    href={`/cases/${a.claim.id}`}
                    className="text-blue-700 hover:underline"
                  >
                    {a.claim.ownerName}
                  </a>
                  <div className="text-xs text-zinc-500">
                    {a.claim.countyName}, {a.claim.state}
                  </div>
                </td>
                <td className="px-4 py-3">
                  {a.claimant?.fullName ?? "—"}
                  {a.claimant?.email ? (
                    <div className="text-xs text-zinc-500">{a.claimant.email}</div>
                  ) : null}
                </td>
                <td className="px-4 py-3">
                  {a.feePercent != null ? `${a.feePercent}%` : "—"}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${STATUS_COLORS[a.status] ?? ""}`}
                  >
                    {a.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-zinc-500">
                  {a.sentAt ? new Date(a.sentAt).toLocaleDateString() : "—"}
                </td>
                <td className="px-4 py-3 text-xs text-zinc-500">
                  {a.signedAt ? new Date(a.signedAt).toLocaleDateString() : "—"}
                </td>
                <td className="px-4 py-3">
                  <a
                    href={`/agreements/${a.id}`}
                    className="rounded-lg bg-black px-3 py-1.5 text-xs text-white"
                  >
                    Open
                  </a>
                </td>
              </tr>
            ))}
            {!items.length && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-sm text-zinc-500">
                  No agreements yet. Create one from a case detail page.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}
