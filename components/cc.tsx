import Link from "next/link";
import { Portrait } from "@/components/portrait";
import { formatWhen, type Task, type Ticket } from "@/lib/records";
import type { Agent } from "@/lib/team";

export function Heading({ eyebrow = "BIG DREAMS NETWORK · COACH DREW", title, intro, agent }: { eyebrow?: string; title: string; intro?: React.ReactNode; agent?: Agent }) {
  return (
    <div className="pc-heading">
      <div>
        <span className="pc-eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        {intro ? <p>{intro}</p> : null}
      </div>
      {agent ? <Portrait agent={agent} size={44} /> : null}
    </div>
  );
}

const text = (v: unknown) => (v === null || v === undefined ? "" : String(v));

export function TaskCard({ task }: { task: Task }) {
  const next = text(task.data.action) || text(task.data.deliverable);
  const evidence = text(task.data.evidence);
  return (
    <article className="ex-record">
      <div className="ex-owner"><Portrait owner={task.owner} size={32} /><span>{task.owner || "Owner unavailable"}<small>{task.id} · {task.status}{task.priority ? ` · ${task.priority}` : ""}</small></span></div>
      <h3><Link href={`/tasks/${encodeURIComponent(task.id)}`}>{task.title} →</Link></h3>
      <p>{next || "Next action not recorded."}</p>
      {evidence ? (
        <details><summary>Evidence{task.updated ? ` · ${formatWhen(task.updated)}` : ""}</summary><p className="mc-evidence">{evidence}</p></details>
      ) : null}
    </article>
  );
}

export function TicketCard({ ticket }: { ticket: Ticket }) {
  return (
    <article className="ex-record">
      <div className="ex-owner"><Portrait owner={ticket.agent} size={32} /><span>{ticket.agent && ticket.agent !== "None" ? ticket.agent : "Not assigned"}<small>{ticket.code || ticket.id} · {ticket.status}</small></span></div>
      <h3><Link href={`/tickets/${encodeURIComponent(ticket.id)}`}>{ticket.title} →</Link></h3>
      {ticket.deadline ? <p>Deadline {formatWhen(ticket.deadline)}</p> : null}
    </article>
  );
}

export function AgentTile({ agent }: { agent: Agent }) {
  return (
    <Link href={`/avengers/${agent.id}`} className="mc-specialist">
      <Portrait agent={agent} size={52} />
      <span><strong>{agent.name}</strong><small>{agent.role}</small><span className="mc-code">Open {agent.name}&apos;s page</span></span>
      <span aria-hidden="true">→</span>
    </Link>
  );
}
