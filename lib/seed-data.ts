import fs from "node:fs";
import path from "node:path";

export type RawRecord = Record<string, string | number | boolean | null>;
export type SeedFile = { source: string; recoveredAt: string; tasks: RawRecord[]; portfolio: RawRecord[]; tickets: RawRecord[] };

let cache: SeedFile | null = null;

/** The recovered records (81 tasks, 246 portfolio items, 10 tickets), converted from data/command-center-records-2026-11-18.xlsx. */
export function loadSeedRecords(): SeedFile {
  if (!cache) {
    const file = path.join(process.cwd(), "data", "records.json");
    cache = JSON.parse(fs.readFileSync(file, "utf8")) as SeedFile;
  }
  return cache;
}

const s = (v: unknown) => (v === null || v === undefined ? "" : String(v));
const n = (v: unknown) => (v === null || v === undefined || v === "" ? null : String(v));

export function toRows(seed: SeedFile) {
  return {
    tasks: seed.tasks.map((r) => ({
      id: s(r.id), title: s(r.title), status: s(r.status), owner: s(r.owner), priority: s(r.priority),
      project: s(r.project), deadline: n(r.deadline), updated: n(r.updated), data: r,
    })),
    portfolio: seed.portfolio.map((r) => ({
      id: s(r.id), title: s(r.title), status: s(r.status), owner: s(r.owner), priority: s(r.priority),
      lane: s(r.lane), type: s(r.type), updated: n(r.updatedAt), data: r,
    })),
    tickets: seed.tickets.map((r) => ({
      id: s(r.id), code: s(r.code), title: s(r.title), status: s(r.status), agent: s(r.agent), priority: s(r.priority),
      deadline: n(r.deadline), updated: n(r.updatedAt), data: r,
    })),
  };
}
