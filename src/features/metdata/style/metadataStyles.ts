import type { CSSProperties } from "react";

const surfaceCanvas = "transparent";
const surfacePanel = "#ffffff";
const surfaceRaised = "#f8fafc";
const surfaceAccent = "rgba(6, 175, 193, 0.10)";
const segmentSurface = surfaceRaised;
const borderSubtle = "#06afc1";
const borderAccent = "#008ba3";
const textStrong = "#20252d";
const textMuted = "#687386";
const teal = "#008ba3";
const accentText = "#008ba3";

export const metadataStyles = {
  actionGroup: {
    alignItems: "center",
    display: "inline-flex",
    gap: "0.35rem",
    justifyContent: "center",
  },
  article: {
    background: surfacePanel,
    border: `1px solid ${borderSubtle}`,
    borderLeft: "0.13rem solid #07879a",
    color: textStrong,
    margin: 0,
    padding: "0.48rem 0.66rem",
  },
  header: {
    alignItems: "center",
    background: surfacePanel,
    border: 0,
    boxShadow: "none",
    display: "flex",
    justifyContent: "center",
    margin: 0,
    minHeight: "3.2rem",
    position: "sticky",
    top: 0,
    zIndex: 2,
    padding: "0.55rem 0.72rem",
    textAlign: "center",
    width: "100%",
  },
  legalElement: {
    borderTop: `1px solid ${borderSubtle}`,
    padding: "0.38rem 0",
  },
  legalGroupList: {
    display: "grid",
    gap: "0.35rem",
    margin: 0,
    padding: 0,
  },
  legalHeader: {
    alignItems: "center",
    display: "flex",
    justifyContent: "space-between",
  },
  muted: {
    color: textMuted,
    fontSize: "0.9rem",
    lineHeight: 1.3,
  },
  pre: {
    background: "#f8fafc",
    border: `1px solid ${borderSubtle}`,
    color: textStrong,
    fontSize: "0.82rem",
    margin: 0,
    overflowX: "auto",
    padding: "0.5rem 0.65rem",
    whiteSpace: "pre-wrap",
  },
  progressOverlay: {
    background: "linear-gradient(180deg, rgba(255,255,255,0.72), rgba(248,253,254,0.28))",
    alignItems: "flex-start",
    inset: 0,
    overflow: "hidden",
    pointerEvents: "auto",
    position: "absolute",
    zIndex: 2,
    display: "flex",
    justifyContent: "center",
    padding: "0.35rem 0.7rem 0",
  },
  rootShell: {
    background: surfaceCanvas,
    border: 0,
    borderRadius: 0,
    boxShadow: "none",
    color: textStrong,
    display: "flex",
    flexDirection: "column",
    gap: "0.55rem",
    height: "auto",
    minHeight: 0,
    margin: 0,
    maxWidth: "none",
    minWidth: 0,
    overflow: "visible",
    padding: "0 0.78rem 0.6rem",
    position: "relative",
    textAlign: "left",
    verticalAlign: "top",
    width: "100%",
  },
  root: {
    color: textStrong,
    fontFamily: "Arial, Helvetica, sans-serif",
    display: "grid",
    gap: '0.15rem',
    padding: "0 0 0.1rem",
    width: "100%",
  },
  sectionShell: {
    background: surfacePanel,
    border: `1px solid ${borderSubtle}`,
    margin: 0,
    padding: "0",
  },
  session: {
    color: textMuted,
    display: "block",
    fontSize: "1rem",
    fontWeight: 500,
    overflowWrap: "anywhere",
    wordBreak: "break-word",
    maxWidth: "100%",
    marginTop: "0.12rem",
  },
  title: {
    color: textStrong,
    fontSize: "1.2rem",
    fontWeight: 700,
    letterSpacing: 0,
    lineHeight: 1.1,
    margin: 0,
  },
} satisfies Record<string, CSSProperties>;

