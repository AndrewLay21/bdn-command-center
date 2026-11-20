import Link from "next/link";
import { AgentTile, Heading, TaskCard } from "@/components/cc";
import { byPriority, getAllRecords, isOpenTask, isOpenTicket } from "@/lib/records";
import { agents } from "@/lib/team";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { tasks, tickets, portfolio, source } = await getAllRecords();
  const open = tasks.filter(isOpenTask);
  const priorities = open.filter((t) => !["Blocked", "Hold"].includes(t.status)).sort(byPriority).slice(0, 3);
  const receipts = tasks
    .filter((t) => t.status === "Verified complete")
    .sort((a, b) => (Date.parse(b.updated ?? "") || 0) - (Date.parse(a.updated ?? "") || 0))
    .slice(0, 3);
  const blocked = open.filter((t) => ["Blocked", "Hold"].includes(t.status)).sort(byPriority).slice(0, 3);
  const review = open.filter((t) => t.status === "Review").length;
  const team = agents.filter((a) => a.group === "current");
  const dateLabel = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", weekday: "long", month: "long", day: "numeric" }).format(new Date());

  return (
    <>
      <Heading title="Home" intro={`${dateLabel} · Your work, its evidence and the next decision.`} />
      <div className="ex-view">
        <section className="ex-intro">
          <span className="mc-kicker">FOUNDER BRIEF / SAVED RECORDS</span>
          <h2>Coach Drew, here is<br />where things stand.</h2>
          <p>Your priorities, recent receipts and the calls waiting on you. Every status stays tied to its saved record.</p>
          <div className="ex-actions">
            <Link className="mc-primary" href="/inbox">＋ Assign Mission</Link>
            <Link className="ex-secondary" href="/decisions">Review decisions →</Link>
          </div>
        </section>

        <div className="cc-stats">
          <Link href="/tasks"><strong>{open.length}</strong><small>Open tasks</small></Link>
          <Link href="/decisions"><strong>{review}</strong><small>Waiting on review</small></Link>
          <Link href="/tickets"><strong>{tickets.filter(isOpenTicket).length}</strong><small>Open tickets</small></Link>
          <Link href="/portfolio?show=all"><strong>{portfolio.length}</strong><small>Project records</small></Link>
        </div>
        {source === "file" ? <p className="ex-source">Preview mode: reading the saved records file, not the database.</p> : null}

        <section>
          <div className="ex-section-heading"><h2>Saved priorities</h2><span>Saved priority order; confirm the latest founder direction</span></div>
          <div className="ex-cards">{priorities.length ? priorities.map((t) => <TaskCard key={t.id} task={t} />) : <p>No open priorities found in the saved records.</p>}</div>
        </section>

        <div className="mc-grid">
          <section className="mc-panel">
            <div className="mc-panel-heading"><h3>Recent saved receipts</h3></div>
            <p>Recorded as verified complete. Open the record to check its exact scope.</p>
            {receipts.length ? receipts.map((t) => <TaskCard key={t.id} task={t} />) : <p>No verified completions found.</p>}
          </section>
          <section className="mc-panel">
            <div className="mc-panel-heading"><h3>Blocked &amp; waiting</h3></div>
            {blocked.length ? blocked.map((t) => <TaskCard key={t.id} task={t} />) : <p>Nothing blocked in the saved records.</p>}
          </section>
        </div>

        <section>
          <div className="ex-section-heading"><h2>Your command team</h2><Link className="mc-link" href="/avengers">All Avengers →</Link></div>
          <div className="mc-specialists">{team.map((a) => <AgentTile key={a.id} agent={a} />)}</div>
        </section>
      </div>
    </>
  );
}
