import type { CSSProperties } from "react";

export const metadataSpinnerCss = `
@keyframes aurorra-index-spinner {
  to { transform: rotate(360deg); }
}

@media (prefers-reduced-motion: reduce) {
  .aurorra-index-progress-spinner {
    animation: none !important;
  }
}
`;

const surfacePanel = "var(--white)";
const surfaceRaised = "var(--gray-50)";
const surfaceAccent = "var(--accent-surface)";
const segmentSurface = surfaceRaised;
const borderSubtle = "var(--border-card)";
const borderAccent = "var(--primary)";
const textStrong = "var(--title-ink)";
const textMuted = "var(--slate-500)";
const teal = "var(--primary)";

export const metadataStyles = {
  accordion: {
    alignItems: "stretch",
    boxSizing: "border-box",
    display: "flex",
    flex: "1 1 0",
    flexDirection: "column",
    gap: "0.75rem",
    minHeight: 0,
    overflowX: "hidden",
    overflowY: "auto",
    padding: "0 1.2rem var(--panel-content-padding)",
  },
  article: {
    background: surfacePanel,
    border: `1px solid ${borderSubtle}`,
    borderLeft: "0.13rem solid var(--primary-dark)",
    color: textStrong,
    margin: 0,
    padding: "0.48rem 0.66rem",
  },
  batch: {
    color: textStrong,
    display: "block",
    fontSize: "0.75rem",
    fontWeight: 700,
    lineHeight: 1.35,
    maxWidth: "100%",
    overflowWrap: "anywhere",
    whiteSpace: "normal",
  },
  header: {
    alignItems: "center",
    background: surfacePanel,
    border: 0,
    borderBottom: "1px solid var(--border-card)",
    boxSizing: "border-box",
    boxShadow: "none",
    display: "flex",
    flexWrap: "wrap",
    gap: "var(--panel-header-gap)",
    justifyContent: "space-between",
    margin: 0,
    minHeight: "var(--panel-header-height)",
    flex: "0 0 auto",
    padding: "var(--panel-header-padding)",
    position: "static",
    textAlign: "left",
  },
  footerEmpty: {
    flex: "0 0 0",
    height: 0,
    overflow: "hidden",
    padding: 0,
  },
  headerInfo: {
    alignItems: "flex-end",
    display: "flex",
    flex: "0 1 auto",
    flexDirection: "column",
    maxWidth: "100%",
    minWidth: 0,
    textAlign: "right",
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
  rootShell: {
    boxSizing: "border-box",
    color: textStrong,
    display: "flex",
    flex: "1 1 auto",
    flexDirection: "column",
    gap: "0.55rem",
    minHeight: 0,
    minWidth: 0,
    overflow: "hidden",
    position: "relative",
    textAlign: "left",
    verticalAlign: "top",
    width: "100%",
  },
  root: {
    color: textStrong,
    fontFamily: "var(--font-ui)",
    display: "flex",
    flex: "1 1 auto",
    flexDirection: "column",
    gap: 0,
    minHeight: 0,
    overflow: "hidden",
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
    fontSize: "0.75rem",
    fontWeight: 500,
    lineHeight: 1.35,
    maxWidth: "100%",
    overflow: "hidden",
    textAlign: "right",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  title: {
    color: textStrong,
    flex: "1 1 auto",
    fontSize: "calc(var(--panel-title-size) * 1.15)",
    fontWeight: "var(--panel-title-weight)",
    letterSpacing: "var(--panel-title-tracking)",
    lineHeight: "var(--panel-title-line-height)",
    margin: 0,
    minWidth: "min-content",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
} satisfies Record<string, CSSProperties>;

export function legalSummaryStyle(): CSSProperties {
  return {
    ...metadataStyles.muted,
    margin: "0 0 0.65rem",
  };
}

export function disclosureButtonStyle(hovered: boolean, focused: boolean): CSSProperties {
  return {
    alignItems: "flex-start",
    appearance: "none",
    background: hovered || focused ? surfaceAccent : "transparent",
    border: `1px solid ${hovered || focused ? borderAccent : "transparent"}`,
    borderRadius: "var(--radius-control)",
    boxShadow: "none",
    color: textStrong,
    cursor: "pointer",
    display: "inline-flex",
    height: "2.75rem",
    justifyContent: "center",
    outline: focused ? `2px solid ${borderAccent}` : "none",
    outlineOffset: "3px",
    padding: 0,
    position: "absolute",
    right: 0,
    top: 0,
    transition: "background 120ms ease, border-color 120ms ease, color 120ms ease, outline-color 120ms ease",
    width: "2.75rem",
  };
}

export const detailLabelStyle: CSSProperties = {
  color: textStrong,
  fontWeight: 700,
};

export function detailLineStyle(hasDisclosure: boolean): CSSProperties {
  return {
    display: "block",
    minHeight: hasDisclosure ? "1.5rem" : undefined,
    minWidth: 0,
    position: "relative",
    width: "100%",
  };
}

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
    paddingRight: hasDisclosure ? "1.75rem" : 0,
    textOverflow: open || !hasDisclosure ? "clip" : "ellipsis",
    whiteSpace: open || !hasDisclosure ? "normal" : "nowrap",
    wordBreak: "break-word",
  };
}

export const rowStyles = {
  actionButton(disabled: boolean, lineAligned: boolean, text: boolean): CSSProperties {
    return {
      alignItems: lineAligned ? "flex-start" : "center",
      background: "transparent",
      border: "1px solid transparent",
      borderRadius: "var(--radius-control)",
      color: teal,
      cursor: disabled ? "not-allowed" : "pointer",
      display: "inline-flex",
      appearance: "none",
      boxShadow: "none",
      fontSize: text ? "0.78rem" : undefined,
      fontWeight: 600,
      gap: text ? "0.3rem" : 0,
      height: "2.75rem",
      outline: "1px solid transparent",
      width: text ? "auto" : "2.75rem",
      justifyContent: "center",
      minHeight: "2.75rem",
      minWidth: text ? 0 : "2.75rem",
      opacity: disabled ? 0.55 : 1,
      padding: text ? "0 0.5rem" : 0,
      transition: "background 120ms ease, color 120ms ease, outline-color 120ms ease, border-color 120ms ease",
      whiteSpace: text ? "nowrap" : undefined,
    };
  },
  actionButtonHover: {
    color: borderAccent,
    background: `${surfaceAccent}`,
  },
  actionProgress: {
    alignItems: "center",
    display: "inline-flex",
    flex: "0 0 auto",
    height: "2.75rem",
    justifyContent: "center",
    minHeight: "2.75rem",
    minWidth: "2.75rem",
    width: "2.75rem",
  },
  actionGroup: {
    alignSelf: "start",
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
  content: {
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
    minWidth: 0,
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
      alignItems: "start",
      display: "grid",
      gap: "0.25rem",
      gridTemplateColumns: "minmax(0, 1fr) auto",
      position: "relative",
      margin: 0,
      padding: "0.45rem 0.72rem",
      textAlign: "left",
    };
  },
  tooltip: {
    background: "var(--title-ink)",
    borderRadius: "var(--radius-control)",
    color: "var(--white)",
    fontSize: "0.75rem",
    padding: "0.35rem 0.5rem",
    zIndex: 60,
  },
  value: {
    color: textStrong,
    flex: "1 1 auto",
    fontSize: "0.98rem",
    fontWeight: 700,
    lineHeight: 1.25,
    letterSpacing: 0,
    minWidth: 0,
    overflowWrap: "anywhere",
    position: "relative",
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
  valueText(open: boolean, hasDisclosure: boolean): CSSProperties {
    return {
      boxSizing: "border-box",
      display: "block",
      minHeight: hasDisclosure ? "1.5rem" : undefined,
      minWidth: 0,
      overflow: open || !hasDisclosure ? "visible" : "hidden",
      overflowWrap: "anywhere",
      paddingRight: hasDisclosure ? "1.75rem" : 0,
      textOverflow: open || !hasDisclosure ? "clip" : "ellipsis",
      whiteSpace: open || !hasDisclosure ? "normal" : "nowrap",
      wordBreak: "break-word",
    };
  },
  valueWithViewer: {
    alignItems: "flex-start",
    display: "flex",
    flex: "1 1 auto",
    gap: "0.35rem",
    minWidth: 0,
  },
} satisfies Record<string, CSSProperties | ((...args: never[]) => CSSProperties)>;

export const segmentStyles = {
  actionGroup: {
    alignItems: "center",
    display: "flex",
    flex: "0 0 auto",
    gap: "0.25rem",
  },
  actionProgress: {
    alignItems: "center",
    display: "inline-flex",
    flex: "0 0 auto",
    height: "2.75rem",
    justifyContent: "center",
    minHeight: "2.75rem",
    minWidth: "2.75rem",
    width: "2.75rem",
  },
  reprocessSpinner: {
    animation: "aurorra-index-spinner 1.35s linear infinite",
    border: "2px solid rgba(0, 139, 163, 0.25)",
    borderRadius: "999px",
    borderTopColor: "var(--primary)",
    boxSizing: "border-box",
    display: "inline-block",
    flex: "0 0 auto",
    height: "0.9rem",
    width: "0.9rem",
  },
  content: {
    display: "grid",
    gap: "0.3rem",
    gridTemplateColumns: "minmax(0, 1fr)",
    margin: 0,
    padding: "0.72rem 0 0.82rem",
  },
  contentShell: {
    background: surfacePanel,
    border: 0,
    borderRadius: 0,
    margin: 0,
    padding: 0,
  },
  header(open: boolean): CSSProperties {
    return {
      alignItems: "center",
      background: open ? segmentSurface : "transparent",
      boxSizing: "border-box",
      color: textStrong,
      display: "flex",
      gap: "0.65rem",
      justifyContent: "flex-start",
      letterSpacing: 0,
      minHeight: "2.85rem",
      padding: "0.424rem 0 0.442rem",
      textAlign: "left",
      width: "100%",
    };
  },
  headerHover: {
    background: surfaceRaised,
  },
  count(): CSSProperties {
    return {
      alignItems: "center",
      background: surfacePanel,
      border: `1px solid ${borderSubtle}`,
      borderRadius: "999px",
      boxSizing: "border-box",
      color: textMuted,
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
  root: {
    backgroundColor: surfacePanel,
    borderTop: `1px solid ${borderSubtle}`,
    borderRadius: "0",
    boxSizing: "border-box",
    boxShadow: "none",
    flex: "0 0 auto",
    margin: 0,
    overflow: "hidden",
    width: "100%",
  },
  trigger: {
    alignSelf: "stretch",
    appearance: "none",
    background: "transparent",
    border: "none",
    borderRadius: 0,
    boxSizing: "border-box",
    boxShadow: "none",
    color: textStrong,
    cursor: "pointer",
    display: "flex",
    flex: "1 1 auto",
    font: "inherit",
    fontWeight: 700,
    justifyContent: "flex-start",
    minWidth: 0,
    padding: 0,
    textAlign: "left",
    textDecoration: "none",
    transition: "none",
    transform: "none",
  },
} satisfies Record<string, CSSProperties | ((...args: never[]) => CSSProperties)>;
