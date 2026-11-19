"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Composer, DraftList, NotConnected, useDrafts } from "@/components/draft-box";

type ThreadRow = { threadId: string; title: string; status: string; link?: string; model?: string };
type ThreadsResp = { connected: boolean; offline?: boolean; reason?: string; provider?: string | null; threads: ThreadRow[] };

/** Pull a readable role + text out of a T3 message/turn item without assuming one exact shape. */
function readMessage(raw: unknown): { role: string; text: string } | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const role = String(o.role ?? o.author ?? o.kind ?? o.type ?? "").toLowerCase() || "message";
  let text = "";
  const c = o.text ?? o.content ?? o.body ?? o.message;
  if (typeof c === "string") text = c;
  else if (Array.isArray(c)) text = c.map((p) => (typeof p === "string" ? p : typeof (p as Record<string, unknown>)?.text === "string" ? (p as Record<string, string>).text : "")).filter(Boolean).join("\n");
  if (!text && typeof o.summary === "string") text = o.summary;
  if (!text) return null;
  return { role, text };
}

function extractMessages(thread: Record<string, unknown> | null | undefined): { role: string; text: string }[] {
  if (!thread) return [];
  const arr = (Array.isArray(thread.messages) ? thread.messages : Array.isArray(thread.items) ? thread.items : []) as unknown[];
  return arr.map(readMessage).filter((m): m is { role: string; text: string } => m !== null);
}

export default function AgentMessaging({ agentId, agentName }: { agentId: string; agentName: string }) {
  const [state, setState] = useState<ThreadsResp | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [messages, setMessages] = useState<{ role: string; text: string }[]>([]);
  const [loadingThread, setLoadingThread] = useState(false);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadThreads = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch(`/api/t3/threads?agent=${encodeURIComponent(agentId)}`, { cache: "no-store" });
      const data = (await res.json()) as ThreadsResp;
      setState(data);
      if (data.offline) setError(data.reason ?? "T3 is offline.");
    } catch {
      setError("Could not reach the Command Center server.");
      setState({ connected: true, offline: true, threads: [] });
    }
  }, [agentId]);

  const loadThread = useCallback(async (threadId: string) => {
    setOpenId(threadId);
    setLoadingThread(true);
    try {
      const res = await fetch(`/api/t3/thread/${encodeURIComponent(threadId)}`, { cache: "no-store" });
      const data = (await res.json()) as { offline?: boolean; reason?: string; thread?: Record<string, unknown> };
      if (data.offline) {
        setError(data.reason ?? "T3 is offline.");
        setMessages([]);
      } else {
        setMessages(extractMessages(data.thread));
      }
    } catch {
      setError("Could not load that thread.");
    } finally {
      setLoadingThread(false);
    }
  }, []);

  useEffect(() => {
    loadThreads();
    return () => {
      if (pollRef.current) clearTimeout(pollRef.current);
    };
  }, [loadThreads]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const msg = text.trim();
    if (!msg) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/t3/send", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ agentId, message: msg, threadId: openId ?? undefined }),
      });
      const data = (await res.json()) as { ok?: boolean; threadId?: string; offline?: boolean; reason?: string; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.reason ?? data.error ?? "Could not send.");
        return;
      }
      setText("");
      await loadThreads();
      if (data.threadId) {
        await loadThread(data.threadId);
        pollForReply(data.threadId, messages.length);
      }
    } catch {
      setError("Could not send.");
    } finally {
      setSending(false);
    }
  }

  /** The agent's reply lands asynchronously; re-read the thread a few times until it grows or settles. */
  function pollForReply(threadId: string, baseline: number, tries = 0) {
    if (tries >= 10) return;
    pollRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/t3/thread/${encodeURIComponent(threadId)}`, { cache: "no-store" });
        const data = (await res.json()) as { thread?: Record<string, unknown>; offline?: boolean };
        if (!data.offline && data.thread) {
          const next = extractMessages(data.thread);
          setMessages(next);
          const status = String((data.thread as Record<string, unknown>).status ?? "");
          if (next.length > baseline && (status === "idle" || status === "completed" || status === "")) return;
        }
      } catch {
        /* ignore and keep polling */
      }
      pollForReply(threadId, baseline, tries + 1);
    }, 3000);
  }

  // Offline / server error → fall back to the draft-only box so nothing is lost.
  if (state?.offline || (error && !state?.threads.length && state?.offline !== false)) {
    return (
      <>
        <p className="cc-warn" role="note">
          <strong>T3 is offline right now.</strong> {error ? `(${error}) ` : ""}Your note is saved as a draft on this device only — nothing is sent. It will not auto-send when T3 comes back.
        </p>
        <Composer agentId={agentId} agentName={agentName} />
        <OfflineDrafts agentId={agentId} />
      </>
    );
  }

  const threads = state?.threads ?? [];

  return (
    <div className="cc-live">
      <form className="cc-compose" onSubmit={send}>
        <label>
          <span className="cc-sub">Message {agentName}{state?.provider ? ` · via ${state.provider}` : ""}</span>
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={4} placeholder={`What do you want ${agentName} to do?`} />
        </label>
        <div className="cc-compose-row">
          <button className="mc-primary" type="submit" disabled={sending || !text.trim()}>{sending ? "Sending…" : "Send to T3"}</button>
          {openId ? <span className="cc-sub">Replying in the open thread</span> : <span className="cc-sub">Starts or continues a thread</span>}
          <button type="button" onClick={loadThreads}>Refresh</button>
        </div>
        {error ? <p className="cc-sub" role="status">{error}</p> : null}
      </form>

      <div className="cc-threads">
        <h4 className="cc-sub">Threads ({threads.length})</h4>
        {threads.length === 0 ? <p className="cc-sub">No threads with {agentName} yet. Send a message to start one.</p> : null}
        <ul className="cc-drafts">
          {threads.map((t) => (
            <li key={t.threadId}>
              <div className="cc-draft-meta">
                <button type="button" onClick={() => loadThread(t.threadId)}>{t.title || t.threadId}</button>
                <span className="cc-sub">{t.status}{t.link ? <> · <a href={t.link} target="_blank" rel="noreferrer">open in T3</a></> : null}</span>
              </div>
              {openId === t.threadId ? (
                <div className="cc-thread-messages">
                  {loadingThread ? <p className="cc-sub">Loading…</p> : null}
                  {!loadingThread && messages.length === 0 ? <p className="cc-sub">No messages to show.</p> : null}
                  {messages.map((m, i) => (
                    <p key={i}><strong className="cc-sub">{m.role}:</strong> {m.text}</p>
                  ))}
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function OfflineDrafts({ agentId }: { agentId: string }) {
  const drafts = useDrafts().filter((d) => d.agentId === agentId);
  return <DraftList drafts={drafts} />;
}
