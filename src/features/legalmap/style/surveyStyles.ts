import type { CSSProperties } from "react";
import { legalMapColors, legalMapConstants, legalMapStyles } from "./legalMapStyles";

export const surveyStyles = {
  list: { boxSizing: "border-box", display: "flex", flex: "1 1 0", flexDirection: "column", gap: "1rem", minHeight: "min-content", minWidth: 0, overflow: "hidden", width: "100%" },
  viewport: { flex: "1 1 0", minHeight: "min-content" },
  legendLine: { width: "2.5rem", flexShrink: 0, borderTop: `3px solid ${legalMapColors.parcelLine}` },
  tieLegendLine: { borderTop: `3px dashed ${legalMapColors.secondaryText}` },
  tieLabel: { color: legalMapColors.secondaryText, fontSize: legalMapConstants.lotBaseFontSize, lineHeight: 1.25, minWidth: 0, overflowWrap: "anywhere", whiteSpace: "pre-wrap" },
  context: { fill: legalMapStyles.location.color, fontWeight: legalMapStyles.location.fontWeight, opacity: legalMapStyles.location.opacity, pointerEvents: "none", whiteSpace: "nowrap" },
  drawing: { display: "block", height: "100%", width: "100%", position: "absolute", inset: 0, userSelect: "none" },
  notes: { background: legalMapStyles.infoCard.background, borderCollapse: "collapse", fontSize: legalMapStyles.lotCaption.fontSize, tableLayout: "fixed", textAlign: "left", width: "100%" },
  cell: { borderBottom: `1px solid ${legalMapColors.gridLine}`, overflowWrap: "anywhere", padding: "0.4rem 0.25rem", verticalAlign: "top" },
} satisfies Record<string, CSSProperties>;
