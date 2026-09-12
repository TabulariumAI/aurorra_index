import type { CSSProperties } from "react";
export const queueExitStyles = {
  root: { display: "flex", flexDirection: "column", gap: "1rem", width: "100%", minWidth: 0, padding: "var(--panel-content-padding)", boxSizing: "border-box" },
  message: { margin: 0 },
  list: { margin: 0, paddingLeft: "1.25rem", maxHeight: "40vh", overflowY: "auto" },
  task: { padding: "0.5rem 0", overflowWrap: "anywhere" },
  value: { overflowWrap: "anywhere" },
  actions: { display: "flex", flexWrap: "wrap", gap: "0.5rem", justifyContent: "flex-end" },
} satisfies Record<string, CSSProperties>;
