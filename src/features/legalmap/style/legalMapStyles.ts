import type { CSSProperties } from "react";

export const legalMapColors = {
  blockBg: "#e2e8ef",
  blockBorder: "#4c5b6b",
  blockText: "#223355",
  condoBg: "#fdeedb",
  condoText: "#ad4d00",
  emptyBg: "#eef2f5",
  emptyBorder: "#c6cdd4",
  emptyText: "#b1bac3",
  legendText: "#234177",
  lotBg: "#fee0d2",
  lotBorder: "#fc9272",
  lotText: "#de2d26",
  phaseBg: "#eef7e2",
  phaseBorder: "#8fd08f",
  phaseText: "#41693b",
  subdivisionBorder: "#e34a33",
  subdivisionColor: "#a04a33",
  text: "#223355",
  tractBg: "#a2a393ff",
} as const;

export const legalMapConstants = {
  amp: 1.15,
  blockBaseFontSize: 16,
  blockBaseHeight: 110,
  blockBaseWidth: 130,
  gridSize: 24,
  lotBaseFontSize: 13,
  lotSize: 48,
} as const;

export const legalMapStyles = {
  shell: {
    alignItems: "stretch",
    boxSizing: "border-box",
    color: legalMapColors.text,
    display: "flex",
    flexDirection: "column",
    fontFamily: "var(--font-ui)",
    gap: "0.75rem",
    height: "100%",
    justifyContent: "center",
    maxHeight: "100%",
    minHeight: 0,
    overflow: "hidden",
    textAlign: "center",
    width: "100%",
  },
  emptyMessage: {
    color: legalMapColors.text,
    fontSize: "1.25em",
    fontWeight: 700,
    margin: "2.25rem 0",
    textAlign: "center",
  },
  grid: {
    alignItems: "stretch",
    background: "transparent",
    backgroundImage: "url(src/assets/plat_back.png)",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    backgroundSize: "100% 100%",
    border: `0.25rem double ${legalMapColors.subdivisionColor}`,
    borderRadius: "var(--radius-card)",
    boxSizing: "border-box",
    color: legalMapColors.text,
    display: "flex",
    flex: "1 1 auto",
    flexDirection: "column",
    fontFamily: "var(--font-ui)",
    fontSize: "15px",
    justifyContent: "flex-start",
    margin: "0",
    maxHeight: "100%",
    minHeight: "0",
    overflow: "auto",
    padding: "1.25rem 1.25rem 0.5rem",
    width: "100%",
  },
  gridContent: {
    alignItems: "center",
    display: "grid",
    flex: "0 0 auto",
    gap: `${legalMapConstants.gridSize * 2}px`,
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), max-content))",
    justifyItems: "center",
    minHeight: 0,
    minWidth: 0,
    overflow: "visible",
    paddingRight: "2px",
    placeContent: "center",
    textAlign: "center",
  },
  subdivisionWrapper: {
    boxSizing: "border-box",
    display: "inline-block",
    maxWidth: "100%",
    minWidth: 0,
    padding: "1rem",
    position: "relative",
    verticalAlign: "middle",
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
    zIndex: 990,
  },
  subdivisionLabel: {
    color: legalMapColors.subdivisionColor,
    fontSize: "1.17em",
    fontWeight: 700,
    textAlign: "center",
  },
  blockRows: {
    alignItems: "center",
    display: "flex",
    justifyContent: "center",
    textAlign: "center",
    width: "100%",
  },
  legendRow: {
    alignItems: "center",
    display: "flex",
    flex: "0 0 auto",
    minHeight: "2.5rem",
    justifyContent: "center",
    overflow: "visible",
    textAlign: "center",
  },
  legendItems: {
    alignItems: "center",
    display: "flex",
    flexWrap: "wrap",
    gap: "1.5rem",
    justifyContent: "center",
    textAlign: "center",
  },
  legendItem: {
    alignItems: "center",
    display: "inline-flex",
    gap: "7px",
  },
  legendLabel: {
    color: legalMapColors.legendText,
    fontSize: "13px",
    fontWeight: 600,
  },
  legendBox: {
    border: "1px solid #bbb",
    borderRadius: "var(--radius-control)",
    display: "inline-block",
    height: "1.5rem",
    verticalAlign: "middle",
    width: "1.5rem",
  },
  location: {
    alignItems: "center",
    color: legalMapColors.text,
    display: "flex",
    flex: "0 0 auto",
    fontSize: "0.95rem",
    fontWeight: 600,
    minHeight: "2.5rem",
    justifyContent: "center",
    opacity: 0.9,
    overflow: "visible",
  },
} satisfies Record<string, CSSProperties>;

