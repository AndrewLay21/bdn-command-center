import Link from "next/link";
import { notFound } from "next/navigation";
import { TaskCard, TicketCard } from "@/components/cc";
import { Portrait } from "@/components/portrait";
import DraftBox from "@/components/draft-box";
import AgentMessaging from "@/components/agent-messaging";
import { isAgentConnected } from "@/lib/t3-agents";
import { byPriority, getAllRecords, isOpenTask, isOpenTicket } from "@/lib/records";
import { agentById, agents, ownerMatches } from "@/lib/team";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return { title: agentById(id)?.name ?? "Avenger" };
}

export default async function AgentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const agent = agentById(id);
  if (!agent) notFound();
  const { tasks, tickets, portfolio } = await getAllRecords();
  const myTasks = tasks.filter((t) => ownerMatches(t.owner, agent));
  const openTasks = myTasks.filter(isOpenTask).sort(byPriority);
  const doneTasks = myTasks.filter((t) => !isOpenTask(t));
  const myTickets = tickets.filter((t) => ownerMatches(t.agent, agent));
  const myProjects = portfolio.filter((p) => ownerMatches(p.owner, agent));
  const idx = agents.findIndex((a) => a.id === agent.id);
  const prev = agents[(idx - 1 + agents.length) % agents.length];
  const next = agents[(idx + 1) % agents.length];

  return (
    <div className="ex-view cc-agent">
      <Link className="mc-link" href="/avengers">← All Avengers</Link>
      <section className="cc-agent-hero">
        <Portrait agent={agent} variant="card" size={168} />
        <div>
          <span className="mc-kicker">{agent.group === "current" ? "GROK BOT TEAM" : agent.group === "founder" ? "FOUNDER" : "ORIGINAL AVENGERS"}</span>
          <h1>{agent.name}</h1>
          <p className="cc-role">{agent.role}</p>
          <p className="cc-platform">Runs on {agent.platform}</p>
          {agent.note ? <p className="cc-platform">{agent.note}</p> : null}
        </div>
      </section>

      <dl className="cc-facts">
        <div><dt>Open work</dt><dd>{openTasks.length + myTickets.filter(isOpenTicket).length}</dd></div>
        <div><dt>Done</dt><dd>{doneTasks.length}</dd></div>
        <div><dt>Projects</dt><dd>{myProjects.length}</dd></div>
      </dl>

      <section className="mc-panel">
        <h3>Message {agent.name}</h3>
        {isAgentConnected(agent.id) ? (
          <AgentMessaging agentId={agent.id} agentName={agent.name} />
        ) : (
          <DraftBox agentId={agent.id} agentName={agent.name} />
        )}
      </section>

      <section>
        <div className="ex-section-heading"><h2>Current work</h2><span>From saved records</span></div>
        <div className="ex-cards">
          {myTickets.filter(isOpenTicket).map((t) => <TicketCard key={t.id} ticket={t} />)}
          {openTasks.map((t) => <TaskCard key={t.id} task={t} />)}
          {!openTasks.length && !myTickets.filter(isOpenTicket).length ? <p>No open work is saved under {agent.name} yet.</p> : null}
        </div>
      </section>

      {doneTasks.length ? (
        <section>
          <details className="mc-panel">
            <summary>Records and receipts ({doneTasks.length})</summary>
            <div className="ex-cards">{doneTasks.map((t) => <TaskCard key={t.id} task={t} />)}</div>
          </details>
        </section>
      ) : null}

      {myProjects.length ? (
        <section className="mc-panel">
          <h3>Projects</h3>
          {myProjects.map((p) => (
            <Link key={p.id} className="mc-decision" href={`/portfolio/${encodeURIComponent(p.id)}`}><span>{p.title}<small className="cc-sub"> · {p.status}</small></span><span aria-hidden="true">→</span></Link>
          ))}
        </section>
      ) : null}

      <nav className="cc-prevnext" aria-label="Other Avengers">
        <Link href={`/avengers/${prev.id}`}><Portrait agent={prev} size={32} /> {prev.name}</Link>
        <Link href={`/avengers/${next.id}`}>{next.name} <Portrait agent={next} size={32} /></Link>
      </nav>
    </div>
  );
}
