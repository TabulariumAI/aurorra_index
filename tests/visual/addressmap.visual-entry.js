import "../../../document_web/assets/root.css";

const scenario = new URLSearchParams(window.location.search).get("scenario");

if (scenario === "legal-gap") {
  await import("./legalgap.visual.tsx");
} else if (scenario === "legal-map") {
  await import("./legalmap.visual.tsx");
} else if (scenario === "audit") {
  await import("./audit.visual.tsx");
} else if (scenario === "iq") {
  await import("./iq.visual.tsx");
} else if (scenario === "metadata") {
  await import("./metadata.visual.tsx");
} else if (scenario === "metadata-reprocess") {
  await import("./metadata.visual.tsx");
} else if (scenario === "metadata-short") {
  await import("./metadata.visual.tsx");
} else if (scenario === "metadata-row") {
  await import("./metadata.visual.tsx");
} else if (scenario === "metadata-party-rows") {
  await import("./metadata.visual.tsx");
} else if (scenario === "metadata-address-row") {
  await import("./metadata.visual.tsx");
} else if (scenario === "metadata-pages") {
  await import("./metadata.visual.tsx");
} else if (scenario === "pagesegments-fail") {
  await import("./pagesegments.visual.tsx");
} else if (scenario === "pagesegments") {
  await import("./pagesegments.visual.tsx");
} else if (scenario === "imageviewer") {
  await import("./imageviewer.visual.tsx");
} else {
  await import("./addressmap.visual.tsx");
}
