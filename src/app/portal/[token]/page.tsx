import { notFound } from "next/navigation";

import { resolvePortalToken } from "@/modules/portal/server/tokens";
import { SignForm } from "./SignForm";

export const dynamic = "force-dynamic";

/**
 * Public claimant portal. No auth — the token IS the auth.
 * Rendered as an RSC so sensitive data never leaves the server.
 */
export default async function PortalPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const resolved = await resolvePortalToken(token);
  if (!resolved) notFound();

  const { claim } = resolved;
  const fmt = (n: number | null | undefined) =>
    n != null
      ? n.toLocaleString("en-US", { style: "currency", currency: "USD" })
      : "—";

  return (
    <main className="min-h-screen bg-zinc-50 py-10 px-4">
      <div className="mx-auto max-w-3xl space-y-6">
        <header className="rounded-2xl bg-white border p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-zinc-500">
                Your case
              </p>
              <h1 className="mt-1 text-2xl font-semibold">{claim.ownerName}</h1>
              <p className="mt-1 text-sm text-zinc-600">
                {claim.countyName}, {claim.state}
                {claim.propertyAddr ? ` — ${claim.propertyAddr}` : ""}
              </p>
            </div>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
              {claim.status}
            </span>
          </div>

          <dl className="mt-6 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <div>
              <dt className="text-xs text-zinc-500">Surplus</dt>
              <dd className="mt-0.5 font-medium">{fmt(claim.amount)}</dd>
            </div>
            <div>
              <dt className="text-xs text-zinc-500">Parcel</dt>
              <dd className="mt-0.5 font-medium">{claim.parcelId ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-zinc-500">Type</dt>
              <dd className="mt-0.5 font-medium">{claim.surplusType}</dd>
            </div>
            <div>
              <dt className="text-xs text-zinc-500">Deadline</dt>
              <dd className="mt-0.5 font-medium">
                {claim.deadlineDate
                  ? new Date(claim.deadlineDate).toLocaleDateString()
                  : "—"}
              </dd>
            </div>
          </dl>
        </header>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Agreements</h2>
          {claim.agreements.length === 0 ? (
            <div className="rounded-2xl border bg-white p-6 text-sm text-zinc-500 shadow-sm">
              No agreements have been shared yet.
            </div>
          ) : (
            claim.agreements.map((a) => (
              <article
                key={a.id}
                className="rounded-2xl border bg-white p-6 shadow-sm space-y-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-base font-semibold">
                      {a.type.replaceAll("_", " ")}
                    </h3>
                    <p className="text-xs text-zinc-500">
                      Sent{" "}
                      {a.sentAt
                        ? new Date(a.sentAt).toLocaleDateString()
                        : new Date(a.createdAt).toLocaleDateString()}
                      {a.feePercent != null ? ` · Fee ${a.feePercent}%` : ""}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      a.status === "SIGNED"
                        ? "bg-emerald-100 text-emerald-700"
                        : a.status === "SENT" || a.status === "VIEWED"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-zinc-100 text-zinc-700"
                    }`}
                  >
                    {a.status}
                  </span>
                </div>

                <details className="text-sm">
                  <summary className="cursor-pointer text-blue-700 hover:underline">
                    View full document
                  </summary>
                  <pre className="mt-2 max-h-96 overflow-auto whitespace-pre-wrap rounded-lg border bg-zinc-50 p-3 text-xs font-mono">
                    {a.renderedText ?? "(no text)"}
                  </pre>
                </details>

                {a.status === "SIGNED" ? (
                  <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                    Signed{" "}
                    {a.signedAt
                      ? new Date(a.signedAt).toLocaleString()
                      : "successfully"}
                    . A copy has been saved to the case file.
                  </p>
                ) : a.status === "SENT" || a.status === "VIEWED" ? (
                  <div className="rounded-lg border bg-zinc-50 p-4">
                    <SignForm
                      token={token}
                      agreementId={a.id}
                      defaultName={claim.claimant?.fullName ?? claim.ownerName}
                    />
                  </div>
                ) : (
                  <p className="text-xs text-zinc-500">
                    This agreement is not currently available for signing.
                  </p>
                )}
              </article>
            ))
          )}
        </section>

        <footer className="pt-4 text-center text-xs text-zinc-500">
          This link expires{" "}
          {new Date(resolved.tokenRow.expiresAt).toLocaleDateString()}. If you
          need a new link, contact your case agent.
        </footer>
      </div>
    </main>
  );
}
