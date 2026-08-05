import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const rootDir = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      react: path.resolve(rootDir, "node_modules/react"),
      "react-dom": path.resolve(rootDir, "node_modules/react-dom"),
      "@radix-ui/react-popover": path.resolve(rootDir, "node_modules/@radix-ui/react-popover"),
      "aurorra-ui": path.resolve(rootDir, "../aurorra_ui/src/public-api.ts"),
    },
    dedupe: ["react", "react-dom", "@radix-ui/react-popover"],
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
