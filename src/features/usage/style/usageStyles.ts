import type { CSSProperties } from "react";
import type { UsageRecord } from "../type/usage.types";

export const usageColors = {
  extraction: "var(--primary)",
  iq_refinement: "var(--primary-light)",
  refinement: "#d97706",
  model_generation: "#0284c7",
  total: "#dc2626",
} satisfies Record<UsageRecord["name"] | "total", string>;

export const usageStyles = {
  root: { color: "var(--title-ink)", fontFamily: "var(--font-ui)", padding: "1rem var(--panel-content-padding)", overflow: "auto", minHeight: 0, width: "100%", boxSizing: "border-box" },
  filters: { display: "flex", flexWrap: "wrap", alignItems: "end", gap: "0.75rem", marginBottom: "1rem" },
  label: { display: "flex", flexDirection: "column", gap: "0.25rem", fontSize: "0.8125rem", fontWeight: 500 },
  input: { background: "var(--white)", border: "1px solid var(--border-card)", borderRadius: "var(--radius-control)", color: "inherit", font: "inherit", lineHeight: "inherit", padding: "0.375rem 0.5rem", height: "2.25rem", minHeight: "2.25rem", boxSizing: "border-box", boxShadow: "none", transform: "none" },
  select: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem", minWidth: "10rem", cursor: "pointer" },
  options: { background: "var(--white)", border: "1px solid var(--border-card)", borderRadius: "var(--radius-control)", boxShadow: "none", padding: "0.25rem", minWidth: "13rem", maxWidth: "calc(100vw - 1rem)", maxHeight: "var(--radix-popover-content-available-height)", overflowY: "auto", color: "var(--title-ink)", fontFamily: "var(--font-ui)", zIndex: 1 },
  option: { display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem", minHeight: "2.75rem", boxSizing: "border-box", fontSize: "0.8125rem", cursor: "pointer" },
  swatch: { display: "inline-block", flexShrink: 0, width: "0.75rem", height: "0.75rem", borderRadius: "2px" },
  card: { border: "1px solid var(--border-card)", borderRadius: "var(--radius-card)", padding: "1rem", marginBottom: "1rem" },
  summaries: { display: "flex", flexWrap: "wrap", alignItems: "start", gap: "1rem", marginTop: "1rem" },
  serviceSummary: { flex: "1 1 18rem", minWidth: 0 },
  total: { flex: "0 1 auto", minWidth: 0, borderRight: "1px solid var(--border-card)", paddingRight: "1rem" },
  title: { display: "flex", alignItems: "center", gap: "0.5rem", fontSize: "1rem", fontWeight: 600, margin: "0 0 0.75rem" },
  metrics: { display: "flex", flexWrap: "wrap", gap: "1.25rem", margin: "0 0 0.75rem" },
  metric: { display: "flex", flexDirection: "column", gap: "0.25rem" },
  value: { fontSize: "1.125rem", fontWeight: 600, margin: 0, fontVariantNumeric: "tabular-nums" },
  caption: { fontSize: "0.75rem", color: "#64748b" },
  chart: { overflowX: "auto" },
  svg: { display: "block", minWidth: "30rem", width: "100%", height: "auto" },
  empty: { color: "#64748b", padding: "1rem 0", textAlign: "center" },
} satisfies Record<string, CSSProperties>;
