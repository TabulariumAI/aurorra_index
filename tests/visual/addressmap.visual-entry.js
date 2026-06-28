const scenario = new URLSearchParams(window.location.search).get("scenario");

if (scenario === "legal-gap") {
  await import("./legalgap.visual.tsx");
} else if (scenario === "iq") {
  await import("./iq.visual.tsx");
} else {
  await import("./addressmap.visual.tsx");
}
