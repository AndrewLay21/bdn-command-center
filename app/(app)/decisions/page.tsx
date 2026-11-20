import { Heading, TaskCard, TicketCard } from "@/components/cc";
import { byPriority, getAllRecords, isOpenTicket } from "@/lib/records";

export const dynamic = "force-dynamic";

export default async function Decisions() {
  const { tasks, tickets } = await getAllRecords();
  const review = tasks.filter((t) => t.status === "Review").sort(byPriority);
  const blocked = tasks.filter((t) => t.status === "Blocked" || t.status === "Hold").sort(byPriority);
  const openTickets = tickets.filter(isOpenTicket).sort(byPriority);
  return (
    <>
      <Heading title="Decisions" intro="Saved records waiting on your call. Nothing here deploys, posts or spends." />
      <div className="ex-view">
        <section>
          <div className="ex-section-heading"><h2>Waiting on your review</h2><span>{review.length} saved record(s) marked Review</span></div>
          <div className="ex-cards">{review.length ? review.map((t) => <TaskCard key={t.id} task={t} />) : <p>No records are marked Review.</p>}</div>
        </section>
        <section>
          <div className="ex-section-heading"><h2>Blocked or on hold</h2><span>{blocked.length} record(s)</span></div>
          <div className="ex-cards">{blocked.length ? blocked.map((t) => <TaskCard key={t.id} task={t} />) : <p>Nothing blocked.</p>}</div>
        </section>
        <section>
          <div className="ex-section-heading"><h2>Open task tickets</h2><span>{openTickets.length} ticket(s)</span></div>
          <div className="ex-cards">{openTickets.map((t) => <TicketCard key={t.id} ticket={t} />)}</div>
        </section>
      </div>
    </>
  );
}
