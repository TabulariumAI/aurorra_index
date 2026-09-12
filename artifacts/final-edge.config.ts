import config from "../playwright.config";
export default {
  ...config,
  testDir: "../tests/visual",
  workers: 1,
  outputDir: "final-edge-results",
  projects: config.projects?.map((project) => ({ ...project, use: { ...project.use, channel: "msedge" } })),
  webServer: { ...config.webServer, cwd: process.cwd(), reuseExistingServer: false },
};
