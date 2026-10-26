import { readFileSync } from "node:fs";
import { expect, it } from "vitest";

it.each([
  "src/features/imageviewer/worker/imageWorkerClient.ts",
  "src/features/metdataview/worker/metadataWorkerClient.ts",
])("%s receives its inputs without store access", file => {
  const source = readFileSync(file, "utf8");
  expect(source).not.toMatch(/from ["'][^"']*\/(?:store|state)\//);
  expect(source).not.toContain(".getState()");
});
