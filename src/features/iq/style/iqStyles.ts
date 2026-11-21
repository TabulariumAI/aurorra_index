import type { CSSProperties } from "react";
import { iconButtonStyle } from "aurora-core";
import type { IqBucket, IqUiStatus } from "../type/iq.types";

export const iqColors = {
  green: { fg: "#065f46", bar: "#16a34a" },
  amber: { fg: "#92400e", bar: "#f59e0b" },
  red: { fg: "#991b1b", bar: "#ef4444" },
} satisfies Record<IqBucket, { fg: string; bar: string }>;

const gateColors = {
  warning: "#f59e0b",
  fail: "#ef4444",
} satisfies Record<Exclude<IqUiStatus, "success">, string>;

export const iqCss = `.iq-note[data-state="open"] { background: #F6FCFB; } .iq-tabs button:focus-visible, .iq-content:focus-visible { outline: 2px solid var(--primary); outline-offset: -2px; }`;

export const iqStyles = {
  recovery: {
    gridColumn: "1 / -1",
  } as CSSProperties,
  tabs: {
    borderBottom: "1px solid var(--border-card)",
    display: "flex",
    flex: "0 0 auto",
    margin: "0 var(--panel-content-padding) 0.45rem",
    minWidth: 0,
  } as CSSProperties,
  tab(active: boolean): CSSProperties {
    return {
      appearance: "none",
      background: "transparent",
      border: 0,
      borderBottom: `3px solid ${active ? "var(--primary)" : "transparent"}`,
      borderRadius: 0,
      boxShadow: "none",
      color: active ? "var(--primary-dark)" : "var(--body-ink)",
      cursor: "pointer",
      fontFamily: "inherit",
      fontSize: "0.9rem",
      fontWeight: 500,
      minHeight: "2.75rem",
      padding: "0.5rem 1rem",
      textAlign: "center",
      transform: "none",
      transition: "none",
      width: "8rem",
    };
  },

  root: {
    alignItems: "stretch",
    boxSizing: "border-box",
    color: "var(--title-ink)",
    display: "flex",
    flexDirection: "column",
    fontFamily: "var(--font-ui)",
    height: "100%",
    justifyContent: "flex-start",
    minHeight: 0,
    overflow: "hidden",
    position: "relative",
    textAlign: "left",
    width: "100%",
  },
  content: {
    boxSizing: "border-box",
    display: "block",
    flex: "1 1 auto",
    minHeight: 0,
    overflowX: "hidden",
    overflowY: "auto",
    padding: "0.85rem var(--panel-content-padding)",
    position: "relative",
    textAlign: "left",
    width: "100%",
  },
  panelHeader: {
    alignItems: "flex-start",
    display: "flex",
    gap: "0.75rem",
    justifyContent: "space-between",
    width: "100%",
  },
  summaryCard: {
    alignItems: "center",
    background: "var(--white)",
    border: "1px solid var(--border-card)",
    borderRadius: "var(--radius-card)",
    boxSizing: "border-box",
    boxShadow: "var(--shadow-card)",
    display: "grid",
    gap: "0.75rem",
    gridTemplateColumns: "auto 1fr",
    margin: "0 0 1rem",
    maxWidth: "34rem",
    padding: "0.8rem 1rem",
    width: "100%",
  },
  metricNumber: {
    fontVariantNumeric: "tabular-nums",
    fontSize: "2.85rem",
    fontWeight: 800,
    letterSpacing: 0,
    lineHeight: 1,
  },
  metricSubtext: {
    color: "var(--slate-500)",
    fontSize: "0.85rem",
    marginTop: "0.125rem",
  },
  metricLabel: {
    color: "var(--title-ink)",
    fontSize: "1.1rem",
    fontWeight: 700,
    marginBottom: "0.375rem",
  },
  metricTrack: {
    background: "var(--gray-100)",
    border: "1px solid var(--border-card)",
    borderRadius: "var(--radius-pill)",
    height: "0.625rem",
    overflow: "hidden",
  },
  metricFill(bucket: IqBucket, width: number): CSSProperties {
    return {
      background: iqColors[bucket].bar,
      height: "100%",
      transition: "width 350ms ease",
      width: `${width}%`,
    };
  },
  divider: {
    background: "var(--gray-300)",
    height: "0.0625rem",
    margin: "0.35rem 0 0.8rem",
  },
  segmentTable: {
    borderCollapse: "separate",
    borderSpacing: 0,
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
    fontSize: "0.95rem",
    marginBottom: "0.6rem",
    width: "100%",
  },
  segmentHeaderCell(align: "left" | "right"): CSSProperties {
    return {
      background: "var(--white)",
      borderBottom: "1px solid var(--border-subtle)",
      color: "var(--title-ink)",
      fontWeight: 700,
      padding: "0.65rem 0.7rem",
      position: "sticky",
      textAlign: align,
      top: 0,
    };
  },
  segmentCell(align: "left" | "right", strong?: boolean): CSSProperties {
    return {
      borderBottom: "1px solid var(--border-subtle)",
      color: strong ? "var(--title-ink)" : "var(--body-ink)",
      fontWeight: strong ? 700 : 400,
      padding: "0.65rem 0.7rem",
      textAlign: align,
    };
  },
  explanationBlock: {
    background: "#FFFCF5",
    border: `1px solid ${iqColors.amber.fg}`,
    borderRadius: "var(--radius-card)",
    boxSizing: "border-box",
    color: "var(--body-ink)",
    fontSize: "0.9rem",
    lineHeight: 1.65,
    margin: 0,
    marginTop: "0.5rem",
    minWidth: 0,
    overflowWrap: "anywhere",
    padding: "1rem",
  },
  explanationTitle: {
    color: "var(--title-ink)",
    fontWeight: 400,
    marginBottom: "0.15rem",
  },
  explanationList: {
    margin: "0 0 0 1rem",
    paddingLeft: "1rem",
  },
  gateList: {
    listStyle: "none",
    margin: 0,
    paddingLeft: 0,
  },
  gateRow: {
    alignItems: "start",
    borderBottom: "1px dashed var(--border-card)",
    boxSizing: "border-box",
    display: "grid",
    gap: "0.75rem",
    gridTemplateColumns: "7.5rem minmax(0, 1fr) auto",
    padding: "0.55rem 0.5rem",
  },
  gateStatus: {
    alignItems: "center",
    color: "var(--title-ink)",
    display: "inline-flex",
    fontSize: "0.8rem",
    fontWeight: 700,
    gap: "0.375rem",
    letterSpacing: "0.01em",
    textTransform: "uppercase",
  },
  gateFlag(status: Exclude<IqUiStatus, "success">): CSSProperties {
    return {
      background: gateColors[status],
      borderRadius: "999px",
      display: "inline-block",
      flex: "0 0 auto",
      height: "0.7rem",
      width: "0.7rem",
    };
  },
  cueRow: {
    alignItems: "start",
    display: "grid",
    gap: "0.75rem",
    gridTemplateColumns: "minmax(0, 1fr) auto",
    padding: "0.5rem 0",
  },
  gateText: {
    color: "var(--title-ink)",
    fontSize: "0.92rem",
    lineHeight: 1.45,
    wordBreak: "break-word",
  },
  gateAction: {
    alignItems: "center",
    display: "inline-flex",
    justifyContent: "flex-end",
    justifySelf: "end",
  },
  empty: {
    color: "var(--slate-500)",
  },
  notes: {
    display: "grid",
    minWidth: 0,
  },
  noteRow: {
    alignItems: "start",
    borderBottom: "1px solid var(--border-card)",
    display: "grid",
    gridTemplateColumns: "2.25rem minmax(0, 1fr)",
    padding: "1.25rem 0",
    minWidth: 0,
  },
  noteButton: {
    ...iconButtonStyle,
    justifySelf: "center",
  },
  noteText: {
    color: "var(--title-ink)",
    display: "grid",
    fontSize: "0.9rem",
    gap: "0.25rem",
    gridColumn: 2,
    lineHeight: 1.65,
    margin: 0,
    minWidth: 0,
    overflowWrap: "anywhere",
    padding: "0 1rem",
  } satisfies CSSProperties,
} satisfies Record<string, CSSProperties | ((...args: never[]) => CSSProperties)>;
