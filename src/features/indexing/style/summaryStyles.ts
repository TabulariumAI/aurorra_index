import type { CSSProperties } from "react";

export const summaryCss = `
.index-summary-counts { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.index-summary-metric { flex-direction: row; align-items: center; justify-content: space-between; padding: 0.75rem 1rem; }
@media (max-width: 36rem) {
  .index-summary-counts { grid-template-columns: minmax(0, 1fr); }
}
`;

export const summaryStyles = {
  root: {
    display: "grid",
    gap: "1rem",
    minWidth: 0,
    marginTop: "1rem",
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
  },
  score: {
    flexDirection: "column",
    alignItems: "stretch",
    padding: "clamp(0.25rem, 1.25vw, 1.25rem)",
    background: "linear-gradient(135deg, color-mix(in srgb, var(--primary-dark) 7%, white), white)",
    borderColor: "color-mix(in srgb, var(--primary-dark) 20%, white)",
  },
  label: {
    fontSize: "0.75rem",
    lineHeight: 1.4,
    fontWeight: 500,
    color: "var(--body-ink)",
    overflowWrap: "anywhere",
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
    gap: "0.75rem",
    minHeight: "3rem",
    fontSize: "clamp(1.5rem, 7vw, 3rem)",
    color: "var(--primary-dark)",
  },
  meter: {
    width: "100%",
    height: "0.375rem",
    marginTop: 0,
    backgroundColor: "color-mix(in srgb, var(--primary-dark) 12%, white)",
  },
} satisfies Record<string, CSSProperties>;