export function phaseStyle(empty: boolean, scale: number): CSSProperties {
  return {
    alignItems: "center",
    background: empty ? "transparent" : legalMapColors.phaseBg,
    border: empty ? "2px solid transparent" : `2px solid ${legalMapColors.phaseBorder}`,
    borderRadius: "0.5rem",
    color: empty ? "transparent" : legalMapColors.phaseText,
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginBottom: empty ? "0" : "0.5rem",
    minWidth: empty ? "0" : `${78 * scale}px`,
    padding: empty ? "0" : `${5 * scale}px ${12 * scale}px ${8 * scale}px`,
    textAlign: "center",
  };
}

export function phaseLabelStyle(scale: number): CSSProperties {
  return {
    alignSelf: "center",
    color: legalMapColors.phaseText,
    fontSize: `${legalMapConstants.lotBaseFontSize * scale}px`,
    fontWeight: 600,
    marginRight: `${12 * scale}px`,
    textAlign: "center",
  };
}

export function blockStyle(empty: boolean, scale: number): CSSProperties {
  return {
    alignItems: "center",
    background: legalMapColors.blockBg,
    border: empty ? "2px solid transparent" : `2px solid ${legalMapColors.blockBorder}`,
    borderRadius: "11px",
    boxShadow: "0 1px 3px 0 rgba(76,91,107,0.06)",
    color: legalMapColors.blockText,
    display: "flex",
    flexDirection: "column",
    fontSize: `${legalMapConstants.blockBaseFontSize * scale}px`,
    fontWeight: 700,
    justifyContent: "center",
    marginTop: "0.75rem",
    minHeight: `${legalMapConstants.blockBaseHeight * scale}px`,
    minWidth: `${legalMapConstants.blockBaseWidth * scale}px`,
    padding: `${14 * scale}px ${10 * scale}px`,
    textAlign: "center",
  };
}

export function blockLabelStyle(scale: number): CSSProperties {
  return {
    fontSize: `${18 * scale}px`,
    marginBottom: "0.75rem",
    textAlign: "center",
  };
}

export function lotStyle(empty: boolean, showCondo: boolean, scale: number, spanCount: number): CSSProperties {
  return {
    alignItems: "center",
    background: showCondo ? legalMapColors.condoBg : empty ? legalMapColors.emptyBg : legalMapColors.lotBg,
    border: `1px solid ${empty ? legalMapColors.emptyBorder : legalMapColors.lotBorder}`,
    borderRadius: "3px",
    boxShadow: empty ? "none" : "0 1px 3px 0 rgba(34,54,89,0.10)",
    boxSizing: "border-box",
    color: showCondo ? legalMapColors.condoText : empty ? legalMapColors.emptyText : legalMapColors.lotText,
    display: "inline-flex",
    flex: `0 0 ${spanCount * legalMapConstants.lotSize * scale + (spanCount - 1) * 6}px`,
    fontSize: `${legalMapConstants.lotBaseFontSize * scale}px`,
    fontWeight: 600,
    height: `${legalMapConstants.lotSize * scale}px`,
    justifyContent: "center",
    lineHeight: "1.1",
    margin: "0 3px",
    overflow: "hidden",
    padding: "0 3px",
    textAlign: "center",
    userSelect: "none",
    width: `${legalMapConstants.lotSize * scale * spanCount + (spanCount - 1) * 6}px`,
  };
}

export function legendBoxStyle(color: string, borderColor?: string): CSSProperties {
  return {
    ...legalMapStyles.legendBox,
    background: color,
    border: `1px solid ${borderColor || "#bbb"}`,
  };
}
