import { defineConfig } from "@playwright/test";
import config from "../playwright.config";

export default defineConfig({
  ...config,
  testDir: "../tests/visual",
  testMatch: "iq.visual.spec.ts",
  outputDir: "../test-results/iq-disclosure",
  use: { ...config.use, baseURL: "http://localhost:5206" },
  projects: [{ name: "edge", use: { browserName: "chromium", channel: "msedge", viewport: { width: 1440, height: 900 } } }],
  webServer: {
    cwd: "..",
    command: "node node_modules/vite/bin/vite.js --config vite.visual.config.ts --host localhost --port 5206 --strictPort",
    url: "http://localhost:5206",
    reuseExistingServer: false,
  },
});