export function legalSummaryStyle(): CSSProperties {
  return {
    ...metadataStyles.muted,
    margin: "0 0 0.65rem",
  };
}

export function disclosureButtonStyle(open: boolean): CSSProperties {
  return {
    appearance: "none",
    background: "transparent",
    border: 0,
    boxShadow: "none",
    color: open ? accentText : teal,
    cursor: "pointer",
    display: "inline-flex",
    fontFamily: "inherit",
    fontSize: "0.92rem",
    fontWeight: 700,
    justifyContent: "center",
    lineHeight: 1.28,
    outline: "none",
    padding: 0,
    position: "absolute",
    right: 0,
    textDecoration: "underline",
    textUnderlineOffset: "0.12em",
    top: 0,
    transition: "color 120ms ease",
    whiteSpace: "nowrap",
  };
}

export const detailLabelStyle: CSSProperties = {
  color: textStrong,
  fontWeight: 700,
};

export const detailLineStyle: CSSProperties = {
  display: "block",
  minWidth: 0,
  position: "relative",
  width: "100%",
};

export const detailMeasureTextStyle: CSSProperties = {
  color: textMuted,
  display: "block",
  fontSize: "0.92rem",
  lineHeight: 1.28,
  minWidth: 0,
  overflow: "hidden",
  overflowWrap: "anywhere",
  pointerEvents: "none",
  position: "absolute",
  visibility: "hidden",
  whiteSpace: "nowrap",
  width: "100%",
  wordBreak: "break-word",
};

export function detailTextStyle(open: boolean, hasDisclosure: boolean): CSSProperties {
  return {
    color: textMuted,
    display: "block",
    boxSizing: "border-box",
    fontSize: "0.92rem",
    lineHeight: 1.28,
    minWidth: 0,
    overflow: open || !hasDisclosure ? "visible" : "hidden",
    overflowWrap: "anywhere",
    paddingRight: hasDisclosure ? "1.55rem" : 0,
    textOverflow: open || !hasDisclosure ? "clip" : "ellipsis",
    whiteSpace: open || !hasDisclosure ? "normal" : "nowrap",
    wordBreak: "break-word",
  };
}

export const rowStyles = {
  actionButton(disabled: boolean): CSSProperties {
    return {
      alignItems: "center",
      background: "transparent",
      border: "1px solid transparent",
      borderRadius: "0.2rem",
      color: textStrong,
      cursor: disabled ? "not-allowed" : "pointer",
      display: "inline-flex",
      appearance: "none",
      boxShadow: "none",
      fontWeight: 600,
      height: "1.9rem",
      outline: "1px solid transparent",
      width: "1.9rem",
      justifyContent: "center",
      minHeight: "1.9rem",
      minWidth: "1.9rem",
      opacity: disabled ? 0.55 : 1,
      padding: 0,
      transition: "background 120ms ease, color 120ms ease, outline-color 120ms ease, border-color 120ms ease",
    };
  },
  actionButtonHover: {
    color: borderAccent,
    background: `${surfaceAccent}`,
  },
  actionGroup: {
    alignItems: "center",
    display: "flex",
    flex: "0 0 auto",
    gap: "0.2rem",
  },
  body: {
    color: textStrong,
    fontSize: "1rem",
    lineHeight: 1.28,
  },
  direct: {
    color: "darkgreen",
  },
  empty: {
    color: textMuted,
    fontSize: "0.95rem",
    background: surfacePanel,
    border: `1px solid ${borderSubtle}`,
    padding: "0.6rem 0.75rem",
  },
  header: {
    alignItems: "flex-start",
    display: "flex",
    gap: "0.6rem",
    justifyContent: "space-between",
  },
  indirect: {
    color: "darkblue",
  },
  procedural: {
    color: "darkorange",
  },
  row(selected: boolean, borderColor: string): CSSProperties {
    return {
      backgroundColor: selected ? surfaceAccent : surfacePanel,
      border: `1px solid ${borderSubtle}`,
      borderLeft: `0.12rem solid ${borderColor}`,
      boxShadow: "none",
      color: textStrong,
      display: "flex",
      flexDirection: "column",
      gap: "0.25rem",
      position: "relative",
      margin: 0,
      padding: "0.45rem 0.72rem",
      textAlign: "left",
    };
  },
  tooltip: {
    background: "#0f172a",
    borderRadius: "0.2rem",
    color: "#fff",
    fontSize: "0.75rem",
    padding: "0.35rem 0.5rem",
    zIndex: 60,
  },
  value: {
    color: textStrong,
    fontSize: "0.98rem",
    fontWeight: 700,
    lineHeight: 1.25,
    letterSpacing: 0,
    minWidth: 0,
    overflowWrap: "anywhere",
    textTransform: "none",
  },
  valueLink: {
    color: textStrong,
    cursor: "pointer",
    font: "inherit",
    overflowWrap: "anywhere",
    textDecoration: "underline",
    textUnderlineOffset: "0.12em",
  },
} satisfies Record<string, CSSProperties | ((...args: never[]) => CSSProperties)>;

