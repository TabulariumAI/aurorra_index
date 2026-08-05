import { createRoot } from "react-dom/client";
import { AddIndexPanel, addIndexStoreApi, useAddIndexStore } from "../../src/features/addindex";
import { ImageViewerPanel } from "../../src/features/imageviewer";
import { storeApi } from "../../src/store/state/store";
import type { WorkerClient } from "../../src/features/imageviewer";
import packageMetadata from "../../src/test/package/image.json";
import tiffUrl from "../../src/test/package/image.tiff?url";

const stage = document.getElementById("visual-stage");
if (!stage) throw new Error("visual-stage is required.");
const compact = new URLSearchParams(window.location.search).has("compact");

stage.style.overflow = "auto";
stage.style.padding = "1rem";
stage.style.boxSizing = "border-box";
stage.innerHTML = "";

declare global {
  interface Window {
    completeDocumentPackage?: boolean;
  }
}

const workerClient: WorkerClient = {
  async downloadPackage() {
    const tiff = await fetch(tiffUrl);
    const tiffBlob = await tiff.blob();
    return { packageMetadata, tiffBytes: await tiffBlob.arrayBuffer(), tiffType: tiffBlob.type };
  },
  async imageData() {
    return {
      status: "completed",
      data: {
        data: "https://storage.example.test/image.json",
        tiff: "https://storage.example.test/image.tiff",
      },
    };
  },
  async imageStatus() {
    return { status: window.completeDocumentPackage ? "completed" : "processing", data: "" };
  },
  async packageImage() {
    return { status: "processing", data: "" };
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

const hostInput = {
  apiGatewayUrl: "https://gateway.example.test",
  authToken: "token",
  pageCount: 4,
  pageMap: new Map([["1", "page-cover"], ["2", "page-legal"], ["3", "page-reference"], ["4", "page-ack"]]),
  packagePollIntervalMs: 50,
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
  workerClient,
};

function VisualImageViewer() {
  const selection = useAddIndexStore((state) => state.selection);

  return (
    <>
      <ImageViewerPanel
        compact={compact}
        hostInput={{
          ...hostInput,
          onError(error) {
            stage.dataset.error = error.error;
          },
          onJobEvent(event) {
            stage.dataset.event = event.phase;
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
        previewAction={<button aria-label="Close preview" type="button">X</button>}
      />
      {selection ? (
        <div data-testid="add-index-host">
          <AddIndexPanel
            apiGatewayUrl={hostInput.apiGatewayUrl}
            authToken={hostInput.authToken}
            onClose={() => addIndexStoreApi.getState().close()}
            onComplete={() => {
              stage.dataset.addIndexComplete = "true";
            }}
            onError={(error) => {
              stage.dataset.error = error.error;
            }}
            onJobEvent={(event) => {
              stage.dataset.event = event.phase;
            }}
            onReadyChange={(ready) => {
              stage.dataset.addIndexReady = String(ready);
            }}
            selection={selection}
            session={hostInput.session}
          />
        </div>
      ) : null}
    </>
  );
}

createRoot(stage).render(<VisualImageViewer />);
