import type { CSSProperties } from "react";
import { legalMapColors, legalMapConstants, legalMapStyles } from "./legalMapStyles";

export const surveyStyles = {
  list: { boxSizing: "border-box", display: "flex", flex: "1 1 0", flexDirection: "column", gap: "1rem", minHeight: 0, minWidth: 0, overflow: "auto", width: "100%" },
  viewport: { flex: "1 0 auto", minHeight: legalMapConstants.surveyHeight },
  boundaryViewport: { flex: "1 1 0", minHeight: "min-content" },
  tieLabel: { color: legalMapColors.secondaryText, fontSize: legalMapConstants.lotBaseFontSize, lineHeight: 1.25, minWidth: 0, overflowWrap: "anywhere", whiteSpace: "pre-wrap" },
  tableScroll: { flex: "1 1 0", minHeight: 0, overflowY: "auto", overflowX: "hidden", overscrollBehavior: "contain" },
  closure: { color: legalMapColors.secondaryText, display: "flex", flex: "0 0 auto", flexWrap: "wrap", columnGap: "1rem", rowGap: "0.25rem", fontSize: "10px", fontWeight: 400, justifyContent: "center", lineHeight: 1.4, overflowWrap: "anywhere", textAlign: "center" },
  context: { fill: legalMapStyles.location.color, fontWeight: legalMapStyles.location.fontWeight, opacity: legalMapStyles.location.opacity, pointerEvents: "none", whiteSpace: "nowrap" },
  drawing: { display: "block", height: "100%", width: "100%", position: "absolute", inset: 0, userSelect: "none" },
  notes: { background: legalMapStyles.infoCard.background, borderCollapse: "collapse", fontSize: legalMapStyles.lotCaption.fontSize, tableLayout: "fixed", textAlign: "left", width: "100%" },
  cell: { borderBottom: `1px solid ${legalMapColors.gridLine}`, overflowWrap: "anywhere", padding: "0.4rem 0.25rem", verticalAlign: "top" },
} satisfies Record<string, CSSProperties>;
