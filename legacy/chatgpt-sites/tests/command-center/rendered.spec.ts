import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { installReadOnlySyntheticRoutes, openShell, sections, useDummyCookie, waitForShell } from "./synthetic";

const axePath = path.resolve("evidence/command-center-playwright/axe-results.json");
let writes: string[] = [];

test.beforeEach(async ({ page }) => {
  await useDummyCookie(page);
  writes = await installReadOnlySyntheticRoutes(page);
});

test.afterEach(() => {
  expect(writes, writes.join("\n")).toEqual([]);
});

function heading(page: import("@playwright/test").Page) {
  return page.getByRole("heading", { level: 1 });
}

function navButton(page: import("@playwright/test").Page, label: string) {
  return page.getByRole("navigation", { name: "Main navigation" }).getByRole("button", { name: label, exact: true });
}

async function expectHeaderColors(page: import("@playwright/test").Page) {
  const measured = await page.locator("header.pc-top").evaluate((header) => {
    const crumb = header.querySelector(":scope > div");
    const current = header.querySelector(":scope > div > b");
    const span = header.querySelector(":scope > div > span");
    const color = (el: Element | null) => (el ? getComputedStyle(el).color : "");
    return {
      crumb: color(crumb),
      current: color(current),
      span: color(span),
      spanDisplay: span ? getComputedStyle(span).display : "",
      background: getComputedStyle(header).backgroundColor,
    };
  });
  expect(measured.crumb, JSON.stringify(measured)).toBe("rgb(190, 196, 207)");
  expect(measured.current, JSON.stringify(measured)).toBe("rgb(236, 238, 242)");
  expect(measured.span, JSON.stringify(measured)).toBe("rgb(190, 196, 207)");
  expect(measured.background, JSON.stringify(measured)).toBe("rgb(16, 16, 18)");
}

async function reloadShell(page: import("@playwright/test").Page) {
  await page.reload({ waitUntil: "domcontentloaded" });
  await waitForShell(page);
}

test("click navigation across the five sections", async ({ page }) => {
  await openShell(page, "/");
  await expect(heading(page)).toHaveText("Agent chats");
  for (const section of sections) {
    await navButton(page, section.label).click();
    await expect(page).toHaveURL(new RegExp(`${section.hash}$`));
    await expect(heading(page)).toHaveText(section.h1);
    await expect(navButton(page, section.label)).toHaveAttribute("aria-current", "page");
    await expectHeaderColors(page);
  }
});

test("deep links open the five sections", async ({ page }) => {
  for (const section of sections) {
    await openShell(page, `/${section.hash}`);
    await expect(page).toHaveURL(new RegExp(`${section.hash}$`));
    await expect(heading(page)).toHaveText(section.h1);
    await expect(navButton(page, section.label)).toHaveAttribute("aria-current", "page");
    await expectHeaderColors(page);
  }
});

test("back and forward move through pushed sections and the deep link", async ({ page }) => {
  await openShell(page, "/");
  await expect(heading(page)).toHaveText("Agent chats");
  for (const section of sections) {
    await navButton(page, section.label).click();
    await expect(heading(page)).toHaveText(section.h1);
  }
  for (let index = sections.length - 2; index >= 0; index -= 1) {
    await page.goBack();
    await expect(page).toHaveURL(new RegExp(`${sections[index].hash}$`));
    await expect(heading(page)).toHaveText(sections[index].h1);
    await expectHeaderColors(page);
  }
  await page.goBack();
  await expect.poll(() => page.evaluate(() => location.hash)).toBe("");
  await expect(heading(page)).toHaveText("Agent chats");
  await expectHeaderColors(page);
  await page.goForward();
  await expect(heading(page)).toHaveText("Home");
  await expectHeaderColors(page);

  await openShell(page, "/#decisions");
  await expect(heading(page)).toHaveText("Decisions");
  await navButton(page, "Home").click();
  await expect(heading(page)).toHaveText("Home");
  await page.goBack();
  await expect(heading(page)).toHaveText("Decisions");
  await expectHeaderColors(page);
  await page.goForward();
  await expect(heading(page)).toHaveText("Home");
  await expectHeaderColors(page);
});

test("axe checks the five rendered sections", async ({ page }) => {
  const summary = [];
  for (const section of sections) {
    await openShell(page, `/${section.hash}`);
    await expect(heading(page)).toHaveText(section.h1);
    await expectHeaderColors(page);
    const results = await new AxeBuilder({ page }).analyze();
    summary.push({
      screen: section.h1,
      hash: section.hash,
      violationCount: results.violations.length,
      violations: results.violations.map((violation) => ({
        id: violation.id,
        impact: violation.impact ?? null,
        help: violation.help,
        description: violation.description,
        helpUrl: violation.helpUrl,
        nodeCount: violation.nodes.length,
        nodes: violation.nodes.slice(0, 8).map((node) => ({
          target: node.target,
          html: node.html,
          failureSummary: node.failureSummary,
        })),
      })),
    });
  }
  await mkdir(path.dirname(axePath), { recursive: true });
  await writeFile(axePath, `${JSON.stringify(summary, null, 2)}\n`);
  const total = summary.reduce((count, screen) => count + screen.violationCount, 0);
  expect(total, JSON.stringify(summary, null, 2)).toBe(0);
});

test("reload keeps the clicked section and the five deep links", async ({ page }) => {
  await openShell(page, "/");
  await expect(heading(page)).toHaveText("Agent chats");
  await navButton(page, "Home").click();
  await expect(heading(page)).toHaveText("Home");
  await reloadShell(page);
  await expect(page).toHaveURL(/#home$/);
  await expect(heading(page)).toHaveText("Home");
  await expect(navButton(page, "Home")).toHaveAttribute("aria-current", "page");
  await expectHeaderColors(page);

  for (const section of sections) {
    await openShell(page, `/${section.hash}`);
    await reloadShell(page);
    await expect(page).toHaveURL(new RegExp(`${section.hash}$`));
    await expect(heading(page)).toHaveText(section.h1);
    await expect(navButton(page, section.label)).toHaveAttribute("aria-current", "page");
    await expectHeaderColors(page);
  }
});

test("navigation works at 320 and 390", async ({ page }) => {
  for (const viewport of [
    { width: 320, height: 568 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport);
    await openShell(page, "/");
    await expect(heading(page)).toHaveText("Agent chats");
    await expectHeaderColors(page);
    for (const section of sections) {
      await navButton(page, section.label).click();
      await expect(page).toHaveURL(new RegExp(`${section.hash}$`));
      await expect(heading(page)).toHaveText(section.h1);
      await expect(navButton(page, section.label)).toHaveAttribute("aria-current", "page");
      await expectHeaderColors(page);
    }
  }
});
