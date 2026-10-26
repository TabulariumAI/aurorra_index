import { createRoot } from "react-dom/client";
import { useState } from "react";
import { IndexContainer } from "../../src/features/indexing/component/IndexContainer";
import { createDeferredState } from "../../src/features/indexing/data/deferredState";
import { indexStoreApi, useIndexStore } from "../../src/features/metdataview/store/metadataStore";
import type { MetadataSegments } from "aurora-core";

const segments: MetadataSegments = {
  ACKNOWLEDGMENT: "acknowledgment", ENDORSEMENT: "endorsement", FEE: "fee", FEEFACTOR: "factor",
  FUND: "fund", JUDGMENT: "judgment", LEGAL: "legal", MONETARY: "monetary", PAGE: "page",
  PARTY: "party", PROPERTY: "property", REFERENCE: "reference", SECRETS: "secrets", TITLE: "title",
  TRANSACTION: "transaction", VITAL: "vital",
};
const callbacks = {
  onViewError: (error: { error: string }) => { document.body.dataset.viewError = error.error; },
};
const deferredState = createDeferredState({ segment: "page" });
const choices = [{ level: 1, service: "PartyClauseIndexing" }];

function PagesScenario() {
  const [session, setSession] = useState("first");
  const [revision, setRevision] = useState(0);
  const refresh = useIndexStore(state => state.refresh);
  const status = useIndexStore(state => state.status);
  return <>
    <div>
      <button onClick={() => indexStoreApi.getState().refreshMetadata(session, "page")}>Refresh metadata</button>
      <button onClick={() => setSession(value => value === "first" ? "second" : "first")}>Switch session</button>
      <button onClick={() => { indexStoreApi.getState().resetView(); setRevision(value => value + 1); }}>Reopen metadata</button>
      <output aria-label="Metadata state">{status}</output>
    </div>
    <IndexContainer key={revision} apiGatewayUrl="https://doc.example.com" authToken="token" batchCode={null}
      callbacks={callbacks} choices={choices} deferredState={deferredState} intervalMs={0}
      onQueueChange={() => undefined} onReadyChange={() => undefined} refresh={refresh}
      retryIntervalMs={0} retryLimit={1} segments={segments} session={session} />
  </>;
}

const stage = document.getElementById("visual-stage");
if (!stage) throw new Error("visual-stage is required.");
Object.assign(stage.style, { display: "flex", flexDirection: "column", padding: "1rem", boxSizing: "border-box" });
createRoot(stage).render(<PagesScenario />);
