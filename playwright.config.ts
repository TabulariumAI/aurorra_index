import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "tests/visual",
  testMatch: ["**/*.visual.spec.ts"],
  expect: {
    toHaveScreenshot: {
      animations: "disabled",
      maxDiffPixelRatio: 0.01,
      threshold: 0.2,
    },
  },
  use: {
    baseURL: "http://localhost:4174",
    trace: "on-first-retry",
  },
  webServer: {
    command: "vite --config vite.visual.config.ts --host localhost --port 4174",
    url: "http://localhost:4174",
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    {
      name: "visual chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1440, height: 900 },
        deviceScaleFactor: 1,
      },
    },
  ],
});
