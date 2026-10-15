import type { CSSProperties } from "react";
import { iconButtonStyle } from "aurora-core";

export const queueStyles = {
  recovery: { display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "0.25rem" },
  button: { height: "2rem", minHeight: "2rem", padding: "0 0.25rem", fontSize: "0.75rem", whiteSpace: "nowrap" },
  separator: { height: "1rem", borderLeft: "1px solid var(--border-card)" },
  info: { ...iconButtonStyle, background: "transparent", color: "var(--text-muted)", outline: undefined },
  announcement: { border: 0, clipPath: "inset(50%)", height: "1px", margin: "-1px", overflow: "hidden", padding: 0, position: "absolute", whiteSpace: "nowrap", width: "1px" },
  callout: { display: "flex", alignItems: "flex-start", gap: "0.75rem", background: "var(--white)", border: "1px solid var(--border-card)", borderRadius: "var(--radius-card)", boxShadow: "var(--shadow-card)", color: "var(--title-ink)", padding: "0.875rem", width: "16rem", maxWidth: "calc(100vw - 1rem)", maxHeight: "var(--radix-popover-content-available-height)", boxSizing: "border-box", fontSize: "0.75rem", lineHeight: 1.4, zIndex: 60 },
  errorIcon: { display: "flex", flexShrink: 0, color: "#dc2626" },
  message: { minWidth: 0, maxHeight: "calc(var(--radix-popover-content-available-height) - 1.75rem)", overflow: "auto", overflowWrap: "anywhere" },
  description: { margin: 0 },
  arrow: { fill: "var(--white)" },
} satisfies Record<string, CSSProperties>;
