import { NextResponse } from "next/server";
import { ownerGuard } from "@/lib/api-auth";
import {
  T3Error,
  T3Session,
  getCapabilities,
  launchThread,
  listAllThreads,
  resolveProvider,
  sendToThread,
  t3Config,
} from "@/lib/t3";
import { agentMapping } from "@/lib/t3-agents";
import { agentById } from "@/lib/team";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/t3/send  { agentId, message, threadId? }
 * Sends to the given thread, or to the agent's newest thread, or launches a new
 * thread on the agent's provider when none exists. Returns the thread id to open.
 */
export async function POST(req: Request) {
  const denied = await ownerGuard();
  if (denied) return denied;

  let body: { agentId?: string; message?: string; threadId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }

  const agentId = (body.agentId ?? "").trim();
  const message = (body.message ?? "").trim();
  if (!agentId || !message) return NextResponse.json({ error: "agentId and message are required." }, { status: 400 });
  if (message.length > 120_000) return NextResponse.json({ error: "Message is too long." }, { status: 400 });

  const mapping = agentMapping(agentId);
  if (!mapping) return NextResponse.json({ connected: false, error: "This agent is not connected to T3." }, { status: 409 });

  const cfg = t3Config();
  if (!cfg) return NextResponse.json({ offline: true, reason: "T3 is not configured on this site yet." }, { status: 503 });

  let session: T3Session | null = null;
  try {
    session = await T3Session.open(cfg);
    const caps = await getCapabilities(session);
    const provider = resolveProvider(caps, mapping.provider);
    if (!provider) return NextResponse.json({ offline: false, reason: "That provider is not turned on in T3 right now." }, { status: 409 });

    // 1) explicit thread, 2) the agent's newest matching thread, else 3) launch a new one.
    let threadId = (body.threadId ?? "").trim();
    if (!threadId) {
      const mine = (await listAllThreads(session)).filter((t) => t.providerInstanceId === provider.providerInstanceId);
      threadId = mine[0]?.threadId ?? "";
    }

    if (threadId) {
      await sendToThread(session, threadId, message);
      return NextResponse.json({ ok: true, threadId, launched: false });
    }

    const agentName = agentById(agentId)?.name ?? agentId;
    const launched = await launchThread(session, {
      title: `Command Center — ${agentName}`,
      message,
      providerInstanceId: provider.providerInstanceId,
      model: provider.model,
    });
    return NextResponse.json({ ok: true, threadId: launched.threadId, launched: true });
  } catch (err) {
    const e = err as T3Error;
    const status = e.kind === "auth" ? 401 : 502;
    return NextResponse.json({ offline: true, reason: e.message || "T3 unreachable." }, { status });
  } finally {
    await session?.close();
  }
}
