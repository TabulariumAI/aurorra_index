import "../../../document_web/assets/root.css";
import { createRoot } from "react-dom/client";
import type { MetadataSegments } from "aurora-core";
import { IndexContainer } from "../../src/features/indexing/component/IndexContainer";
import { createDeferredState } from "../../src/features/indexing/data/deferredState";
import { createIndexWorkerClient } from "../../src/features/metdataview/worker/metadataWorkerClient";
import { queueStoreApi } from "../../src/features/queue/store/queueStore";

const segments: MetadataSegments = {
  ACKNOWLEDGMENT: "acknowledgment", COURT: "court", ENDORSEMENT: "endorsement", FEE: "fee",
  FEEFACTOR: "factor", FUND: "fund", LEGAL: "legal", MONETARY: "monetary", PAGE: "page",
  PARTY: "party", PROPERTY: "property", REFERENCE: "reference", SECRETS: "secrets", TITLE: "title",
  TRANSACTION: "transaction", VITAL: "vital",
};
const client = createIndexWorkerClient({ apiBaseUrl: "https://gateway.example.test", retryIntervalMs: 0, retryLimit: 0 });
const onQueueChange = () => {};
queueStoreApi.getState().restore("queue-visual-owner", { authToken: "token", client, intervalMs: 1, onChange: onQueueChange });

createRoot(document.getElementById("root")!).render(
  <main style={{ boxSizing: "border-box", display: "flex", flexDirection: "column", padding: 16, height: "100vh", overflow: "hidden" }}>
    <IndexContainer apiGatewayUrl="https://gateway.example.test" authToken="token" batchCode={null}
      callbacks={{}} choices={[{ level: 1, service: "PartyClauseIndexing" }]}
      deferredState={createDeferredState({ segment: "party", selectedIndex: null })}
      intervalMs={1} onQueueChange={onQueueChange} onReadyChange={() => {}} refresh={null}
      retryIntervalMs={0} retryLimit={0} segments={segments} session="session" workerClient={client} />
  </main>,
);
