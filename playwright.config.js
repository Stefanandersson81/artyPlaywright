// @ts-check
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  timeout: 120000,
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["@artilleryio/playwright-reporter", { name: "DAVIDS Tests" }]],
  use: {
    ...devices["Desktop Chrome"],
    viewport: { width: 1920, height: 1080 }, // <- Tvingar upplösning
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
