import { defineConfig, devices } from "@playwright/test";

const outputDir = "evidence/command-center-playwright/results";

export default defineConfig({
  testDir: "./tests/command-center",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 120_000,
  expect: { timeout: 20_000 },
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: "evidence/command-center-playwright/report" }],
  ],
  outputDir,
  use: {
    ...devices["Desktop Chrome"],
    browserName: "chromium",
    channel: "chrome",
    baseURL: "http://127.0.0.1:5173",
    trace: { mode: "on", snapshots: true, screenshots: false, sources: false },
    video: "off",
    screenshot: "off",
  },
  webServer: {
    command: "node scripts/run-framework.mjs dev",
    url: "http://127.0.0.1:5173/favicon.svg",
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
