import path from "node:path";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const rootDir = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  root: "tests/visual",
  plugins: [react()],
  resolve: {
    alias: {
      "@radix-ui/react-collapsible": path.resolve(rootDir, "node_modules/@radix-ui/react-collapsible"),
      react: path.resolve(rootDir, "node_modules/react"),
      "react-dom": path.resolve(rootDir, "node_modules/react-dom"),
      zustand: path.resolve(rootDir, "node_modules/zustand"),
      "@radix-ui/react-popover": path.resolve(rootDir, "node_modules/@radix-ui/react-popover"),
      "@radix-ui/react-tooltip": path.resolve(rootDir, "node_modules/@radix-ui/react-tooltip"),
      "@tabulariumai/aurora-lens": path.resolve(rootDir, "tests/visual/mockAuroraLens.ts"),
      "aurora-core": path.resolve(rootDir, "../aurora_core/src/public-api.ts"),
    },
    dedupe: ["react", "react-dom", "zustand", "@radix-ui/react-popover", "@radix-ui/react-tooltip", "@radix-ui/react-collapsible"],
    preserveSymlinks: true,
  },
});
