import { NextResponse } from "next/server";
import { ownerGuard } from "@/lib/api-auth";
import { t3Configured } from "@/lib/t3";
import { isAgentConnected } from "@/lib/t3-agents";
import { workers } from "@/lib/team";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Which agents are wired to T3, and whether T3 is configured at all. No secrets returned. */
export async function GET() {
  const denied = await ownerGuard();
  if (denied) return denied;

  return NextResponse.json({
    t3Configured: t3Configured(),
    agents: workers.map((a) => ({ id: a.id, name: a.name, connected: isAgentConnected(a.id) })),
  });
}
