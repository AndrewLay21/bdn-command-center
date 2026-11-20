import type { Metadata } from "next";
import { Empty, FilterTabs, PageHeader, Pill, RecordRow, SearchBox } from "@/components/ui";
import { byPriority, getAllRecords, isOpenTask, type Task } from "@/lib/records";

export const metadata: Metadata = { title: "Tasks" };
export const dynamic = "force-dynamic";

const FILTERS: Record<string, [string, (t: Task) => boolean]> = {
  open: ["Open", isOpenTask],
  p0: ["Open P0", (t) => isOpenTask(t) && t.priority === "P0"],
  blocked: ["Blocked / hold", (t) => t.status === "Blocked" || t.status === "Hold"],
  review: ["Needs review", (t) => t.status === "Review"],
  done: ["Done", (t) => !isOpenTask(t)],
  all: ["All", () => true],
};

export default async function TasksPage({ searchParams }: { searchParams: Promise<{ show?: string; q?: string; owner?: string }> }) {
  const { show: rawShow, q, owner } = await searchParams;
  const show = rawShow && FILTERS[rawShow] ? rawShow : "open";
  const { tasks } = await getAllRecords();
  const needle = q?.trim().toLowerCase();
  const list = tasks
    .filter(FILTERS[show][1])
    .filter((t) => !owner || t.owner === owner)
    .filter((t) => !needle || `${t.id} ${t.title} ${t.owner} ${t.project} ${t.data.notes ?? ""}`.toLowerCase().includes(needle))
    .sort(byPriority);

  return (
    <>
      <PageHeader kicker="Records" title="Tasks">
        {tasks.length} tasks in total. Tap any task to see every detail.
      </PageHeader>
      <FilterTabs base="/tasks" current={show} keep={{ q, owner }} options={Object.entries(FILTERS).map(([k, [label, fn]]) => [k, label, tasks.filter(fn).length])} />
      <SearchBox action="/tasks" q={q} show={show} placeholder="Search tasks, owners, projects" />
      {owner ? <p className="mb-4 text-sm text-ink-soft">Owner: <strong>{owner}</strong> · <a className="underline" href={`/tasks?show=${show}`}>clear</a></p> : null}
      <div className="paper-card p-2 sm:p-3">
        {list.length ? (
          <ul className="divide-y divide-line">
            {list.map((t) => (
              <RecordRow
                key={t.id}
                href={`/tasks/${encodeURIComponent(t.id)}`}
                title={t.title}
                meta={[t.id, t.owner, t.project].filter(Boolean).join(" · ")}
                pills={<><Pill>{t.priority}</Pill><Pill>{t.status}</Pill></>}
              />
            ))}
          </ul>
        ) : (
          <Empty>No tasks match.</Empty>
        )}
      </div>
    </>
  );
}
