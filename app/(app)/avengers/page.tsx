import Link from "next/link";
import { Heading } from "@/components/cc";
import { Portrait } from "@/components/portrait";
import { agentById, agents, type Agent } from "@/lib/team";

function Card({ agent }: { agent: Agent }) {
  return (
    <article className="ex-agent">
      <Link className="mc-agent-card" href={`/avengers/${agent.id}`}>
        <Portrait agent={agent} variant="card" size={88} />
        <div>
          <h3>{agent.name}</h3>
          <p>{agent.role}</p>
          <small>Runs on {agent.platform}</small>
        </div>
        <span className="mc-code">Open page →</span>
      </Link>
    </article>
  );
}

export default function Avengers() {
  const coach = agentById("coach")!;
  return (
    <>
      <Heading title="Avengers" intro="Roster, assignments and proof. Live messaging is not connected yet." />
      <div className="ex-view">
        <section className="ex-intro">
          <span className="mc-kicker">AVENGERS / WHO IS DOING WHAT</span>
          <h2>Your roster, their assignments,<br />and proof of results.</h2>
          <p>Tap any Avenger to open their own page: portrait, role, saved work and a message box.</p>
        </section>
        <section aria-label="Founder">
          <div className="ex-founders"><Link className="ex-owner" href="/avengers/coach"><Portrait agent={coach} /><span>Coach Drew<small>Founder · final release authority</small></span></Link></div>
        </section>
        <section>
          <div className="ex-section-heading"><h2>Grok Bot team</h2><span>Your current team</span></div>
          <div className="mc-directory-grid">{agents.filter((a) => a.group === "current").map((a) => <Card key={a.id} agent={a} />)}</div>
        </section>
        <section>
          <div className="ex-section-heading"><h2>Original Avengers</h2><span>From the first Command Center</span></div>
          <div className="mc-directory-grid">{agents.filter((a) => a.group === "original").map((a) => <Card key={a.id} agent={a} />)}</div>
        </section>
        <section className="mc-panel">
          <h3>Platforms are tools, not workers</h3>
          <p>A platform name on a card does not mean that agent is connected or allowed to spend. Assignment, running and verification are separate facts.</p>
        </section>
      </div>
    </>
  );
}
