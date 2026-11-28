import type { CSSProperties } from "react";

export const summaryCss = `
.index-summary-counts { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.index-summary-metric { flex-direction: row; align-items: center; justify-content: space-between; padding: 0.75rem 1rem; }
.index-summary-score { padding: 0.8rem 1rem; }
@media (max-width: 36rem) {
  .index-summary-counts { grid-template-columns: minmax(0, 1fr); }
}
@container summary (max-width: 22rem) {
  .index-summary-score { padding: 0.6rem 0.375rem; }
}
`;

export const summaryStyles = {
  root: {
    containerName: "summary",
    containerType: "inline-size",
    display: "grid",
    gap: "0.75rem",
    minWidth: 0,
    marginTop: "0.75rem",
  },
  counts: {
    display: "grid",
    gap: "0.75rem",
    margin: 0,
  },
  scores: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "0.75rem",
    margin: 0,
  },
  metric: {
    display: "flex",
    gap: "0.375rem",
    minWidth: 0,
    border: "1px solid var(--border-card)",
    borderRadius: "var(--radius-card)",
    background: "var(--white)",
    boxShadow: "var(--shadow-card)",
  },
  score: {
    containerType: "inline-size",
    flexDirection: "column",
    alignItems: "stretch",
  },
  label: {
    fontSize: "0.75rem",
    lineHeight: 1.4,
    fontWeight: 500,
    color: "var(--body-ink)",
    overflowWrap: "anywhere",
  },
  scoreLabel: {
    fontSize: "clamp(0.75rem, 13cqi, 1.1rem)",
    fontWeight: 700,
    color: "var(--title-ink)",
  },
  value: {
    display: "flex",
    alignItems: "center",
    minHeight: "2rem",
    margin: 0,
    fontSize: "1.5rem",
    lineHeight: 1.1,
    fontWeight: 700,
    letterSpacing: "-0.04em",
    fontVariantNumeric: "tabular-nums",
    color: "var(--title-ink)",
  },
  percent: {
    flexDirection: "column",
    alignItems: "stretch",
    gap: "0.5rem",
    minHeight: "2.85rem",
    fontSize: "clamp(1.25rem, 16cqi, 2.85rem)",
    lineHeight: 1,
    letterSpacing: 0,
    color: "var(--primary-dark)",
  },
  meter: {
    width: "100%",
    height: "0.625rem",
    marginTop: 0,
    backgroundColor: "var(--gray-100)",
    border: "1px solid var(--border-card)",
  },
} satisfies Record<string, CSSProperties>;
