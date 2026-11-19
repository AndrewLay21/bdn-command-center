import "server-only";
import { and, eq, gt, lt, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { loginAttempts } from "@/db/schema";
import { hashForLog } from "@/lib/session";

const WINDOW_MS = 15 * 60 * 1000;
export const MAX_FAILURES_PER_IP = 5;
const MAX_FAILURES_GLOBAL = 40;

// Used only when no database is configured (local preview).
const memory: { ip: string; ok: boolean; at: number }[] = [];

export async function loginBlocked(ip: string): Promise<boolean> {
  const since = new Date(Date.now() - WINDOW_MS);
  const ipHash = await hashForLog(ip);
  const db = await getDb();
  if (!db) {
    const recent = memory.filter((m) => !m.ok && m.at > since.getTime());
    return recent.filter((m) => m.ip === ipHash).length >= MAX_FAILURES_PER_IP || recent.length >= MAX_FAILURES_GLOBAL;
  }
  const [mine] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(loginAttempts)
    .where(and(eq(loginAttempts.ipHash, ipHash), eq(loginAttempts.ok, false), gt(loginAttempts.at, since)));
  if ((mine?.n ?? 0) >= MAX_FAILURES_PER_IP) return true;
  const [all] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(loginAttempts)
    .where(and(eq(loginAttempts.ok, false), gt(loginAttempts.at, since)));
  return (all?.n ?? 0) >= MAX_FAILURES_GLOBAL;
}

export async function recordLogin(ip: string, ok: boolean) {
  const ipHash = await hashForLog(ip);
  const db = await getDb();
  if (!db) {
    memory.push({ ip: ipHash, ok, at: Date.now() });
    return;
  }
  await db.insert(loginAttempts).values({ ipHash, ok });
  // Keep the table small: forget attempts older than a day.
  await db.delete(loginAttempts).where(lt(loginAttempts.at, new Date(Date.now() - 24 * 60 * 60 * 1000)));
}
