import { createRoot } from "react-dom/client";
import { IqPanel } from "../../src/features/iq";
import type { IqReport, IqWorkerClient } from "../../src/features/iq";

const report = {
  iq_doc: 90,
  decision: "Review",
  gates: [
    { code: "gate-pass", status: "PASS", description: 'Notary Seal is present. This requirement is satisfied. Notary Seal is "YES".' },
    {
      code: "gate-fail",
      status: "FAIL",
      kind: "MissingIndexes",
      fields: ["party_address", "legal_description"],
      description: "Missing indexes: Party Address or Legal Description. Cue verification did not confirm the existence of required indexes.",
    },
    { code: "info-date", status: "INFO", description: "Missing indexes: Effective Date. Cue verification did not confirm the existence of required indexes." },
    { code: "info-address", status: "INFO", description: "Missing indexes: Party Address. Cue verification did not confirm the existence of required indexes." },
    { code: "info-amount", status: "INFO", description: "Missing indexes: Promissory Note Amount. Cue verification did not confirm the existence of required indexes." },
    { code: "info-loan", status: "INFO", description: "Missing indexes: Loan Number. Cue verification did not confirm the existence of required indexes." },
    { code: "info-reference", status: "INFO", description: "Missing indexes: Reference Instrument or Reference Instrument Volume. Cue verification did not confirm the existence of required indexes." },
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
    return { report, metadataEtag: "" };
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
