import type { CSSProperties } from "react";

export const legalPlatDialogStyles = {
  content: {
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    height: "100%",
    minHeight: 0,
    width: "100%",
  },
  plat: {
    display: "flex",
    flex: "1 1 auto",
    minHeight: 0,
    width: "100%",
  },
} satisfies Record<string, CSSProperties>;
