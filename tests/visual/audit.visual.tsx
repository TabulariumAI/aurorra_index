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
      solution: "ADD",
      explanation: "Newest addition message",
      page: "3",
      owner: "verification",
      timestamp: "2026-01-03T12:00:00Z",
      segment: "reference",
    },
    {
      solution: "REMOVE",
      explanation: "Old remove message",
      page: "1",
      owner: "user",
      timestamp: "2026-01-01T12:00:00Z",
      segment: "party",
    },
    {
      solution: "CORRECTION",
      explanation: longMessage,
      page: "2",
      owner: "enrichment",
      timestamp: "2026-01-02T12:00:00Z",
      segment: null,
    },
  ],
  usage: { services: [] },
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
    onResource={request => {
      void fetch("https://doc.example.com/v1/model/aspects").then(response => response.json()).then(
        data => request.callback({ ok: true, data }),
        error => request.callback({ ok: false, error: error.message }),
      );
    }}
    apiGatewayUrl="https://doc.example.com"
    authToken="token"
    callbacks={{}}
    session="session-1"
    retryLimit={1}
    retryIntervalMs={0}
    workerClient={new URLSearchParams(location.search).has("details") ? undefined : workerClient}
  />,
);
