import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";

/** Second lock behind the proxy: every private page calls this before reading data. */
export async function requireOwner() {
  const jar = await cookies();
  if (!(await verifySessionToken(jar.get(SESSION_COOKIE)?.value))) redirect("/login");
}

export function safeNext(value: unknown): string {
  const v = typeof value === "string" ? value : "";
  if (!v.startsWith("/") || v.startsWith("//") || v.includes("\\") || v.startsWith("/login")) return "/";
  return v;
}
