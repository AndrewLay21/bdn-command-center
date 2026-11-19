import "server-only";
import { getDb } from "@/db";
import * as schema from "@/db/schema";
import { loadSeedRecords, toRows, type RawRecord } from "@/lib/seed-data";

export type Task = { id: string; title: string; status: string; owner: string; priority: string; project: string; deadline: string | null; updated: string | null; data: RawRecord };
export type PortfolioItem = { id: string; title: string; status: string; owner: string; priority: string; lane: string; type: string; updated: string | null; data: RawRecord };
export type Ticket = { id: string; code: string; title: string; status: string; agent: string; priority: string; deadline: string | null; updated: string | null; data: RawRecord };

export type Source = "database" | "file";

export async function getAllRecords(): Promise<{ tasks: Task[]; portfolio: PortfolioItem[]; tickets: Ticket[]; source: Source }> {
  const db = await getDb();
  if (!db) {
    const rows = toRows(loadSeedRecords());
    return { tasks: rows.tasks, portfolio: rows.portfolio, tickets: rows.tickets, source: "file" };
  }
  const [tasks, portfolio, tickets] = await Promise.all([
    db.select().from(schema.tasks),
    db.select().from(schema.portfolioItems),
    db.select().from(schema.tickets),
  ]);
  return {
    tasks: tasks as Task[],
    portfolio: portfolio as PortfolioItem[],
    tickets: tickets as Ticket[],
    source: "database",
  };
}

/* ---------- Plain-language groupings ---------- */

export const TASK_DONE = new Set(["Verified complete", "Reported complete", "Approved"]);
export const TICKET_DONE = new Set(["Done", "Closed", "Cancelled"]);
const PRIORITY_RANK: Record<string, number> = { P0: 0, P1: 1, P2: 2, High: 0, Normal: 1, Low: 2 };
const STATUS_RANK: Record<string, number> = { "In progress": 0, Review: 1, Pending: 2, Blocked: 3, Hold: 4 };

export function isOpenTask(t: Task) {
  return !TASK_DONE.has(t.status);
}
export function isOpenTicket(t: Ticket) {
  return !TICKET_DONE.has(t.status);
}

export function byPriority<T extends { priority: string; status: string }>(a: T, b: T) {
  return (PRIORITY_RANK[a.priority] ?? 9) - (PRIORITY_RANK[b.priority] ?? 9) || (STATUS_RANK[a.status] ?? 9) - (STATUS_RANK[b.status] ?? 9);
}

/** Today's list: open work that is due today or earlier first, then the open P0 items that are moving (not blocked or on hold). */
export function todaysTasks(tasks: Task[], now = new Date()) {
  const todayEnd = endOfDayNY(now);
  const open = tasks.filter(isOpenTask);
  const due = open.filter((t) => t.deadline && new Date(t.deadline).getTime() <= todayEnd).sort(byPriority);
  const moving = open
    .filter((t) => !due.includes(t) && t.priority === "P0" && ["In progress", "Review", "Pending"].includes(t.status))
    .sort(byPriority);
  return { due, moving };
}

function endOfDayNY(now: Date) {
  const ymd = new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }).format(now);
  // 23:59:59 in New York; offset taken from the current date.
  const offset = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", timeZoneName: "shortOffset" })
    .formatToParts(now)
    .find((p) => p.type === "timeZoneName")?.value.replace("GMT", "") || "-5";
  const sign = offset.startsWith("-") ? "-" : "+";
  const hours = offset.replace(/[+-]/, "").split(":")[0].padStart(2, "0");
  return new Date(`${ymd}T23:59:59${sign}${hours}:00`).getTime();
}

export function countBy<T>(items: T[], key: (item: T) => string) {
  const out = new Map<string, number>();
  for (const item of items) {
    const k = key(item) || "Not set";
    out.set(k, (out.get(k) ?? 0) + 1);
  }
  return [...out.entries()].sort((a, b) => b[1] - a[1]);
}

export function formatWhen(value: string | null | undefined) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", month: "short", day: "numeric", year: "numeric" }).format(d);
}
