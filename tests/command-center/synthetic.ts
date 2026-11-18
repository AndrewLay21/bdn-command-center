import { expect, type Page } from "@playwright/test";

export const sections = [
  { label: "Home", hash: "#home", h1: "Home" },
  { label: "Money", hash: "#money", h1: "Money" },
  { label: "Avengers", hash: "#avengers", h1: "Avengers" },
  { label: "Projects", hash: "#projects", h1: "Projects" },
  { label: "Decisions", hash: "#decisions", h1: "Decisions" },
] as const;

const portfolioItem = {
  id: "SYN-001",
  type: "step",
  title: "Synthetic priority fixture",
  lane: "Synthetic lane",
  priority: "First",
  status: "Waiting",
  owner: "Synthetic Owner",
  nextStep: "Synthetic next step",
  doneMeans: "Synthetic completion check",
  note: "Synthetic note",
  proof: "",
  summary: "Synthetic summary",
  related: [],
  sourceDate: "2026-01-01",
  links: [],
  original: null,
};

const projectItem = {
  ...portfolioItem,
  id: "SYN-002",
  type: "work",
  title: "Synthetic project fixture",
};

export const syntheticBodies = {
  portfolio: {
    items: [portfolioItem, projectItem],
    revision: 0,
    savedAt: null,
    history: [],
    importedAt: "2026-01-01",
    historyWindow: "Synthetic window",
  },
  dashboard: {
    tasks: [
      {
        id: "SYN-TASK-001",
        kind: "task",
        title: "Synthetic task fixture",
        owner: "Synthetic Owner",
        status: "Waiting",
        action: "Synthetic action",
        evidence: "",
        notes: "Synthetic note",
        updated: "2026-01-01T00:00:00.000Z",
      },
      {
        id: "SYN-DEC-001",
        kind: "decision",
        title: "Synthetic decision fixture",
        owner: "Synthetic Owner",
        status: "Waiting",
        action: "Synthetic decision action",
        evidence: "",
        notes: "Synthetic note",
        updated: "2026-01-01T00:00:00.000Z",
      },
    ],
    history: [],
    revision: 0,
    checkedAt: "2026-01-01T00:00:00.000Z",
  },
  feed: {
    checkedAt: "2026-01-01T00:00:00.000Z",
    revision: 0,
    snapshot: {
      summary: "Synthetic coach core summary",
      nextActions: ["Synthetic next action"],
      workstreams: [],
    },
  },
  chat: {
    revision: 0,
    configured: false,
    agent: "dex",
    turns: [],
  },
  fallback: { synthetic: true },
};

export function syntheticBody(pathname: string) {
  if (pathname === "/api/portfolio") return syntheticBodies.portfolio;
  if (pathname === "/api/dashboard") return syntheticBodies.dashboard;
  if (pathname === "/api/coach-core-sync") return syntheticBodies.feed;
  if (pathname === "/api/dashboard-chat") return syntheticBodies.chat;
  return syntheticBodies.fallback;
}

const syntheticPng = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

export async function installReadOnlySyntheticRoutes(page: Page) {
  const writes: string[] = [];
  page.on("request", (request) => {
    const method = request.method();
    if (method !== "GET" && method !== "HEAD") writes.push(`${method} ${request.url()}`);
  });
  await page.route("**/api/**", async (route) => {
    const request = route.request();
    if (request.method() !== "GET" && request.method() !== "HEAD") {
      await route.abort("blockedbyclient");
      return;
    }
    const url = new URL(request.url());
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(syntheticBody(url.pathname)),
    });
  });
  await page.route("**/images/**", async (route) => {
    await route.fulfill({ status: 200, contentType: "image/png", body: syntheticPng });
  });
  return writes;
}

export async function openShell(page: Page, url = "/") {
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await waitForShell(page);
}

export async function waitForShell(page: Page) {
  await expect(page.getByRole("button", { name: "Refresh saved information" })).toBeEnabled({ timeout: 60_000 });
}

export async function useDummyCookie(page: Page) {
  await page.context().addCookies([
    {
      name: "__sites_local_auth",
      value: "1",
      url: "http://127.0.0.1:5173",
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);
}
