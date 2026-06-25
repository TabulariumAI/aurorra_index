import type { CSSProperties } from "react";

export const addressMapDialogStyles = {
  header: {
    alignItems: "center",
    background: "#ffffff",
    borderBottom: "1px solid #d9e1ea",
    boxSizing: "border-box",
    display: "flex",
    flex: "1 1 auto",
    justifyContent: "center",
    minHeight: "2.2rem",
    minWidth: 0,
    padding: "0.35rem 0.75rem",
    width: "100%",
  } satisfies CSSProperties,
  headerTitle: {
    color: "#0f172a",
    fontSize: "0.9rem",
    fontWeight: 600,
    lineHeight: 1.4,
  } satisfies CSSProperties,
  content: {
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
    height: "100%",
    minHeight: 0,
    padding: "0.5rem 0.75rem 0.65rem",
    width: "100%",
  } satisfies CSSProperties,
  map: {
    alignItems: "stretch",
    boxSizing: "border-box",
    display: "flex",
    flex: "1 1 auto",
    minHeight: 0,
    width: "100%",
  } satisfies CSSProperties,
} as const;
