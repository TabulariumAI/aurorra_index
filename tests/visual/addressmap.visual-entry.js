const scenario = new URLSearchParams(window.location.search).get("scenario");

if (scenario === "legal-gap") {
  await import("./legalgap.visual.tsx");
} else if (scenario === "legal-plat") {
  await import("./legalplat.visual.tsx");
} else if (scenario === "audit") {
  await import("./audit.visual.tsx");
} else if (scenario === "iq") {
  await import("./iq.visual.tsx");
} else if (scenario === "metadata") {
  await import("./metadata.visual.tsx");
} else if (scenario === "metadata-short") {
  await import("./metadata.visual.tsx");
} else if (scenario === "imageviewer") {
  await import("./imageviewer.visual.tsx");
} else {
  await import("./addressmap.visual.tsx");
}
