import "../../../document_web/assets/root.css";
import { createRoot } from "react-dom/client";
import { splitMetadataJSON } from "aurora-core";
import { AddIndexPanel } from "../../src/features/addindex";
import { EditIndexPanel } from "../../src/features/editindex";
import { storeApi } from "../../src/store/state/store";

const params = new URLSearchParams(location.search);
const segment = params.get("segment") ?? "party";
const index = { code: "index-1", segment, label: "Index", aspect: segment === "party" ? "person" : "parcel_id", value: "Original" };
storeApi.getState().setJSON("session", splitMetadataJSON({ indexes: segment === "party" ? [] : [index], parties: segment === "party" ? [index] : [] }));
const props = {
  apiGatewayUrl: "https://gateway.example.test", authToken: "token", batchCode: null,
  intervalMs: 1, retryIntervalMs: 0, retryLimit: 0,
  onResource: async () => ({ aspects: { party: ["person"], property: ["parcel_id"], transaction: ["recording_number"] } }),
  onClose: () => { document.body.dataset.closed = "true"; },
  onError: (error: unknown) => { throw new Error(JSON.stringify(error)); },
  onQueueChange: () => {}, onReadyChange: () => {},
};
createRoot(document.getElementById("root")!).render(
  <main style={{ boxSizing: "border-box", width: "100%", maxWidth: 560, padding: 24, margin: "0 auto" }}>
    {params.get("mode") === "update"
      ? <EditIndexPanel {...props} request={{ segment, session: "session", index }} />
      : <AddIndexPanel {...props} segment={segment} session="session" request={{ segment }} />}
  </main>,
);
