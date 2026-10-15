import type { CSSProperties } from "react";

export const addressMapStyles = {
  contentShell: {
    alignItems: "stretch",
    boxSizing: "border-box",
    display: "flex",
    height: "100%",
    minHeight: 0,
    position: "relative",
    width: "100%",
  } satisfies CSSProperties,
  iframe: {
    background: "transparent",
    border: "none",
    height: "100%",
    width: "100%",
  } satisfies CSSProperties,
  timeout: {
    alignItems: "center",
    boxSizing: "border-box",
    color: "var(--body-ink)",
    display: "flex",
    flexDirection: "column",
    fontSize: "0.875rem",
    gap: "0.5rem",
    inset: 0,
    justifyContent: "center",
    padding: "1rem",
    position: "absolute",
    textAlign: "center",
  } satisfies CSSProperties,
  link: {
    alignItems: "center",
    color: "var(--primary-dark)",
    display: "inline-flex",
    fontWeight: 600,
    minHeight: "2rem",
    textDecoration: "underline",
  } satisfies CSSProperties,
} as const;
