import type { CSSProperties } from "react";

export const queueStyles = {
  recovery: { display: "flex", flexDirection: "column", gap: "0.2rem", backgroundColor: "#f1f5f9", maxWidth: "20rem", padding: "0.15rem", borderRadius: "var(--radius-control)" },
  error: { color: "var(--error-text-color-light)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: "0.75rem", textAlign: "right" },
  button: { height: "1.75rem", minHeight: "1.75rem", padding: "0.2rem 0.45rem", fontSize: "0.75rem", whiteSpace: "nowrap" },
  actions: { display: "flex", justifyContent: "flex-end", gap: "0.3rem" },
} satisfies Record<string, CSSProperties>;
