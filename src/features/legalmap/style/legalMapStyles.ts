import type { CSSProperties } from "react";
import { iconButtonStyle } from "aurora-core";
import legalMapBackdrop from "../assets/legal-map-backdrop.svg?url";

export const legalMapColors = {
  blockBg: "#e8f0f4",
  blockBorder: "#91aebe",
  blockText: "#294d60",
  divisionBg: "#f4f1ea",
  divisionBorder: "#c8bdaa",
  divisionText: "#6b6256",
  gridLine: "#d5dee2",
  mapBg: "#f7f8f6",
  secondaryText: "#62727d",
  lotBg: "#fbe9e3",
  lotBorder: "#cf7258",
  lotText: "#9d4934",
  rowBg: "rgba(58, 124, 140, 0.06)",
  subdivisionBorder: "#3a7c8c",
  subdivisionColor: "#274f59",
  text: "#183247",
} as const;

export const legalMapConstants = {
  amp: 1.15,
  blockBaseFontSize: 16,
  gridSize: 24,
  lotBaseFontSize: 16,
} as const;

export const rowFillStyle: CSSProperties = {
  backgroundColor: legalMapColors.rowBg,
  backgroundImage: "repeating-linear-gradient(135deg, transparent 0, transparent 7px, rgba(58, 124, 140, 0.15) 7px, rgba(58, 124, 140, 0.15) 8px)",
};

export const legalMapCss = `
.legal-map-tabs button[aria-selected="true"] { --icon-surface: var(--accent-surface); }
.legal-map-tabs button:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }
.legal-map [role="tabpanel"]:focus-visible { outline: 2px solid var(--primary); outline-offset: -2px; }
.legal-map-reference th, .legal-map-reference td { border: 0; }
.legal-map-reference tr + tr > * { border-top: 1px solid var(--border-subtle); }
.legal-map-reference td { border-left: 1px solid var(--border-subtle); }
@media (max-width: 48rem) {
  .legal-map {
    display: flex !important;
    flex-direction: column;
    overflow: auto !important;
  }
  .legal-map-info { display: contents !important; }
  .legal-map-summary { order: 0; }
  .legal-map-address { order: 2; }
  .legal-map-column {
    order: 1;
    flex: 0 0 auto;
    height: 24rem;
  }
  .legal-map-column:empty { display: none !important; }
  .legal-map-reference { order: 3; }
}
`;

