import { createRoot } from "react-dom/client";
import { IqPanel } from "../../src/features/iq";
import type { IqReport, IqWorkerClient } from "../../src/features/iq";

const report = {
  iq_doc: 90,
  decision: "Review",
  gates: [
    { code: "gate-pass", status: "PASS", description: "Pass gate" },
    {
      code: "gate-fail",
      status: "FAIL",
      kind: "MissingIndexes",
      fields: ["party_address", "legal_description"],
    },
  ],
  segments: [
    {
      segment_name: "party_clause",
      expected_weight: 50,
      actual_weight: 45,
      iq: 90,
      explanations: ["Party clause indexing quality is acceptable."],
    },
  ],
  explanation: ["Report explanation"],
} as unknown as IqReport;

const workerClient: IqWorkerClient = {
  async ackGate() {
    return { status: "ok", data: {}, isComplete: true };
  },
  async loadReport() {
    return report;
  },
  async startReport() {
    return { status: "completed", data: {}, isComplete: true };
  },
};

const stage = document.getElementById("visual-stage");
if (!stage) throw new Error("visual-stage is required.");

stage.style.overflow = "auto";
stage.style.padding = "1rem";
stage.style.boxSizing = "border-box";
stage.innerHTML = "";

createRoot(stage).render(
  <IqPanel
    apiGatewayUrl="https://doc.example.com"
    authToken="token"
    callbacks={{}}
    session="session-1"
    workerClient={workerClient}
  />,
);
