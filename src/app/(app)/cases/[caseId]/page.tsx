import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";

import { authOptions } from "@/lib/auth";
import {
  getCaseById,
  getCaseTimeline,
} from "@/modules/cases/server/service";
import { StatusUpdater } from "./StatusUpdater";
import { PortalLinkAction } from "./PortalLinkAction";
import { ContactActions } from "./ContactActions";
import { ContactLogItem } from "./ContactLogItem";

export const dynamic = "force-dynamic";

export default async function CaseDetailPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/auth/signin");

  const actor = { userId: session.user.id, role: session.user.role };
  const { caseId } = await params;

  const [detail, timelineResult] = await Promise.all([
    getCaseById(caseId, actor),
    getCaseTimeline(caseId, actor),
  ]);

  if (!detail) notFound();
  const timeline = timelineResult?.timeline ?? [];

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

          <StatusUpdater caseId={detail.id} current={detail.status} />

          <div className="border-t pt-3">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
              Claimant portal
            </p>
            <PortalLinkAction caseId={detail.id} />
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
                <div key={task.id} className="rounded-xl border bg-zinc-50 p-3 text-sm">
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
            <h2 className="text-lg font-semibold">Log contact</h2>
            <div className="mt-4">
              <ContactActions caseId={detail.id} />
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <h2 className="text-lg font-semibold">Recent contacts</h2>
            <div className="mt-4 space-y-2">
              {detail.contactLogs.length === 0 ? (
                <p className="text-sm text-zinc-500">No contacts logged yet.</p>
              ) : (
                detail.contactLogs.map((log) => (
                  <ContactLogItem
                    key={log.id}
                    log={{
                      id: log.id,
                      channel: log.channel,
                      direction: log.direction,
                      status: log.status,
                      notes: log.notes,
                      duration: log.duration,
                      createdAt: log.createdAt,
                    }}
                  />
                ))
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
