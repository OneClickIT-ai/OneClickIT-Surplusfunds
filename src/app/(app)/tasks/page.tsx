import { getServerSession } from '@/lib/auth';
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";
import {
  dueToday,
  listTasks,
  overdueTasks,
} from "@/modules/tasks/server/service";
import { TaskToggle } from "./TaskToggle";

export const dynamic = "force-dynamic";

type Tone = "red" | "amber" | "zinc";

export default async function TasksPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/sign-in");

  const actor = { userId: session.user.id, role: session.user.role };

  const [overdue, today, openList] = await Promise.all([
    overdueTasks(actor),
    dueToday(actor),
    listTasks({ page: 1, limit: 50, status: "open" }, actor),
  ]);

  const overdueIds = new Set(overdue.map((t) => t.id));
  const todayIds = new Set(today.map((t) => t.id));
  const upcoming = openList.data.filter(
    (t) => !overdueIds.has(t.id) && !todayIds.has(t.id),
  );

  return (
    <main className="p-6 space-y-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Tasks</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Open work across all cases you own or are assigned to.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Column title="Overdue" count={overdue.length} tone="red">
          {overdue.map((t) => (
            <TaskCard key={t.id} task={t} tone="red" />
          ))}
          {!overdue.length && <Empty>No overdue tasks.</Empty>}
        </Column>

        <Column title="Due Today" count={today.length} tone="amber">
          {today.map((t) => (
            <TaskCard key={t.id} task={t} tone="amber" />
          ))}
          {!today.length && <Empty>Nothing due today.</Empty>}
        </Column>

        <Column title="Upcoming / Open" count={upcoming.length} tone="zinc">
          {upcoming.map((t) => (
            <TaskCard key={t.id} task={t} tone="zinc" />
          ))}
          {!upcoming.length && <Empty>No other open tasks.</Empty>}
        </Column>
      </div>
    </main>
  );
}

const toneStyles: Record<Tone, { header: string; count: string; border: string }> = {
  red: { header: "text-red-700", count: "bg-red-100 text-red-800", border: "border-red-200" },
  amber: { header: "text-amber-700", count: "bg-amber-100 text-amber-800", border: "border-amber-200" },
  zinc: { header: "text-zinc-700", count: "bg-zinc-100 text-zinc-700", border: "" },
};

function Column({
  title,
  count,
  tone,
  children,
}: {
  title: string;
  count: number;
  tone: Tone;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border bg-white p-4 shadow-sm">
      <header className="mb-3 flex items-center justify-between">
        <h2 className={`text-sm font-semibold ${toneStyles[tone].header}`}>{title}</h2>
        <span className={`rounded-full px-2 py-0.5 text-xs ${toneStyles[tone].count}`}>
          {count}
        </span>
      </header>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

type TaskRow = Awaited<ReturnType<typeof overdueTasks>>[number];

function TaskCard({ task, tone }: { task: TaskRow; tone: Tone }) {
  const due = task.dueDate ? new Date(task.dueDate) : null;
  return (
    <article className={`rounded-xl border ${toneStyles[tone].border} bg-zinc-50 p-3 space-y-2`}>
      <div className="flex items-start gap-2">
        <TaskToggle taskId={task.id} completed={!!task.completedAt} />
        <div className="flex-1">
          <div className="text-sm font-medium">{task.title}</div>
          <div className="text-xs text-zinc-500">
            {task.type} · {task.priority}
            {due ? ` · due ${due.toLocaleDateString()}` : ""}
          </div>
        </div>
      </div>
      {task.claim ? (
        <a
          href={`/cases/${task.claim.id}`}
          className="block rounded bg-white px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-100"
        >
          → Case: {task.claim.ownerName} ({task.claim.countyName}, {task.claim.state})
        </a>
      ) : task.lead ? (
        <a
          href="/leads"
          className="block rounded bg-white px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-100"
        >
          → Lead: {task.lead.ownerName}
        </a>
      ) : null}
      {task.notes ? (
        <p className="text-xs text-zinc-600 whitespace-pre-wrap">{task.notes}</p>
      ) : null}
    </article>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-zinc-500">{children}</p>;
}
