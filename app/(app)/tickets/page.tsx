import type { Metadata } from "next";
import { Empty, FilterTabs, PageHeader, Pill, RecordRow } from "@/components/ui";
import { byPriority, getAllRecords, isOpenTicket, type Ticket } from "@/lib/records";

export const metadata: Metadata = { title: "Tickets" };
export const dynamic = "force-dynamic";

const FILTERS: Record<string, [string, (t: Ticket) => boolean]> = {
  open: ["Open", isOpenTicket],
  done: ["Done", (t) => !isOpenTicket(t)],
  all: ["All", () => true],
};

export default async function TicketsPage({ searchParams }: { searchParams: Promise<{ show?: string }> }) {
  const { show: rawShow } = await searchParams;
  const show = rawShow && FILTERS[rawShow] ? rawShow : "open";
  const { tickets } = await getAllRecords();
  const list = tickets.filter(FILTERS[show][1]).sort(byPriority);
  return (
    <>
      <PageHeader kicker="Records" title="Tickets">
        One ticket = one job handed to one teammate, with a clear finish line.
      </PageHeader>
      <FilterTabs base="/tickets" current={show} options={Object.entries(FILTERS).map(([k, [label, fn]]) => [k, label, tickets.filter(fn).length])} />
      <div className="paper-card p-2 sm:p-3">
        {list.length ? (
          <ul className="divide-y divide-line">
            {list.map((t) => (
              <RecordRow
                key={t.id}
                href={`/tickets/${encodeURIComponent(t.id)}`}
                title={t.title}
                meta={[t.code, t.agent, t.data.reviewer ? `review: ${t.data.reviewer}` : ""].filter(Boolean).join(" · ")}
                pills={<><Pill>{t.priority}</Pill><Pill>{t.status}</Pill></>}
              />
            ))}
          </ul>
        ) : (
          <Empty>No tickets here.</Empty>
        )}
      </div>
    </>
  );
}
