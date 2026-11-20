import { boolean, index, jsonb, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

/** One row per task from the recovered records (data/records.json). `data` keeps every original field. */
export const tasks = pgTable("tasks", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  status: text("status").notNull().default(""),
  owner: text("owner").notNull().default(""),
  priority: text("priority").notNull().default(""),
  project: text("project").notNull().default(""),
  deadline: text("deadline"),
  updated: text("updated"),
  data: jsonb("data").notNull(),
});

export const portfolioItems = pgTable("portfolio_items", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  status: text("status").notNull().default(""),
  owner: text("owner").notNull().default(""),
  priority: text("priority").notNull().default(""),
  lane: text("lane").notNull().default(""),
  type: text("type").notNull().default(""),
  updated: text("updated"),
  data: jsonb("data").notNull(),
});

export const tickets = pgTable("tickets", {
  id: text("id").primaryKey(),
  code: text("code").notNull().default(""),
  title: text("title").notNull(),
  status: text("status").notNull().default(""),
  agent: text("agent").notNull().default(""),
  priority: text("priority").notNull().default(""),
  deadline: text("deadline"),
  updated: text("updated"),
  data: jsonb("data").notNull(),
});

/** Failed and successful sign-in attempts, used for the login rate limit. */
export const loginAttempts = pgTable(
  "login_attempts",
  {
    id: serial("id").primaryKey(),
    ipHash: text("ip_hash").notNull(),
    ok: boolean("ok").notNull(),
    at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("login_attempts_ip_at").on(t.ipHash, t.at)],
);
