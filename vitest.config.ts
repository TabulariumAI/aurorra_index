import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const rootDir = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@radix-ui/react-tooltip": path.resolve(rootDir, "node_modules/@radix-ui/react-tooltip"),
      "@radix-ui/react-collapsible": path.resolve(rootDir, "node_modules/@radix-ui/react-collapsible"),
      react: path.resolve(rootDir, "node_modules/react"),
      "react-dom": path.resolve(rootDir, "node_modules/react-dom"),
      zustand: path.resolve(rootDir, "node_modules/zustand"),
      "@radix-ui/react-popover": path.resolve(rootDir, "node_modules/@radix-ui/react-popover"),
      "aurora-core": path.resolve(rootDir, "../aurora_core/src/public-api.ts"),
    },
    dedupe: ["react", "react-dom", "zustand", "@radix-ui/react-popover", "@radix-ui/react-collapsible", "@radix-ui/react-tooltip"],
    preserveSymlinks: true,
  },
  test: {
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["tests/**/*.visual.spec.ts", "**/*.visual.spec.ts"],
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
  },
});