export const segmentStyles = {
  actionLine(open: boolean): CSSProperties {
    return {
      background: open ? segmentSurface : surfacePanel,
      color: textMuted,
      display: "flex",
      fontSize: "0.92rem",
      fontWeight: 600,
      justifyContent: "flex-end",
      margin: 0,
      padding: "0.36rem 0.82rem 0.26rem",
      textAlign: "center",
    };
  },
  actionDivider: {
    color: textMuted,
    fontWeight: 600,
    lineHeight: 1,
    padding: "0 0.16rem",
    userSelect: "none",
  },
  actionLink: {
    background: "transparent",
    border: 0,
    boxShadow: "none",
    color: textStrong,
    cursor: "pointer",
    display: "inline",
    font: "inherit",
    fontWeight: 700,
    outline: "none",
    padding: 0,
    textDecoration: "underline",
  },
  content: {
    display: "grid",
    gap: "0.3rem",
    gridTemplateColumns: "minmax(0, 1fr)",
    margin: 0,
    padding: "0.72rem 0 0.82rem 0.24rem",
  },
  contentShell: {
    background: surfacePanel,
    border: 0,
    borderRadius: 0,
    margin: 0,
    padding: 0,
  },
  count(open: boolean): CSSProperties {
    return {
      alignItems: "center",
      background: surfacePanel,
      borderRadius: "999px",
      //border: `1px solid ${open ? borderAccent : borderSubtle}`,
      boxSizing: "border-box",
      color: open ? accentText : textMuted,
      display: "inline-flex",
      flex: "0 0 auto",
      fontSize: "0.82rem",
      fontWeight: 700,
      height: "1.45rem",
      justifyContent: "center",
      minWidth: "1.45rem",
      padding: "0 0.32rem",
    };
  },
  root(open: boolean): CSSProperties {
    return {
      backgroundColor: surfacePanel,
      borderTop: `1px solid ${borderSubtle}`,
      borderRadius: "0",
      boxSizing: "border-box",
      boxShadow: "none",
      margin: 0,
      overflow: "hidden",
      width: "100%",
    };
  },
  trigger(open: boolean): CSSProperties {
    return {
      alignItems: "center",
      background: open ? segmentSurface : "transparent",
      border: "none",
      boxSizing: "border-box",
      color: textStrong,
      cursor: "pointer",
      display: "flex",
      font: "inherit",
      fontWeight: 700,
      gap: "0.65rem",
      height: "auto",
      justifyContent: "flex-start",
      letterSpacing: 0,
      minHeight: "2.85rem",
      padding: "0.424rem 0.88rem 0.442rem",
      textAlign: "left",
      textDecoration: "none",
      transition: "none",
      transform: "none",
      width: "100%",
    };
  },
  triggerHover: {
    background: surfaceRaised,
  },
} satisfies Record<string, CSSProperties | ((...args: never[]) => CSSProperties)>;
