import type { CSSProperties } from "react";
import { legalMapColors, legalMapStyles } from "./legalMapStyles";

const reviewStyle = { background: "#fff7ed" };

export const surveyStyles = {
  warning: { ...reviewStyle, display: "grid", gridTemplateColumns: "auto minmax(0, 1fr)", alignItems: "start", gap: "0.75rem", border: "1px solid #fed7aa", borderRadius: "0.5rem", color: "#92400e", padding: "0.5rem 0.75rem", margin: 0, overflowWrap: "anywhere" },
  unconfirmedRow: reviewStyle,
  status: { appearance: "none", background: "transparent", border: 0, borderRadius: 0, boxShadow: "none", color: "inherit", cursor: "help", font: "inherit", minHeight: 0, minWidth: 0, padding: 0, transform: "none" },
  viewport: { flex: "1 1 0", minHeight: "min-content" },
  legendLine: { width: "2.5rem", flexShrink: 0, borderTop: `3px solid ${legalMapColors.parcelLine}` },
  unconfirmedLine: { width: "2.5rem", flexShrink: 0, borderTop: `3px dashed ${legalMapColors.unconfirmed}` },
  tieLegendLine: { width: "2.5rem", flexShrink: 0, borderTop: `1px dotted ${legalMapColors.secondaryText}`, opacity: 0.25 },
  context: { fill: legalMapStyles.location.color, fontWeight: legalMapStyles.location.fontWeight, opacity: legalMapStyles.location.opacity, pointerEvents: "none", whiteSpace: "nowrap" },
  drawing: { display: "block", height: "100%", width: "100%", position: "absolute", inset: 0, userSelect: "none" },
  notes: { background: legalMapStyles.infoCard.background, borderCollapse: "collapse", fontSize: legalMapStyles.lotCaption.fontSize, tableLayout: "fixed", textAlign: "left", width: "100%" },
  cell: { borderBottom: `1px solid ${legalMapColors.gridLine}`, overflowWrap: "anywhere", padding: "0.4rem 0.25rem", verticalAlign: "top" },
  measurements: { display: "grid", gap: "0.75rem", margin: 0 },
  measurementLabel: { fontWeight: 600 },
  measurementValue: { margin: "0.25rem 0 0", overflowWrap: "anywhere" },
} satisfies Record<string, CSSProperties>;
