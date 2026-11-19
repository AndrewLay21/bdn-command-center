import { NextResponse } from "next/server";
import { ownerGuard } from "@/lib/api-auth";
import { T3Error, T3Session, getCapabilities, listAllThreads, resolveProvider, t3Config } from "@/lib/t3";
import { agentMapping } from "@/lib/t3-agents";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/t3/threads?agent=<id> — the agent's T3 threads (newest first), filtered by its provider. */
export async function GET(req: Request) {
  const denied = await ownerGuard();
  if (denied) return denied;

  const agentId = new URL(req.url).searchParams.get("agent") ?? "";
  const mapping = agentMapping(agentId);
  if (!mapping) return NextResponse.json({ connected: false, threads: [] });

  const cfg = t3Config();
  if (!cfg) return NextResponse.json({ connected: true, offline: true, reason: "T3 is not configured on this site yet.", threads: [] });

  let session: T3Session | null = null;
  try {
    session = await T3Session.open(cfg);
    const caps = await getCapabilities(session);
    const provider = resolveProvider(caps, mapping.provider);
    if (!provider) {
      return NextResponse.json({ connected: true, offline: false, provider: null, reason: "That provider is not turned on in T3 right now.", threads: [] });
    }
    const all = await listAllThreads(session);
    const threads = all
      .filter((t) => t.providerInstanceId === provider.providerInstanceId)
      .map((t) => ({ threadId: t.threadId, title: t.title, status: t.status, link: t.link, model: t.model }));
    return NextResponse.json({ connected: true, offline: false, provider: provider.displayName, threads });
  } catch (err) {
    const e = err as T3Error;
    return NextResponse.json({ connected: true, offline: true, reason: e.message || "T3 unreachable.", threads: [] }, { status: 502 });
  } finally {
    await session?.close();
  }
}
