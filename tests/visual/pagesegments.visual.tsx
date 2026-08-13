import { createRoot } from "react-dom/client";
import { useMemo, useState } from "react";
import { PageSegmentsPanel, type PageSegmentsPanelProps } from "../../src/features/pagesegments";
import { splitMetadataJSON } from "../../src/features/metdataview/data/metadataData";
import { storeApi } from "../../src/store/state/store";
import type { MetadataPayload } from "../../src/features/metdataview/type/metadataView.types";

const metadata: MetadataPayload = {
  fees: [],
  funds: [],
  heading: { class: "deed", title: "Warranty Deed" },
  pages: {
    num_of_pages: 2,
    recordables: [
      {
        class: "deed",
        code: "page-1",
        name: "1",
        segments: ["reference", "property"],
      },
      {
        code: "page-2",
        name: "2",
        segments: ["reference"],
      },
    ],
    nonrecordables: [
      {
        code: "page-3",
        name: "3",
        segments: ["secrets"],
      },
    ],
  },
  secrets: [],
};

const session = "visual-session-pagesegments";
const choices = [
  { level: 1, service: "RecitalIndexing" },
  { level: 1, service: "ExhibitIndexing" },
  { level: 0, service: "ConfidentialIndexing" },
  { level: 1, service: "EndorsementIndexing" },
  { level: 1, service: "PartyClauseIndexing" },
];

function buildError(message: string): Error & { code: string; status: number } {
  return Object.assign(new Error(message), { code: "pagesegments_update_failed", status: 500 });
}

const stage = document.getElementById("visual-stage");
if (!stage) {
  throw new Error("visual-stage is required.");
}

const scenario = new URLSearchParams(window.location.search).get("scenario");
const forceFailure = scenario === "pagesegments-fail";
storeApi.getState().setJSON(session, splitMetadataJSON(metadata));

const workerClient: PageSegmentsPanelProps["workerClient"] = {
  async updatePageSegments(token, currentSession, pageCode, pageSegments) {
    if (forceFailure) {
      void token;
      void currentSession;
      void pageCode;
      void pageSegments;
      throw buildError("Could not save page segments.");
    }
    await Promise.resolve();
  },
};

function PageSegmentsVisualHarness() {
  const [completeMessage, setCompleteMessage] = useState("");

  const onComplete = (event: { pageCode: string; session: string; segments: string[] }) => {
    setCompleteMessage(`Updated ${event.pageCode} in ${event.session} to ${event.segments.join(",")}`);
  };

  const onError = (event: { error: { error: string }; pageCode: string; session: string }) => {
    setCompleteMessage(`Failed ${event.pageCode} in ${event.session}: ${event.error.error}`);
  };

  const onClose = () => setCompleteMessage("closed");

  const authToken = useMemo(() => "token", []);

  return (
    <>
      <PageSegmentsPanel
        apiGatewayUrl="https://doc.example.com"
        authToken={authToken}
        choices={choices}
        onClose={onClose}
        onComplete={onComplete}
        onError={onError}
        onReadyChange={() => undefined}
        pageClass="blank"
        pageCode="page-1"
        segments={["reference", "party"]}
        session={session}
        workerClient={workerClient}
      />
      <div data-testid="completion-message">{completeMessage}</div>
    </>
  );
}

stage.style.overflow = "auto";
stage.style.padding = "1rem";
stage.style.boxSizing = "border-box";
stage.innerHTML = "";
createRoot(stage).render(<PageSegmentsVisualHarness />);
