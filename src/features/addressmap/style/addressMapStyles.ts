import type { CSSProperties } from "react";

export const addressMapStyles = {
  contentShell: {
    alignItems: "stretch",
    boxSizing: "border-box",
    display: "flex",
    height: "100%",
    minHeight: 0,
    width: "100%",
  } satisfies CSSProperties,
  iframe: {
    background: "transparent",
    border: "none",
    height: "100%",
    width: "100%",
  } satisfies CSSProperties,
} as const;
