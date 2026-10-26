import { pageSize } from "../../src/test/pageSize";
import { QueueActions } from "../../src/features/queue/component/QueueActions";
import { queueStoreApi, useQueueStore } from "../../src/features/queue/store/queueStore";
import { createRoot } from "react-dom/client";
import { AddIndexPanel, addIndexStoreApi, useAddIndexStore } from "../../src/features/addindex";
import { createWorkerClient, loadImagePackage, ImageViewerPanel } from "../../src/features/imageviewer";
import { imageViewerStoreApi } from "../../src/features/imageviewer/store/imageViewerStore";
import { storeApi } from "../../src/store/state/store";
import type { WorkerClient } from "../../src/features/imageviewer";
import packageMetadata from "../../src/test/package/image.json";
import tiffUrl from "../../src/test/package/image.tiff?url";

const stage = document.getElementById("visual-stage");
if (!stage) throw new Error("visual-stage is required.");
const api = new URLSearchParams(window.location.search).has("api");
const compact = new URLSearchParams(window.location.search).has("compact");

stage.style.overflow = "auto";
stage.style.padding = "1rem";
stage.style.boxSizing = "border-box";
stage.innerHTML = "";

declare global {
  interface Window {
    recoverVisualPackage?: () => Promise<void>;
    completeDocumentPackage?: boolean;
    clearVisualMatches?: () => void;
    searchVisualIndex?: (value: string) => void;
  }
}

let completePackage!: () => void;
const packageReady = new Promise<void>(resolve => { completePackage = resolve; if (window.completeDocumentPackage) resolve(); });
Object.defineProperty(window, "completeDocumentPackage", { configurable: true, set(value: boolean) { if (value) completePackage(); } });

const workerClient: WorkerClient = {
  async downloadPackage() {
    const tiff = await fetch(tiffUrl);
    const tiffBlob = await tiff.blob();
    return { packageMetadata, tiffBytes: await tiffBlob.arrayBuffer(), tiffType: tiffBlob.type };
  },
  async packageImage() {
    await packageReady;
    return {
      status: "completed",
      data: {
        data: "https://storage.example.test/image.json",
        tiff: "https://storage.example.test/image.tiff",
      },
    };
  },
};

storeApi.getState().setJSON("visual-session-001", {
  indexJSON: {
    indexes: [
      {
        code: "idx-property-address",
        label: "Property Address",
        page_number: 2,
        source: "1428 Cedar Street",
        value: "1428 Cedar Street",
      },
    ],
  },
});
window.clearVisualMatches = () => storeApi.getState().setJSON("visual-session-001", {
  indexJSON: { indexes: [{ code: "other", segment: "property", value: "Unrelated words", source: "Different context" }] },
});

const hostInput = {
  apiGatewayUrl: "https://gateway.example.test",
  authToken: "token",
  pageCount: 4,
  pageMap: new Map([["1", "page-cover"], ["2", "page-legal"], ["3", "page-reference"], ["4", "page-ack"]]),
  request: {
    code: "idx-property-address",
    highlightOptions: { scroll: false },
    index: "property",
    page: 2,
    quote: "1428 Cedar Street",
    segment: "property",
    session: "visual-session-001",
    value: "1428 Cedar Street",
  },
  selectedIndex: { code: "idx-property-address", segment: "property" },
  session: "visual-session-001",
  workerClient: api ? createWorkerClient({ apiBaseUrl: "https://gateway.example.test" }) : workerClient,
};
if (!new URLSearchParams(window.location.search).has("uncached")) queueStoreApi.getState().setEtag(hostInput.session, "visual-etag");
window.recoverVisualPackage = () => loadImagePackage({ ...hostInput, pageSize, onError(error) { stage.dataset.error = error.error; }, restart: true });

window.searchVisualIndex = value => imageViewerStoreApi.getState().setRequest({
  ...hostInput.request,
  value,
  metadataIndex: { label: "Address", value, source: "Unmatched source", ambiguous: "NO" },
});

function VisualImageViewer() {
  const tasks = useQueueStore((state) => state.tasks);
  const completed = useQueueStore((state) => state.queues.some((queue) => queue.completed > 0));
  stage.dataset.addIndexComplete = String(completed);
  const request = useAddIndexStore((state) => state.request);

  return (
    <>
      <ImageViewerPanel renderTolerance={({ children }) => children}
        compact={compact}
        hostInput={{
          pageSize,
          choices: [{ service: "Recognition", level: 6 }],
          ...hostInput,
          onError(error) {
            stage.dataset.error = error.error;
          },
        }}
        onLoaderChange={(lines) => {
          if (lines) {
            stage.dataset.imageLoader = JSON.stringify(lines);
          } else {
            delete stage.dataset.imageLoader;
          }
        }}
        onReadyChange={(ready) => {
          stage.dataset.imageReady = String(ready);
        }}
      />
      {request ? (
        <div data-testid="add-index-host">
          <AddIndexPanel
            apiGatewayUrl={hostInput.apiGatewayUrl}
            authToken={hostInput.authToken}
            intervalMs={0}
            retryIntervalMs={0}
            retryLimit={0}
            batchCode={null}
            onQueueChange={() => {}}
            onClose={() => addIndexStoreApi.getState().close()}
            onError={(error) => {
              stage.dataset.error = error.error;
            }}
            onReadyChange={(ready) => {
              stage.dataset.addIndexReady = String(ready);
            }}
            onResource={request => request.callback({ ok: true, data: { aspects: { party: ["grantor", "grantee"] } } })}
            segment="party"
            request={request}
            session={hostInput.session}
          />
        </div>
      ) : null}
      {tasks.map((task) => <div data-testid="pending-item" key={task.id}><QueueActions id={task.id} code={task.changes[0].code} /></div>)}
    </>
  );
}

createRoot(stage).render(<VisualImageViewer />);