export const legalMapStyles = {
  shell: {
    alignItems: "stretch",
    boxSizing: "border-box",
    color: legalMapColors.text,
    display: "grid",
    gap: "0.75rem",
    gridTemplateColumns: "minmax(0, 5fr) minmax(0, 3fr)",
    fontFamily: "var(--font-ui)",
    height: "100%",
    maxHeight: "100%",
    minHeight: 0,
    minWidth: 0,
    overflow: "hidden",
    width: "100%",
  },
  mapColumn: {
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    minHeight: 0,
    minWidth: 0,
    position: "relative",
  },
  tabs: {
    background: "var(--white)",
    border: "1px solid var(--border-subtle)",
    borderRadius: "var(--radius-control)",
    display: "flex",
    gap: "0.125rem",
    padding: "0.125rem",
    position: "absolute",
    right: "0.75rem",
    top: "0.75rem",
    zIndex: 1,
  },
  tabButton: {
    ...iconButtonStyle,
    fontFamily: "inherit",
    fontSize: "0.875rem",
    fontWeight: 600,
    outline: undefined,
    padding: "0.25rem 0.65rem",
    width: "auto",
  },
  panel: {
    flex: "1 1 0",
    minHeight: 0,
    minWidth: 0,
    display: "flex",
  },
  infoColumn: {
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
    minHeight: 0,
    minWidth: 0,
    overflow: "auto",
    overflowWrap: "anywhere",
    textAlign: "left",
  },
  infoHeading: {
    color: legalMapColors.text,
    fontSize: "clamp(0.875rem, 1.4vw, 1.375rem)",
    fontWeight: 700,
    margin: "0.25rem 0 0",
  },
  infoCard: {
    background: "#f3f9fe",
    border: "none",
    borderRadius: "var(--radius-card)",
    color: legalMapColors.text,
    fontSize: "clamp(0.875rem, 1.2vw, 1.125rem)",
    lineHeight: 1.55,
    overflowWrap: "anywhere",
    padding: "clamp(0.5rem, 1.4vw, 1.25rem)",

  },
  infoSection: {
    display: "flex",
    flex: "0 0 auto",
    flexDirection: "column",
    gap: "0.75rem",
    minWidth: 0,
  },
  referenceTable: {
    border: "none",
    borderCollapse: "collapse",
    width: "100%",
  },
  referenceCell: {
    padding: "0.5rem 0.75rem",
    textAlign: "left",
    verticalAlign: "top",
  },
  mapSurface: {
    backgroundColor: legalMapColors.mapBg,
    backgroundImage: `url("${legalMapBackdrop}")`,
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    backgroundSize: "cover",
    border: `1px solid ${legalMapColors.gridLine}`,
    borderRadius: "var(--radius-card)",
    boxSizing: "border-box",
    display: "flex",
    flex: "1 1 auto",
    flexDirection: "column",
    minHeight: 0,
    minWidth: 0,
    overflow: "hidden",
    width: "100%",
  },
  mapFooter: {
    alignItems: "flex-end",
    display: "flex",
    flex: "0 0 auto",
    gap: "0.75rem",
    padding: "0.75rem",
  },
  grid: {
    alignItems: "stretch",
    boxSizing: "border-box",
    color: legalMapColors.text,
    display: "flex",
    flex: "1 1 auto",
    flexDirection: "column",
    fontFamily: "var(--font-ui)",
    fontSize: "15px",
    justifyContent: "safe center",
    margin: "0",
    maxHeight: "100%",
    minHeight: "0",
    overflow: "auto",
    padding: "3.75rem 1rem 2rem",
    width: "100%",
  },
  northMarker: {
    alignItems: "center",
    background: "#fff",
    borderRadius: "var(--radius-control)",
    boxShadow: "var(--shadow-card)",
    color: legalMapColors.text,
    display: "flex",
    flexDirection: "column",
    flexShrink: 0,
    fontSize: "1rem",
    fontWeight: 700,
    justifyContent: "center",
    minHeight: "3.25rem",
    width: "2.5rem",
  },
  gridContent: {
    alignItems: "center",
    display: "flex",
    flex: "0 0 auto",
    flexWrap: "wrap",
    gap: `${legalMapConstants.gridSize * 2}px`,
    justifyContent: "center",
    minHeight: 0,
    minWidth: "24rem",
    overflow: "visible",
    paddingRight: "2px",
    textAlign: "center",
    width: "100%",
  },
  subdivisionWrapper: {
    boxSizing: "border-box",
    display: "inline-block",
    maxWidth: "100%",
    minWidth: 0,
    position: "relative",
    verticalAlign: "middle",
    width: "min(100%, 30rem)",
  },
  subdivisionBoundary: {
    border: `2px dashed ${legalMapColors.subdivisionBorder}`,
    borderRadius: "var(--radius-card)",
    boxSizing: "border-box",
    padding: "1.25rem",
  },
  subdivisionContent: {
    alignItems: "center",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    maxWidth: "100%",
    minWidth: 0,
    position: "relative",
    width: "100%",
    gap: "0.75rem",
  },
  rowContent: {
    minHeight: "24rem",
  },
  rowBand: {
    ...rowFillStyle,
    alignItems: "center",
    borderBottom: `1px solid ${legalMapColors.subdivisionBorder}`,
    borderRadius: 0,
    borderTop: `1px solid ${legalMapColors.subdivisionBorder}`,
    boxSizing: "border-box",
    color: legalMapColors.text,
    display: "flex",
    fontSize: "1rem",
    fontWeight: 600,
    height: "3rem",
    justifyContent: "center",
    left: 0,
    lineHeight: 1.2,
    overflowWrap: "anywhere",
    padding: "0.25rem",
    position: "absolute",
    textAlign: "center",
    transform: "translateY(-50%)",
    width: "100%",
  },
  divisionLabels: {
    alignSelf: "center",
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
    maxWidth: "5rem",
    overflowWrap: "anywhere",
  },
  divisionBlocks: {
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
    minWidth: 0,
  },
  blockGrid: {
    background: legalMapColors.gridLine,
    border: `1px solid ${legalMapColors.gridLine}`,
    borderRadius: "2px",
    boxSizing: "border-box",
    display: "grid",
    gap: "1px",
    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
    overflow: "hidden",
    width: "100%",
  },
  blockCaption: {
    color: legalMapColors.blockText,
    fontSize: "1rem",
    fontWeight: 500,
  },
  lotCaption: {
    color: legalMapColors.lotText,
    fontSize: "1rem",
    fontWeight: 500,
  },
  subdivisionLabel: {
    color: legalMapColors.subdivisionColor,
    fontSize: "1.35em",
    fontWeight: 700,
    marginBottom: "0.75rem",
    textAlign: "center",
  },
  legendItems: {
    alignItems: "center",
    display: "flex",
    flex: "1 1 auto",
    flexWrap: "wrap",
    gap: "1.5rem",
    justifyContent: "flex-end",
    minHeight: "2.5rem",
    minWidth: 0,
    overflow: "visible",
    textAlign: "center",

  },
  legendItem: {
    alignItems: "center",
    display: "inline-flex",
    gap: "7px",
  },
  legendLabel: {
    color: legalMapColors.text,
    fontSize: "15px",
    fontWeight: 600,
  },
  legendBox: {
    borderRadius: "0.25rem",
    flexShrink: 0,
    display: "inline-block",
    height: "1.75rem",
    verticalAlign: "middle",
    width: "1.75rem",
  },
  location: {
    alignItems: "center",
    color: legalMapColors.text,
    display: "flex",
    flex: "0 0 auto",
    fontSize: "1.35em",
    fontWeight: 600,
    minHeight: "2.5rem",
    justifyContent: "center",
    opacity: 0.9,
    overflow: "visible",
  },
} satisfies Record<string, CSSProperties>;

