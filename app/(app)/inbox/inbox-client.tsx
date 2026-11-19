"use client";

import { useState } from "react";
import { Composer, DraftList, NotConnected, useDrafts } from "@/components/draft-box";

export default function InboxClient({ agents }: { agents: { id: string; name: string }[] }) {
  const drafts = useDrafts();
  const [pick, setPick] = useState(agents[0]?.id ?? "");
  const agent = agents.find((a) => a.id === pick) ?? agents[0];
  return (
    <>
      <section className="mc-panel">
        <h3>Assign a mission (draft)</h3>
        <NotConnected />
        <label className="cc-pick">
          <span className="cc-sub">Who is it for?</span>
          <select value={pick} onChange={(e) => setPick(e.target.value)}>
            {agents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </label>
        {agent ? <Composer key={agent.id} agentId={agent.id} agentName={agent.name} /> : null}
      </section>
      <section className="mc-panel">
        <h3>Saved drafts ({drafts.length})</h3>
        <DraftList drafts={drafts} showAgent />
      </section>
    </>
  );
}
