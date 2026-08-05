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
      react: path.resolve(rootDir, "node_modules/react"),
      "react-dom": path.resolve(rootDir, "node_modules/react-dom"),
      "@radix-ui/react-popover": path.resolve(rootDir, "node_modules/@radix-ui/react-popover"),
      "@radix-ui/react-tooltip": path.resolve(rootDir, "node_modules/@radix-ui/react-tooltip"),
      "@tabulariumai/aurora-lens": path.resolve(rootDir, "tests/visual/mockAuroraLens.ts"),
      "aurorra-ui": path.resolve(rootDir, "../aurorra_ui/src/public-api.ts"),
    },
    dedupe: ["react", "react-dom", "@radix-ui/react-popover", "@radix-ui/react-tooltip"],
    preserveSymlinks: true,
  },
});
