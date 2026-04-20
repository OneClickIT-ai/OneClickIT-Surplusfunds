import { getServerSession } from '@/lib/auth';
import { redirect, notFound } from "next/navigation";

import { authOptions } from "@/lib/auth";
import { getAgreement } from "@/modules/agreements/server/service";
import { AgreementActions } from "./AgreementActions";

export const dynamic = "force-dynamic";

export default async function AgreementDetailPage({
  params,
}: {
  params: Promise<{ agreementId: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/sign-in");

  const { agreementId } = await params;
  const result = await getAgreement(agreementId, {
    userId: session.user.id,
    role: session.user.role,
    name: session.user.name ?? "Agent",
  });
  if ("notFound" in result || !result.agreement) notFound();
  const ag = result.agreement;

  const canSend = ag.status === "DRAFT";
  const canMarkSigned = ag.status !== "SIGNED" && ag.status !== "DECLINED";

  return (
    <main className="p-6 space-y-6 max-w-4xl">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{ag.type}</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Case:{" "}
            {ag.claim ? (
              <a
                href={`/cases/${ag.claim.id}`}
                className="text-blue-700 hover:underline"
              >
                {ag.claim.ownerName}
              </a>
            ) : (
              "—"
            )}
            {ag.claim ? ` (${ag.claim.countyName}, ${ag.claim.state})` : null}
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            Created {new Date(ag.createdAt).toLocaleString()}
          </p>
        </div>

        <div className="rounded-2xl border bg-white p-4 shadow-sm text-sm space-y-2 min-w-[220px]">
          <div>
            Status: <strong>{ag.status}</strong>
          </div>
          <div>
            Fee: <strong>{ag.feePercent != null ? `${ag.feePercent}%` : "—"}</strong>
          </div>
          {ag.sentAt && (
            <div className="text-xs text-zinc-500">
              Sent: {new Date(ag.sentAt).toLocaleString()}
            </div>
          )}
          {ag.signedAt && (
            <div className="text-xs text-emerald-700">
              Signed: {new Date(ag.signedAt).toLocaleString()}
            </div>
          )}
        </div>
      </header>

      <section className="rounded-2xl border bg-white p-5 shadow-sm space-y-4">
        <AgreementActions
          agreementId={ag.id}
          canSend={canSend}
          canMarkSigned={canMarkSigned}
          eSignUrl={ag.eSignUrl}
        />

        <div>
          <h2 className="text-sm font-medium text-zinc-600 mb-2">Claimant</h2>
          <div className="text-sm">
            {ag.claimant ? (
              <>
                <div>{ag.claimant.fullName}</div>
                {ag.claimant.email && (
                  <div className="text-zinc-500">{ag.claimant.email}</div>
                )}
                {ag.claimant.phone && (
                  <div className="text-zinc-500">{ag.claimant.phone}</div>
                )}
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
