import { expect, it } from "vitest";
import { build } from "vite";

it("keeps React out of gateway worker bundles", async () => {
  const modules = new Set<string>();
  let chunks = 0;
  await build({
    logLevel: "silent",
    build: { write: false },
    worker: { plugins: () => [{
      name: "verify-worker-runtime",
      generateBundle(_options, bundle) {
        for (const output of Object.values(bundle)) {
          if (output.type !== "chunk") continue;
          chunks++;
          for (const [id, info] of Object.entries(output.modules)) {
            if (info.renderedLength > 0) modules.add(id.replaceAll("\\", "/"));
          }
        }
      },
    }] },
  });
  expect(chunks).toBeGreaterThan(0);
  expect([...modules].filter(id => /\/node_modules\/(?:react|react-dom)\//.test(id))).toEqual([]);
}, 30000);
