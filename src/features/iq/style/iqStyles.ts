import type { CSSProperties } from "react";
import type { IqBucket, IqUiStatus } from "../type/iq.types";

const palette = {
  green: { fg: "#065f46", bar: "#16a34a" },
  amber: { fg: "#92400e", bar: "#f59e0b" },
  red: { fg: "#991b1b", bar: "#ef4444" },
} satisfies Record<IqBucket, { fg: string; bar: string }>;

const gateColors = {
  success: { bg: "#10b981", border: "#065f46" },
  warning: { bg: "#fcd34d", border: "#d97706" },
  info: { bg: "#94a3b8", border: "#475569" },
  fail: { bg: "#ef4444", border: "#991b1b" },
} satisfies Record<IqUiStatus, { bg: string; border: string }>;

export const iqStyles = {
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
    borderRadius: "9999rem",
    height: "0.625rem",
    overflow: "hidden",
  },
  metricFill(bucket: IqBucket, width: number): CSSProperties {
    return {
      background: palette[bucket].bar,
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
  sectionTitle: {
    color: "var(--title-ink)",
    fontSize: "1.02rem",
    fontWeight: 700,
    margin: "0 0 0.45rem",
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
      padding: "0.5rem 0.625rem",
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
      padding: "0.5rem 0.625rem",
      textAlign: align,
    };
  },
  explanationBlock: {
    marginTop: "0.5rem",
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
  gateFlag(status: IqUiStatus): CSSProperties {
    return {
      background: gateColors[status].bg,
      border: `0.0625rem solid ${gateColors[status].border}`,
      borderRadius: "0.125rem",
      display: "inline-block",
      flex: "0 0 auto",
      height: "0.85rem",
      width: "0.85rem",
    };
  },
  gateText: {
    color: "var(--title-ink)",
    fontSize: "0.92rem",
    lineHeight: 1.3,
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
  notesTitle: {
    fontWeight: 700,
    marginBottom: "0.25rem",
  },
  notesList: {
    margin: "0 0 0 1rem",
    paddingLeft: "1rem",
  },
} satisfies Record<string, CSSProperties | ((...args: never[]) => CSSProperties)>;
