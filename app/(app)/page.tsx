import Link from "next/link";
import { Empty, PageHeader, Pill, RecordRow, Section } from "@/components/ui";
import { byPriority, countBy, getAllRecords, isOpenTask, isOpenTicket, todaysTasks, TASK_DONE } from "@/lib/records";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const { tasks, portfolio, tickets, source } = await getAllRecords();
  const today = todaysTasks(tasks);
  const openTasks = tasks.filter(isOpenTask);
  const blocked = openTasks.filter((t) => t.status === "Blocked" || t.status === "Hold").sort(byPriority);
  const openTickets = tickets.filter(isOpenTicket).sort(byPriority);
  const portfolioByStatus = countBy(portfolio, (p) => p.status);
  const dateLabel = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", weekday: "long", month: "long", day: "numeric" }).format(new Date());

  const stats = [
    { label: "Open tasks", value: openTasks.length, href: "/tasks" },
    { label: "Done tasks", value: tasks.filter((t) => TASK_DONE.has(t.status)).length, href: "/tasks?show=done" },
    { label: "Open tickets", value: openTickets.length, href: "/tickets" },
    { label: "Portfolio items", value: portfolio.length, href: "/portfolio?show=all" },
  ];

  return (
    <>
      <PageHeader kicker={dateLabel} title="Good to see you, Coach.">
        Here is what needs eyes today. {source === "file" ? <em>(Preview mode: reading the records file, not the database.)</em> : null}
      </PageHeader>

      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="paper-card block px-5 py-4 transition hover:border-gold">
            <p className="font-serif text-3xl font-bold sm:text-4xl">{s.value}</p>
            <p className="mt-1 text-sm text-ink-soft">{s.label}</p>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <Section title="Today's tasks" action={<Link href="/tasks" className="text-sm text-gold-ink underline-offset-4 hover:underline">All tasks →</Link>}>
            {today.due.length > 0 ? (
              <>
                <p className="mb-2 text-sm font-semibold text-alert">Due today or past due</p>
                <ul className="-mx-3 mb-4 sm:-mx-4">
                  {today.due.map((t) => (
                    <RecordRow key={t.id} href={`/tasks/${encodeURIComponent(t.id)}`} title={t.title} meta={`${t.id} · ${t.owner}`} pills={<><Pill>{t.priority}</Pill><Pill>{t.status}</Pill></>} />
                  ))}
                </ul>
              </>
            ) : null}
            <p className="mb-2 text-sm font-semibold text-ink-soft">Top priority (P0) work that is moving</p>
            {today.moving.length ? (
              <ul className="-mx-3 sm:-mx-4">
                {today.moving.slice(0, 10).map((t) => (
                  <RecordRow key={t.id} href={`/tasks/${encodeURIComponent(t.id)}`} title={t.title} meta={`${t.id} · ${t.owner}`} pills={<Pill>{t.status}</Pill>} />
                ))}
              </ul>
            ) : (
              <Empty>Nothing urgent. Nice.</Empty>
            )}
            {today.moving.length > 10 ? (
              <Link href="/tasks?show=p0" className="mt-3 inline-block text-sm text-gold-ink hover:underline">+ {today.moving.length - 10} more P0 tasks</Link>
            ) : null}
          </Section>

          {blocked.length ? (
            <Section title="Stuck (blocked or on hold)">
              <ul className="-mx-3 sm:-mx-4">
                {blocked.map((t) => (
                  <RecordRow key={t.id} href={`/tasks/${encodeURIComponent(t.id)}`} title={t.title} meta={`${t.id} · ${t.owner}`} pills={<><Pill>{t.priority}</Pill><Pill>{t.status}</Pill></>} />
                ))}
              </ul>
            </Section>
          ) : null}
        </div>

        <div className="space-y-6">
          <Section title="Open tickets" action={<Link href="/tickets" className="text-sm text-gold-ink hover:underline">All →</Link>}>
            {openTickets.length ? (
              <ul className="-mx-3 sm:-mx-4">
                {openTickets.map((t) => (
                  <RecordRow key={t.id} href={`/tickets/${encodeURIComponent(t.id)}`} title={t.title} meta={`${t.code} · ${t.agent}`} pills={<Pill>{t.status}</Pill>} />
                ))}
              </ul>
            ) : (
              <Empty>No open tickets.</Empty>
            )}
          </Section>

          <Section title="Portfolio" action={<Link href="/portfolio?show=all" className="text-sm text-gold-ink hover:underline">All {portfolio.length} →</Link>}>
            <ul className="space-y-2">
              {portfolioByStatus.map(([status, n]) => (
                <li key={status}>
                  <Link href={`/portfolio?status=${encodeURIComponent(status)}&show=all`} className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-paper-deep">
                    <span>{status}</span>
                    <span className="font-serif text-lg font-bold">{n}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Section>
        </div>
      </div>
    </>
  );
}
