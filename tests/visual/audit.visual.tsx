import { createRoot } from "react-dom/client";
import type { AuditReport, AuditWorkerClient } from "../../src/features/audit";
import { AuditPanel } from "../../src/features/audit";

const longMessage =
  "This is a long correction message that exceeds two hundred characters to exercise the full text collapse and expansion behavior used in the audit panel when rendering large explanations in a constrained viewport. ".repeat(
    3,
  ) + "It should clearly trigger the show more and show less behavior consistently.";

const report: AuditReport = {
  gaps: [
    {
      aspect: "ADD",
      changeType: "ADD",
      date: "2026-01-03T12:00:00Z",
      message: "Newest addition message",
      page: 3,
      process: "verification",
    },
    {
      aspect: "REMOVE",
      changeType: "REMOVE",
      date: "2026-01-01T12:00:00Z",
      message: "Old remove message",
      page: 1,
      process: "user",
    },
    {
      aspect: "CORRECTION",
      changeType: "CORRECTION",
      date: "2026-01-02T12:00:00Z",
      message: longMessage,
      page: 2,
      process: "enrichment",
    },
  ],
  usage: {
    costs: ["$1.6641", "$0.0190"],
  },
};

const workerClient: AuditWorkerClient = {
  loadReport() {
    return Promise.resolve(report);
  },
};

const stage = document.getElementById("visual-stage");
if (!stage) throw new Error("visual-stage is required.");

stage.style.overflow = "auto";
stage.style.padding = "1rem";
stage.style.boxSizing = "border-box";
stage.innerHTML = "";

createRoot(stage).render(
  <AuditPanel
    apiGatewayUrl="https://doc.example.com"
    authToken="token"
    callbacks={{}}
    onReadyChange={() => undefined}
    previewAction={<button aria-label="Close preview" type="button">X</button>}
    session="session-1"
    workerClient={workerClient}
  />,
);
