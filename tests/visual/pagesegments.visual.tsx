import { QueueActions } from "../../src/features/queue/component/QueueActions";
import { createRoot } from "react-dom/client";
import { useState } from "react";
import { PageSegmentsPanel, type PageSegmentsPanelProps } from "../../src/features/pagesegments";
import { composeMetadataJSON, replaceMetadataPageSegments, splitMetadataJSON } from "aurora-core";
import { createIndexWorkerClient, useQueueStore } from "../../src/public-api";
import { storeApi } from "../../src/store/state/store";
import type { MetadataPayload } from "aurora-core";

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

let saved = metadata;
const workerClient: PageSegmentsPanelProps["workerClient"] = {
  ...createIndexWorkerClient({ apiBaseUrl: "https://doc.example.com", retryIntervalMs: 0, retryLimit: 0 }),
  async updatePageSegments(_token, _session, pageCode, segments) {
    if (forceFailure) throw buildError("Could not save page segments.");
    saved = composeMetadataJSON(replaceMetadataPageSegments(splitMetadataJSON(saved), pageCode, segments))!;
  },
  async indexData() { return saved; },
};

function PageSegmentsVisualHarness() {
  const [closed, setClosed] = useState(false);
  const tasks = useQueueStore((state) => state.tasks);
  return (
    <>
      {!closed ? <PageSegmentsPanel
        apiGatewayUrl="https://doc.example.com"
        authToken="token"
        batchCode={null}
        intervalMs={0}
        retryIntervalMs={0}
        retryLimit={0}
        choices={choices}
        onClose={() => setClosed(true)}
        onError={() => undefined}
        onReadyChange={() => undefined}
        pageClass="blank"
        pageCode="page-1"
        segments={["reference", "party"]}
        session={session}
        workerClient={workerClient}
      /> : null}
      {tasks.map((task) => <div data-testid="pending-item" key={task.id}><QueueActions id={task.id} code={task.changes[0].code} /></div>)}
    </>
  );
}

stage.style.overflow = "auto";
stage.style.padding = "1rem";
stage.style.boxSizing = "border-box";
stage.innerHTML = "";
createRoot(stage).render(<PageSegmentsVisualHarness />);
