import { NextResponse } from "next/server";
import { ownerGuard } from "@/lib/api-auth";
import { T3Error, T3Session, readThread, t3Config } from "@/lib/t3";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/t3/thread/<threadId> — the messages in one T3 thread. */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const denied = await ownerGuard();
  if (denied) return denied;

  const { id } = await ctx.params;
  if (!id) return NextResponse.json({ error: "Missing thread id." }, { status: 400 });

  const cfg = t3Config();
  if (!cfg) return NextResponse.json({ offline: true, reason: "T3 is not configured on this site yet." }, { status: 503 });

  let session: T3Session | null = null;
  try {
    session = await T3Session.open(cfg);
    const thread = await readThread(session, id);
    return NextResponse.json({ offline: false, thread });
  } catch (err) {
    const e = err as T3Error;
    return NextResponse.json({ offline: true, reason: e.message || "T3 unreachable." }, { status: 502 });
  } finally {
    await session?.close();
  }
}
