import { createRoot } from "react-dom/client";
import { IqPanel } from "../../src/features/iq";
import type { IqReport, IqWorkerClient } from "../../src/features/iq";

const report: IqReport = {
  iq_doc: 90,
  gates: [
    { code: "gate-pass", status: "PASS", description: 'Compliance is satisfied. Notary Seal is present.' },
    {
      code: "gate-fail",
      status: "FAIL",
      description: "Compliance is not satisfied. Notary Name is unavailable.",
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
  ].map(segment => ({ ...segment, cues: [] })),
  notes: [{ segment: null, message: "Report explanation" },
    { segment: "transaction", message: "Required indexes were not confirmed: Effective Date." },
    { segment: "party", message: "Required indexes were not confirmed: Party Address." },
    { segment: "transaction", message: "Required indexes were not confirmed: Promissory Note Amount." },
    { segment: "transaction", message: "Required indexes were not confirmed: Loan Number." },
    { segment: "reference", message: "Required indexes were not confirmed: Reference Instrument or Reference Instrument Volume." },
    { segment: "transaction", message: "WARNING: The transaction segment has ambiguous index values for effective date." },
    { segment: "acknowledgment", message: "WARNING: The acknowledgment segment has ambiguous index values for acknowledgment date." },
    { segment: "execution", message: "In this instrument, a handwritten signature is visible for the borrower John Smith. The notary seal contains the notary's name, commission expiration date, and jurisdiction. The notary signature appears above the printed name and overlaps the printed text. No ambiguity was identified in the visible seal or signature." },
    { segment: "legal", message: "One parcel is described by part of the Southwest quarter of Section 4, Township 3 South, Range 9 East, with metes-and-bounds calls." },
    { segment: "sides", message: "In this instrument, John Smith is the borrower and mortgagor granting the mortgage. ACME Lending LLC is the lender. The mortgage registry acts as nominee for the lender and its successors and assigns. A name appearing only in the footer with license details is not identified as a transactional party." },
    { segment: null, message: "Compliance gates: not satisfied (1 / 2)." },
    { segment: null, message: "Indexing quality needing attention: Party." },
    { segment: null, message: "Unclassified indexes: Critical (0/0)" },
    { segment: null, message: "Unclassified indexes: High Risk (8/20)" },
    { segment: null, message: "Unclassified indexes: Needs Attention (3/20)" },
    { segment: null, message: "Unclassified indexes: Satisfied (0/20)" },
    { segment: null, message: "Unclassified indexes: Optimal (1/20)" },
  ],
};

const workerClient: IqWorkerClient = {
  async ackGate(_token, _session, code) {
    return { status: "completed", etag: "inputs-after", data: { code, status: "CLEARED" }, isComplete: true };
  },
  async ackCue(_token, _session, code) {
    return { status: "completed", etag: "inputs-after", data: { code, status: "DISMISSED" }, isComplete: true };
  },
  async loadReport() {
    return { report: structuredClone(report), metadataEtag: "", etag: "inputs-before", reportEtag: "inputs-before", acknowledgements: [] };
  },

};

const stage = document.getElementById("visual-stage");
if (!stage) throw new Error("visual-stage is required.");

stage.style.overflow = "auto";
stage.style.padding = "1rem";
stage.style.boxSizing = "border-box";
stage.style.background = "var(--white)";
stage.innerHTML = "";

createRoot(stage).render(
  <IqPanel
    apiGatewayUrl="https://doc.example.com"
    authToken="token"
    callbacks={{}}
    retryIntervalMs={7500}
    retryLimit={0}
    session="session-1"
    workerClient={workerClient}
  />,
);
