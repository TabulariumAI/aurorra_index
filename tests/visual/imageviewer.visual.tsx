import { createRoot } from "react-dom/client";
import { ImageViewerPanel, imageViewerStoreApi } from "../../src/features/imageviewer";
import { storeApi } from "../../src/store/state/store";
import type { WorkerClient } from "../../src/features/imageviewer";
import packageMetadata from "../../src/test/package/image.json";
import tiffUrl from "../../src/test/package/image.tiff?url";

const stage = document.getElementById("visual-stage");
if (!stage) throw new Error("visual-stage is required.");

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

imageViewerStoreApi.getState().setHostInput({
  apiGatewayUrl: "https://gateway.example.test",
  authToken: "token",
  onError(error) {
    throw new Error(error.error);
  },
  onJobEvent(event) {
    stage.dataset.jobEvent = `${event.job}:${event.phase}`;
  },
  pageCount: 4,
  pageMap: new Map([["1", "page-cover"], ["2", "page-legal"], ["3", "page-reference"], ["4", "page-ack"]]),
  packagePollIntervalMs: 50,
  selectedIndex: { code: "idx-property-address", segment: "property" },
  session: "visual-session-001",
  workerClient,
});
imageViewerStoreApi.getState().setRequest({
  code: "idx-property-address",
  highlightOptions: { scroll: false },
  index: "property",
  page: 2,
  quote: "1428 Cedar Street",
  segment: "property",
  session: "visual-session-001",
  value: "1428 Cedar Street",
});

createRoot(stage).render(<ImageViewerPanel />);
