import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const rootDir = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      react: path.resolve(rootDir, "node_modules/react"),
      "react-dom": path.resolve(rootDir, "node_modules/react-dom"),
      "@radix-ui/react-dialog": path.resolve(rootDir, "node_modules/@radix-ui/react-dialog"),
      "@radix-ui/react-popover": path.resolve(rootDir, "node_modules/@radix-ui/react-popover"),
      "@radix-ui/react-progress": path.resolve(rootDir, "node_modules/@radix-ui/react-progress"),
      "aurorra-ui": path.resolve(rootDir, "../aurorra_ui/src/index.ts"),
    },
    dedupe: ["react", "react-dom", "@radix-ui/react-dialog", "@radix-ui/react-popover", "@radix-ui/react-progress"],
    preserveSymlinks: true,
  },
  plugins: [react()],
  build: {
    lib: {
      entry: "src/index.tsx",
      formats: ["es"],
    },
    rollupOptions: {
      external: [
        "react",
        "react-dom",
        "react-dom/client",
        "react-dom/server",
        "aurorra-ui",
        "@radix-ui/react-collapsible",
        "@radix-ui/react-dialog",
        "@radix-ui/react-popover",
        "@radix-ui/react-progress",
        "@radix-ui/react-tooltip",
      ],
    },
  },
});
