import { expect, test, type Page } from "@playwright/test";
import { installReadOnlySyntheticRoutes, openShell, useDummyCookie, waitForShell } from "./synthetic";

function heading(page: Page) {
  return page.getByRole("heading", { level: 1 });
}

test("new views keep a calendar source date when updatedAt is absent", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await useDummyCookie(page);
  const writes = await installReadOnlySyntheticRoutes(page);
  await openShell(page, "/#projects");
  await expect(heading(page)).toHaveText("Projects");
  const project = page.locator("article", { hasText: "SYN-002" });
  await expect(project).toContainText("Source date Jan 1, 2026");
  await expect(project).not.toContainText("Dec 31, 2025");

  await page.goto("/#home", { waitUntil: "domcontentloaded" });
  await waitForShell(page);
  await expect(heading(page)).toHaveText("Home");
  const priority = page.locator("article", { hasText: "SYN-001" });
  await expect(priority).toHaveCount(2);
  await expect(priority.nth(0)).toContainText("Evidence · Jan 1, 2026");
  await expect(priority.nth(1)).toContainText("Evidence · Jan 1, 2026");

  await page.goto("/#decisions", { waitUntil: "domcontentloaded" });
  await waitForShell(page);
  await expect(heading(page)).toHaveText("Decisions");
  const decision = page.locator("article", { hasText: "SYN-DEC-001" });
  await expect(decision).toContainText("Source date Dec 31, 2025");

  await page.goto("/#avengers", { waitUntil: "domcontentloaded" });
  await waitForShell(page);
  await expect(heading(page)).toHaveText("Avengers");
  await page.goto("/#money", { waitUntil: "domcontentloaded" });
  await waitForShell(page);
  await expect(heading(page)).toHaveText("Money");
  await expect(page.getByText("No API connection configured.")).toBeVisible();
  expect(errors).toEqual([]);
  expect(writes).toEqual([]);
});
