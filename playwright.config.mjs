import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  retries: 1,
  use: {
    trace: "on-first-retry",
    viewport: { width: 1280, height: 720 },
    baseURL: "http://127.0.0.1:5173",
  },
  webServer: {
    command: "pnpm dev",
    url: "http://127.0.0.1:5173/",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
