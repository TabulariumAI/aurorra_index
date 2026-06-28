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
    color: "#0f172a",
    display: "flex",
    flexDirection: "column",
    fontFamily: "Arial, Helvetica, sans-serif",
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
    padding: "0.85rem 1rem 0.85rem",
    position: "relative",
    textAlign: "left",
    width: "100%",
  },
  progressOverlay: {
    alignItems: "flex-start",
    background: "linear-gradient(180deg, rgba(255,255,255,0.72), rgba(248,250,252,0.28))",
    display: "flex",
    inset: 0,
    justifyContent: "center",
    overflow: "hidden",
    padding: "0.35rem 0.7rem 0",
    pointerEvents: "auto",
    position: "absolute",
    zIndex: 2,
  },
  summaryCard: {
    alignItems: "center",
    background: "#ffffff",
    border: "0.0625rem solid #e5e7eb",
    borderRadius: "0.625rem",
    boxSizing: "border-box",
    boxShadow: "0 0.5rem 1.75rem rgba(2,6,23,0.08)",
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
    color: "#64748b",
    fontSize: "0.85rem",
    marginTop: "0.125rem",
  },
  metricLabel: {
    color: "#0f172a",
    fontSize: "1.1rem",
    fontWeight: 700,
    marginBottom: "0.375rem",
  },
  metricTrack: {
    background: "#f1f5f9",
    border: "0.0625rem solid #e5e7eb",
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
    background: "#e2e8f0",
    height: "0.0625rem",
    margin: "0.35rem 0 0.8rem",
  },
  sectionTitle: {
    color: "#0f172a",
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
      background: "#ffffff",
      borderBottom: "0.0625rem solid #e5e7eb",
      color: "#0f172a",
      fontWeight: 700,
      padding: "0.5rem 0.625rem",
      position: "sticky",
      textAlign: align,
      top: 0,
    };
  },
  segmentCell(align: "left" | "right", strong?: boolean): CSSProperties {
    return {
      borderBottom: "0.0625rem solid #f1f5f9",
      color: strong ? "#0f172a" : "#334155",
      fontWeight: strong ? 700 : 400,
      padding: "0.5rem 0.625rem",
      textAlign: align,
    };
  },
  explanationBlock: {
    marginTop: "0.5rem",
  },
  explanationTitle: {
    color: "#0f172a",
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
    borderBottom: "0.0625rem dashed #e5e7eb",
    boxSizing: "border-box",
    display: "grid",
    gap: "0.75rem",
    gridTemplateColumns: "7.5rem minmax(0, 1fr) auto",
    padding: "0.55rem 0.5rem",
  },
  gateStatus: {
    alignItems: "center",
    color: "#0f172a",
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
    color: "#0f172a",
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
    color: "#64748b",
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
