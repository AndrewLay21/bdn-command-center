import Link from "next/link";
import { notFound } from "next/navigation";
import { FieldList, PageHeader, Pill } from "@/components/ui";
import { formatWhen, getAllRecords } from "@/lib/records";

export const dynamic = "force-dynamic";

export default async function TicketDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { tickets } = await getAllRecords();
  const key = decodeURIComponent(id);
  const ticket = tickets.find((t) => t.id === key || t.code === key);
  if (!ticket) notFound();
  return (
    <>
      <Link href="/tickets" className="text-sm text-gold-ink hover:underline">← All tickets</Link>
      <div className="mt-4">
        <PageHeader kicker={`Ticket ${ticket.code}`} title={ticket.title}>
          <div className="flex flex-wrap items-center gap-2">
            <Pill>{ticket.priority}</Pill>
            <Pill>{ticket.status}</Pill>
            <span className="text-sm">{ticket.agent}</span>
            {ticket.updated ? <span className="text-sm text-ink-faint">Updated {formatWhen(ticket.updated)}</span> : null}
          </div>
        </PageHeader>
      </div>
      <div className="paper-card p-5 sm:p-7">
        <FieldList data={ticket.data} skip={["id", "code", "title", "status", "priority", "agent"]} />
      </div>
    </>
  );
}
