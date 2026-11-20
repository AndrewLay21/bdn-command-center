"use client";

import { useEffect, useState } from "react";

export type Draft = { id: string; agentId: string; agentName: string; text: string; at: string };
const KEY = "bdn-cc-drafts-v1";

export function readDrafts(): Draft[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}
export function writeDrafts(drafts: Draft[]) {
  localStorage.setItem(KEY, JSON.stringify(drafts));
  window.dispatchEvent(new Event("bdn-drafts"));
}
export function useDrafts() {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  useEffect(() => {
    const load = () => setDrafts(readDrafts());
    load();
    window.addEventListener("bdn-drafts", load);
    window.addEventListener("storage", load);
    return () => {
      window.removeEventListener("bdn-drafts", load);
      window.removeEventListener("storage", load);
    };
  }, []);
  return drafts;
}
const when = (iso: string) =>
  new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(iso)) + " ET";

export function NotConnected() {
  return (
    <p className="cc-warn" role="note">
      <strong>Not connected yet.</strong> Live messaging to the agents isn&apos;t hooked up. Notes are saved as drafts on this phone or computer only. Nothing is sent.
    </p>
  );
}

export function DraftList({ drafts, showAgent }: { drafts: Draft[]; showAgent?: boolean }) {
  if (!drafts.length) return <p className="cc-sub">No saved drafts yet.</p>;
  return (
    <ul className="cc-drafts">
      {drafts.map((d) => (
        <li key={d.id}>
          <div className="cc-draft-meta">
            <span>{showAgent ? <a href={`/avengers/${d.agentId}`}>{d.agentName}</a> : "Draft"} · {when(d.at)} · not sent</span>
            <button type="button" onClick={() => writeDrafts(readDrafts().filter((x) => x.id !== d.id))}>Delete draft</button>
          </div>
          <p>{d.text}</p>
        </li>
      ))}
    </ul>
  );
}

export function Composer({ agentId, agentName }: { agentId: string; agentName: string }) {
  const [text, setText] = useState("");
  const [saved, setSaved] = useState(false);
  return (
    <form
      className="cc-compose"
      onSubmit={(e) => {
        e.preventDefault();
        const t = text.trim();
        if (!t) return;
        writeDrafts([{ id: crypto.randomUUID(), agentId, agentName, text: t, at: new Date().toISOString() }, ...readDrafts()]);
        setText("");
        setSaved(true);
      }}
    >
      <label>
        <span className="cc-sub">Note for {agentName}</span>
        <textarea value={text} onChange={(e) => { setText(e.target.value); setSaved(false); }} rows={4} placeholder={`What do you want ${agentName} to do?`} />
      </label>
      <div className="cc-compose-row">
        <button className="mc-primary" type="submit" disabled={!text.trim()}>Save draft</button>
        {saved ? <span role="status" className="cc-sub">Saved as a draft. Not sent.</span> : null}
      </div>
    </form>
  );
}

export default function DraftBox({ agentId, agentName }: { agentId: string; agentName: string }) {
  const drafts = useDrafts().filter((d) => d.agentId === agentId);
  return (
    <>
      <NotConnected />
      <Composer agentId={agentId} agentName={agentName} />
      <DraftList drafts={drafts} />
    </>
  );
}
