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
    { segment_name: "transaction", expected_weight: 10, actual_weight: 10, iq: 100, explanations: [] },
    {
      segment_name: "party",
      expected_weight: 6,
      actual_weight: 5,
      iq: 90,
      explanations: ["Party clause indexing quality is acceptable."],
    },
    { segment_name: "sides", expected_weight: 12, actual_weight: 12, iq: 100, explanations: [] },
    { segment_name: "legal", expected_weight: 6, actual_weight: 0, iq: 0, explanations: [] },
    { segment_name: "reference", expected_weight: 2, actual_weight: 2, iq: 100, explanations: [] },
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
