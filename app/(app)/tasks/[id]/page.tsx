import Link from "next/link";
import { notFound } from "next/navigation";
import { FieldList, PageHeader, Pill } from "@/components/ui";
import { formatWhen, getAllRecords } from "@/lib/records";

export const dynamic = "force-dynamic";

export default async function TaskDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { tasks } = await getAllRecords();
  const task = tasks.find((t) => t.id === decodeURIComponent(id));
  if (!task) notFound();
  return (
    <>
      <Link href="/tasks" className="text-sm text-gold-ink hover:underline">← All tasks</Link>
      <div className="mt-4">
        <PageHeader kicker={`Task ${task.id}`} title={task.title}>
          <div className="flex flex-wrap items-center gap-2">
            <Pill>{task.priority}</Pill>
            <Pill>{task.status}</Pill>
            <Link href={`/tasks?show=all&owner=${encodeURIComponent(task.owner)}`} className="text-sm underline-offset-4 hover:underline">{task.owner}</Link>
            {task.updated ? <span className="text-sm text-ink-faint">Updated {formatWhen(task.updated)}</span> : null}
          </div>
        </PageHeader>
      </div>
      <div className="paper-card p-5 sm:p-7">
        <FieldList data={task.data} skip={["id", "title", "status", "priority", "owner"]} />
      </div>
    </>
  );
}