export function divisionStyle(empty: boolean): CSSProperties {
  return {
    background: empty ? "transparent" : legalMapColors.divisionBg,
    border: empty ? "none" : `2px solid ${legalMapColors.divisionBorder}`,
    borderRadius: "var(--radius-card)",
    boxSizing: "border-box",
    display: "grid",
    gridTemplateColumns: empty ? "minmax(0, 1fr)" : "auto minmax(0, 1fr)",
    gap: "0.75rem",
    minWidth: 0,
    padding: empty ? 0 : "0.75rem",
    width: "100%",
  };
}

export const divisionLabelStyle: CSSProperties = {
  color: legalMapColors.divisionText,
  fontSize: "1rem",
  fontWeight: 600,
  textAlign: "left",
};

export const blockStyle: CSSProperties = {
  alignItems: "center",
  background: legalMapColors.blockBg,
  border: "none",
  boxSizing: "border-box",
  boxShadow: "none",
  color: legalMapColors.blockText,
  display: "flex",
  flexDirection: "column",
  fontWeight: 700,
  gridColumn: "2 / 4",
  gridRow: "2 / 4",
  justifyContent: "center",
  textAlign: "center",
};

export function blockLabelStyle(scale: number): CSSProperties {
  return {
    fontSize: `${legalMapConstants.blockBaseFontSize * scale}px`,
    maxWidth: "100%",
    overflowWrap: "anywhere",
    textAlign: "center",
  };
}

export function lotStyle(empty: boolean, scale: number, gridColumn: string, gridRow: number): CSSProperties {
  return {
    alignItems: "center",
    aspectRatio: "1",
    minWidth: 0,
    minHeight: 0,
    background: empty ? legalMapColors.blockBg : legalMapColors.lotBg,
    border: empty ? "none" : `1px solid ${legalMapColors.lotBorder}`,
    borderRadius: empty ? 0 : "2px",
    boxSizing: "border-box",
    color: empty ? legalMapColors.secondaryText : legalMapColors.lotText,
    display: "flex",
    flexDirection: "column",
    fontSize: `${legalMapConstants.lotBaseFontSize * scale}px`,
    fontWeight: 600,
    gridColumn,
    gridRow,
    justifyContent: "center",
    lineHeight: "1.1",
    overflowWrap: "anywhere",
    overflow: "hidden",
    padding: "0.25rem",
    textAlign: "center",
    userSelect: "none",
  };
}

export function legendBoxStyle(color: string, borderColor: string): CSSProperties {
  return {
    ...legalMapStyles.legendBox,
    background: color,
    border: `1px solid ${borderColor}`,
    borderStyle: color === "transparent" ? "dashed" : "solid",
  };
}
