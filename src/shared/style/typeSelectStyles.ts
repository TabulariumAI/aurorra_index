import type { CSSProperties } from "react";

export const typeSelectStyles = {
  control: {
    background: "var(--white)",
    borderWidth: "1px", borderStyle: "solid", borderColor: "var(--border-card)",
    borderRadius: "var(--radius-control)",
    minWidth: 0,
  },
  focused: { borderColor: "var(--primary-dark)", boxShadow: "0 0 0 1px var(--primary)" },
  chips: { display: "flex", flexWrap: "wrap", gap: "0.35rem", padding: "0.5rem 0.5rem 0" },
  chip: {
    display: "inline-flex", alignItems: "center", gap: "0.25rem", maxWidth: "100%",
    borderRadius: "var(--radius-control)", background: "var(--gray-50)",
    border: "1px solid var(--border-card)", paddingLeft: "0.5rem",
  },
  chipLabel: { minWidth: 0, overflowWrap: "anywhere", fontSize: "0.9rem" },
  remove: {
    background: "transparent", border: 0, boxShadow: "none", color: "var(--title-ink)",
    flex: "0 0 auto", cursor: "pointer", font: "inherit", fontSize: "1.15rem",
    minWidth: "2.75rem", minHeight: "2.75rem", padding: "0.2rem", borderRadius: "var(--radius-control)",
  },
  search: {
    background: "transparent", border: 0, outline: "none", boxShadow: "none",
    boxSizing: "border-box", color: "var(--title-ink)", font: "inherit",
    minHeight: "2.5rem", width: "100%", minWidth: 0, padding: "0.5rem",
  },
  results: {
    position: "relative", maxHeight: "12rem", overflowY: "auto", overscrollBehavior: "contain",
    borderTop: "1px solid var(--border-card)", padding: "0.25rem", scrollPadding: "0.25rem",
  },
  group: { color: "var(--title-ink)", fontSize: "1.1em", fontWeight: 700, padding: "0.5rem 0.5rem 0.25rem" },
  option: {
    color: "var(--title-ink)", cursor: "pointer", padding: "0.5rem",
    borderRadius: "var(--radius-control)", overflowWrap: "anywhere",
  },
  active: { background: "var(--primary-dark)", color: "var(--white)" },
  empty: { color: "var(--title-ink)", padding: "0.75rem 0.5rem", fontSize: "0.9rem" },
} satisfies Record<string, CSSProperties>;
