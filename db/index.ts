import { neon } from "@neondatabase/serverless";
import { getConnectionString } from "@netlify/database";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import { sql } from "drizzle-orm";
import * as schema from "./schema";
import { loadSeedRecords, toRows } from "@/lib/seed-data";

/**
 * Netlify DB connection string: NETLIFY_DATABASE_URL (older name) or NETLIFY_DB_URL if set,
 * otherwise whatever @netlify/database provides for this deploy (production DB or a preview branch).
 * Returns "" when there is no database (local preview reads data/records.json instead).
 */
export function databaseUrl(): string {
  const fromEnv = (process.env.NETLIFY_DATABASE_URL || process.env.NETLIFY_DB_URL || "").trim();
  if (fromEnv) return fromEnv;
  try {
    return (getConnectionString() || "").trim();
  } catch {
    return "";
  }
}

export type Db = NeonHttpDatabase<typeof schema>;
let cached: Db | null = null;
let ready: Promise<unknown> | null = null;

/** Returns null when no database is configured (local preview reads data/records.json directly). */
export async function getDb(): Promise<Db | null> {
  const url = databaseUrl();
  if (!url) return null;
  if (!cached) cached = drizzle(neon(url), { schema });
  if (!ready) {
    const db = cached;
    ready = ensureSchemaAndSeed(db).catch((err) => {
      ready = null;
      throw err;
    });
  }
  await ready;
  return cached;
}

const DDL = [
  `CREATE TABLE IF NOT EXISTS tasks (id text PRIMARY KEY, title text NOT NULL, status text NOT NULL DEFAULT '', owner text NOT NULL DEFAULT '', priority text NOT NULL DEFAULT '', project text NOT NULL DEFAULT '', deadline text, updated text, data jsonb NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS portfolio_items (id text PRIMARY KEY, title text NOT NULL, status text NOT NULL DEFAULT '', owner text NOT NULL DEFAULT '', priority text NOT NULL DEFAULT '', lane text NOT NULL DEFAULT '', type text NOT NULL DEFAULT '', updated text, data jsonb NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS tickets (id text PRIMARY KEY, code text NOT NULL DEFAULT '', title text NOT NULL, status text NOT NULL DEFAULT '', agent text NOT NULL DEFAULT '', priority text NOT NULL DEFAULT '', deadline text, updated text, data jsonb NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS login_attempts (id serial PRIMARY KEY, ip_hash text NOT NULL, ok boolean NOT NULL, at timestamptz NOT NULL DEFAULT now())`,
  `CREATE INDEX IF NOT EXISTS login_attempts_ip_at ON login_attempts (ip_hash, at)`,
];

/** Creates tables if missing and loads the recovered records once, only into empty tables. Never overwrites rows. */
export async function ensureSchemaAndSeed(db: Db): Promise<{ seeded: string[] }> {
  for (const stmt of DDL) await db.execute(sql.raw(stmt));
  const seeded: string[] = [];
  const rows = toRows(loadSeedRecords());
  const count = async (table: string) =>
    Number(((await db.execute(sql.raw(`SELECT count(*)::int AS n FROM ${table}`))) as unknown as { rows: { n: number }[] }).rows[0]?.n ?? 0);

  if ((await count("tasks")) === 0) {
    await insertChunks(rows.tasks, (chunk) => db.insert(schema.tasks).values(chunk).onConflictDoNothing());
    seeded.push("tasks");
  }
  if ((await count("portfolio_items")) === 0) {
    await insertChunks(rows.portfolio, (chunk) => db.insert(schema.portfolioItems).values(chunk).onConflictDoNothing());
    seeded.push("portfolio_items");
  }
  if ((await count("tickets")) === 0) {
    await insertChunks(rows.tickets, (chunk) => db.insert(schema.tickets).values(chunk).onConflictDoNothing());
    seeded.push("tickets");
  }
  return { seeded };
}

async function insertChunks<T>(items: T[], run: (chunk: T[]) => PromiseLike<unknown>) {
  for (let i = 0; i < items.length; i += 50) await run(items.slice(i, i + 50));
}
