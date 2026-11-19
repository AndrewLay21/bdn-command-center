import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { expect, test, type Page, type Request } from "@playwright/test";
import { openShell, syntheticBody, syntheticBodies, useDummyCookie, waitForShell } from "./synthetic";

const draft = "Synthetic draft only";
const evidencePath = path.resolve("evidence/2026-11-17-configured-true.json");

type Attempt = {
  method: string;
  host: string;
  path: string;
  action: "fulfilled-synthetic" | "continued" | "aborted";
  bodyKeys?: string[];
  agent?: string;
  syntheticMessage?: boolean;
};

function dexForm(page: Page) {
  return page.locator("form.dc-composer").filter({ has: page.locator("#dashboard-chat-draft-dex") });
}

function summarize(request: Request): Attempt {
  const url = new URL(request.url());
  const attempt: Attempt = { method: request.method(), host: url.hostname, path: url.pathname, action: "aborted" };
  const raw = request.postData();
  if (!raw) return attempt;
  try {
    const body = JSON.parse(raw) as { agent?: unknown; message?: unknown };
    attempt.bodyKeys = Object.keys(body).sort();
    if (typeof body.agent === "string") attempt.agent = body.agent;
    attempt.syntheticMessage = body.message === draft;
  } catch {
    attempt.bodyKeys = ["unparsed"];
  }
  return attempt;
}

test("configured chat stays local and money amounts stay unavailable", async ({ page }) => {
  const attempts: Attempt[] = [];
  await useDummyCookie(page);
  await page.route("**/*", async (route) => {
    const request = route.request();
    if (request.resourceType() === "websocket") {
      await route.continue();
      return;
    }
    const url = new URL(request.url());
    const local = url.hostname === "127.0.0.1" || url.hostname === "localhost";
    const provider = /openai|chatgpt\.com|anthropic|generativelanguage|googleapis/i.test(url.hostname);
    const write = request.method() !== "GET" && request.method() !== "HEAD";
    if (!local || provider || write) {
      attempts.push(summarize(request));
      await route.abort("blockedbyclient");
      return;
    }
    if (url.pathname === "/api/dashboard-chat") {
      attempts.push({ method: request.method(), host: url.hostname, path: url.pathname, action: "fulfilled-synthetic" });
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ...syntheticBodies.chat, configured: true, agent: url.searchParams.get("agent") ?? "dex", turns: [] }),
      });
      return;
    }
    if (url.pathname.startsWith("/api/")) {
      attempts.push({ method: request.method(), host: url.hostname, path: url.pathname, action: "fulfilled-synthetic" });
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(syntheticBody(url.pathname)) });
      return;
    }
    attempts.push({ method: request.method(), host: url.hostname, path: url.pathname, action: "continued" });
    await route.continue();
  });

  await openShell(page, "/#money");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Money");
  await expect(page.getByText("API connection configured. This does not verify external agent execution.")).toBeVisible();
  for (const label of ["Revenue received", "Expenses paid", "Cash balance"]) {
    await expect(page.locator("article").filter({ hasText: label }).locator(".ex-unavailable")).toHaveText("Unavailable");
  }
  await expect(page.getByText("Viewing this screen makes no paid model request.")).toBeVisible();

  const nav = page.getByRole("navigation", { name: "Main navigation" });
  await nav.getByText("More tools", { exact: true }).click();
  await nav.getByRole("button", { name: "Start Here", exact: true }).click();
  await expect(page).toHaveURL(/#start-here$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Agent chats");
  await expect(page.getByText("not a direct connection to the external agent")).toBeVisible();
  await expect(page.getByRole("group", { name: "Where to get your reply" })).toHaveCount(0);
  const startDex = dexForm(page);
  const startSend = startDex.getByRole("button", { name: "Send", exact: true });
  await expect(startSend).toBeDisabled();
  await startDex.locator("textarea").fill(draft);
  await expect(startSend).toBeEnabled();
  await startDex.locator("textarea").press("Shift+Enter");
  await expect(startDex.locator("textarea")).toHaveValue(`${draft}\n`);
  await startDex.locator("textarea").press("Enter");
  await expect(page.getByRole("alert").filter({ hasText: "Check saved conversation" })).toBeVisible();
  await expect(startDex.locator("textarea")).toHaveValue(`${draft}\n`);

  await nav.getByRole("button", { name: "Dashboard Chat", exact: true }).click();
  await expect(page).toHaveURL(/#dashboard-chat$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Chat options");
  await expect(page.getByText("not connected to your separate Drew 2.0, Muse or Codex conversations")).toBeVisible();
  const modes = page.getByRole("group", { name: "Where to get your reply" });
  await expect(modes.getByRole("button", { name: /Use in ChatGPT/ })).toHaveAttribute("aria-pressed", "true");
  await expect(modes.getByRole("button", { name: /Reply in dashboard/ })).toHaveAttribute("aria-pressed", "false");
  const chatDex = dexForm(page);
  await chatDex.locator("textarea").fill(draft);
  await chatDex.getByRole("button", { name: "Use in ChatGPT" }).click();
  await expect(page.getByRole("alert").last()).toBeVisible();
  await expect(page.getByRole("link", { name: "Open ChatGPT" })).toHaveCount(0);
  await modes.getByRole("button", { name: /Reply in dashboard/ }).click();
  await expect(modes.getByRole("button", { name: /Reply in dashboard/ })).toHaveAttribute("aria-pressed", "true");
  await expect(chatDex.locator("textarea")).toHaveValue(draft);
  await chatDex.getByRole("button", { name: "Send", exact: true }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Check saved conversation" }).last()).toBeVisible();
  await expect(chatDex.locator("textarea")).toHaveValue(draft);

  await nav.getByRole("button", { name: "Avengers", exact: true }).click();
  await waitForShell(page);
  await page.getByRole("button", { name: "Chat with Dex the Best" }).click();
  await expect(page).toHaveURL(/#start-here$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Agent chats");

  const aborted = attempts.filter((attempt) => attempt.action === "aborted");
  const escaped = attempts.filter((attempt) => attempt.host !== "127.0.0.1" && attempt.host !== "localhost");
  expect(escaped).toEqual([]);
  expect(aborted.map((attempt) => `${attempt.method} ${attempt.path}`)).toEqual([
    "POST /api/dashboard-chat",
    "POST /api/dashboard-chat/handoff",
    "POST /api/dashboard-chat",
  ]);
  expect(aborted.every((attempt) => attempt.agent === "dex" && attempt.syntheticMessage === true)).toBe(true);
  expect(attempts.some((attempt) => attempt.action === "continued" && attempt.method !== "GET" && attempt.method !== "HEAD")).toBe(false);
  const report = {
    configured: true,
    liveBackend: false,
    providerRequests: 0,
    escapedHosts: escaped.map((attempt) => attempt.host),
    aborted,
    money: "API connection configured; three amounts Unavailable",
    startHere: "Dashboard API mode only. Enter would POST /api/dashboard-chat. Shift+Enter does not send.",
    dashboardChat: "ChatGPT mode would POST /api/dashboard-chat/handoff. Reply in dashboard would POST /api/dashboard-chat.",
    agentSpecific: "Chat with Dex the Best returns to #start-here and does not open a separate agent conversation.",
  };
  await mkdir(path.dirname(evidencePath), { recursive: true });
  await writeFile(evidencePath, `${JSON.stringify(report, null, 2)}\n`);
});
