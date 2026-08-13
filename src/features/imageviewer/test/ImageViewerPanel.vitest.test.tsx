import { readFileSync } from "node:fs";
import path from "node:path";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ViewerState } from "@tabulariumai/aurora-lens";
import { afterEach, describe, expect, it, vi } from "vitest";
import { addIndexStoreApi } from "../../addindex/store/addIndexStore";
import { imageViewerStoreApi } from "../store/imageViewerStore";

let viewerPageCount = 2;
let viewerPage = 2;
let viewerReloadId = 0;
let viewerRestoring = false;
let viewerRestoredSession = false;
const exportSelection = vi.hoisted(() => vi.fn(async () => ({
  groups: [
    { value: { context: ["Selected context"], kind: ["BODY"], token: ["Selected value"] } },
  ],
  pageNumber: 3,
})));
const select = vi.hoisted(() => vi.fn());
const showThumbnails = vi.hoisted(() => vi.fn());

vi.mock("../hook/useImageViewer", () => ({
  useImageViewer: () => ({
    actualSize: vi.fn(),
    canActualSize: true,
    canClearSearch: true,
    canExport: true,
    canFitHeight: true,
    canFitPage: true,
    canFitWidth: true,
    canGoFirst: true,
    canGoLast: true,
    canGoNext: true,
    canGoPrevious: true,
    canSearch: true,
    canSelect: true,
    canShowThumbnails: true,
    canZoomIn: true,
    canZoomOut: true,
    clearSearch: vi.fn(),
    exportSelection,
    firstPage: vi.fn(),
    fitHeight: vi.fn(),
    fitPage: vi.fn(),
    fitWidth: vi.fn(),
    isThumbs: false,
    lastPage: vi.fn(),
    lensHostRef: { current: null },
    nextPage: vi.fn(),
    page: viewerPage,
    pageCount: viewerPageCount,
    previousPage: vi.fn(),
    reloadId: viewerReloadId,
    search: vi.fn(),
    selecting: false,
    select,
    showThumbnails,
    zoom: 1,
    zoomIn: vi.fn(),
    zoomOut: vi.fn(),
    isLoading: false,
    isRestoredSession: viewerRestoredSession,
    isRestoring: viewerRestoring,
  }),
}));

import { ImageViewerPanel } from "../component/ImageViewerPanel";

const directPackageRaw = readFileSync(path.join(process.cwd(), "src", "test", "package", "image-package.json"), "utf8");
const directPackage = JSON.parse(directPackageRaw) as { data: string; tiff: string };
const previewAction = <button type="button">Close preview</button>;
const onReadyChange = vi.fn();

describe("ImageViewerPanel", () => {
  afterEach(() => {
    addIndexStoreApi.getState().close();
    imageViewerStoreApi.getState().resetViewer();
    viewerPageCount = 2;
    viewerPage = 2;
    viewerReloadId = 0;
    viewerRestoring = false;
    viewerRestoredSession = false;
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    exportSelection.mockClear();
    select.mockClear();
    showThumbnails.mockClear();
    onReadyChange.mockClear();
  });

  it("completes the package flow through the host", async () => {
    const onError = vi.fn();
    const onLoaderChange = vi.fn();
    const workerClient = {
      packageImage: vi.fn(async () => ({ status: "processing", data: "" })),
      imageStatus: vi.fn(async () => ({ status: "completed", data: "" })),
      imageData: vi.fn(async () => ({
        status: "completed" as const,
        data: directPackage,
      })),
      downloadPackage: vi.fn(async () => ({ packageMetadata: { pages: [] }, tiffBytes: new ArrayBuffer(4), tiffType: "image/tiff" })),
    };
    imageViewerStoreApi.getState().setHostInput({
      apiGatewayUrl: "https://gateway",
      authToken: "token",
      onError,
      pageCount: 2,
      pageMap: new Map(),
      packagePollIntervalMs: 1,
      request: null,
      selectedIndex: null,
      session: "session-1",
      workerClient,
    });

    render(<ImageViewerPanel compact={false} onLoaderChange={onLoaderChange} onReadyChange={onReadyChange} previewAction={previewAction} />);

    expect(screen.queryByRole("progressbar", { name: "image viewer progress" })).not.toBeInTheDocument();
    expect(onReadyChange).toHaveBeenCalledWith(false);
    await waitFor(() => expect(onLoaderChange).toHaveBeenCalledWith(["Backend is generating the image package"]));
    expect(screen.getByRole("button", { name: "Close preview" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Image viewer" })).not.toHaveStyle({ border: "1px solid rgba(15, 23, 42, 0.18)" });
    expect(screen.getByRole("button", { name: /^Select$/ })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Export" })).toBeEnabled();
    await waitFor(() => expect(imageViewerStoreApi.getState().status).toBe("ready"));
    await waitFor(() => expect(onReadyChange).toHaveBeenLastCalledWith(true));
    expect(workerClient.packageImage).toHaveBeenCalledBefore(workerClient.imageStatus);
    expect(workerClient.imageData).toHaveBeenCalled();
    expect(workerClient.downloadPackage).toHaveBeenCalledWith("token", {
      jsonUrl: directPackage.data,
      tiffUrl: directPackage.tiff,
    });
    expect(onError).not.toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: "Copy selected words" })).not.toBeInTheDocument();
  });

  it("keeps image mode when preview becomes compact", () => {
    const view = render(<ImageViewerPanel compact onReadyChange={onReadyChange} previewAction={previewAction} />);

    expect(screen.getByLabelText("Image viewer footer toolbar")).toBeVisible();
    expect(showThumbnails).not.toHaveBeenCalled();

    view.rerender(<ImageViewerPanel compact onReadyChange={onReadyChange} previewAction={previewAction} />);
    expect(showThumbnails).not.toHaveBeenCalled();

    viewerPage = 3;
    view.rerender(<ImageViewerPanel compact onReadyChange={onReadyChange} previewAction={previewAction} />);
    expect(showThumbnails).not.toHaveBeenCalled();

    view.rerender(<ImageViewerPanel compact={false} onReadyChange={onReadyChange} previewAction={previewAction} />);
    view.rerender(<ImageViewerPanel compact onReadyChange={onReadyChange} previewAction={previewAction} />);
    expect(showThumbnails).not.toHaveBeenCalled();
  });

  it("opens Add Index with the exported selection", async () => {
    viewerRestoredSession = true;
    imageViewerStoreApi.getState().setHostInput({
      apiGatewayUrl: "https://gateway",
      authToken: "token",
      onError: vi.fn(),
      pageCount: 2,
      pageMap: new Map(),
      request: null,
      selectedIndex: null,
      session: "session-1",
    });

    render(<ImageViewerPanel compact={false} onReadyChange={onReadyChange} previewAction={previewAction} />);

    fireEvent.click(screen.getByRole("button", { name: /^Select$/ }));
    fireEvent.click(screen.getByRole("button", { name: "Export" }));

    expect(select).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(exportSelection).toHaveBeenCalledTimes(1));
    expect(addIndexStoreApi.getState().selection).toEqual({
      groups: [
        { value: { context: ["Selected context"], kind: ["BODY"], token: ["Selected value"] } },
      ],
      pageNumber: 3,
    });
  });

  it("does not restart package download when same-session panel remounts with cached package", async () => {
    const workerClient = {
      packageImage: vi.fn(async () => ({ status: "processing", data: "" })),
      imageStatus: vi.fn(async () => ({ status: "completed", data: "" })),
      imageData: vi.fn(async () => ({
        status: "completed" as const,
        data: directPackage,
      })),
      downloadPackage: vi.fn(async () => ({ packageMetadata: { pages: [] }, tiffBytes: new ArrayBuffer(4), tiffType: "image/tiff" })),
    };
    imageViewerStoreApi.getState().setHostInput({
      apiGatewayUrl: "https://gateway",
      authToken: "token",
      onError: vi.fn(),
      pageCount: 2,
      pageMap: new Map(),
      packagePollIntervalMs: 1,
      request: null,
      selectedIndex: null,
      session: "session-1",
      workerClient,
    });

    const view = render(<ImageViewerPanel compact={false} onReadyChange={onReadyChange} previewAction={previewAction} />);

    await waitFor(() => expect(imageViewerStoreApi.getState().status).toBe("ready"));
    expect(workerClient.downloadPackage).toHaveBeenCalledTimes(1);
    view.unmount();
    render(<ImageViewerPanel compact={false} onReadyChange={onReadyChange} previewAction={previewAction} />);

    await waitFor(() => expect(screen.queryByRole("progressbar", { name: "image viewer progress" })).not.toBeInTheDocument());
    expect(workerClient.packageImage).toHaveBeenCalledTimes(1);
    expect(workerClient.imageData).toHaveBeenCalledTimes(1);
    expect(workerClient.downloadPackage).toHaveBeenCalledTimes(1);
  });

  it("re-downloads a cached package when Lens requests a reload", async () => {
    viewerReloadId = 1;
    const workerClient = {
      packageImage: vi.fn(async () => ({ status: "processing", data: "" })),
      imageStatus: vi.fn(async () => ({ status: "completed", data: "" })),
      imageData: vi.fn(async () => ({
        status: "completed" as const,
        data: directPackage,
      })),
      downloadPackage: vi.fn(async () => ({ packageMetadata: { pages: [] }, tiffBytes: new ArrayBuffer(4), tiffType: "image/tiff" })),
    };
    imageViewerStoreApi.getState().setHostInput({
      apiGatewayUrl: "https://gateway",
      authToken: "token",
      onError: vi.fn(),
      pageCount: 2,
      pageMap: new Map(),
      packagePollIntervalMs: 1,
      request: null,
      selectedIndex: null,
      session: "session-1",
      workerClient,
    });
    imageViewerStoreApi.getState().setLocalPackage({ packageMetadata: { pages: [] }, tiffBytes: new ArrayBuffer(4), tiffType: "image/tiff" });

    render(<ImageViewerPanel compact={false} onReadyChange={onReadyChange} previewAction={previewAction} />);

    await waitFor(() => expect(workerClient.packageImage).toHaveBeenCalledTimes(1));
    expect(workerClient.imageData).toHaveBeenCalledTimes(1);
    expect(workerClient.downloadPackage).toHaveBeenCalledTimes(1);
  });

  it("does not start package flow while lens restore is pending", () => {
    viewerRestoring = true;
    const workerClient = {
      packageImage: vi.fn(),
      imageStatus: vi.fn(),
      imageData: vi.fn(),
      downloadPackage: vi.fn(),
    };
    imageViewerStoreApi.getState().setHostInput({
      apiGatewayUrl: "https://gateway",
      authToken: "token",
      onError: vi.fn(),
      pageCount: 2,
      pageMap: new Map(),
      packagePollIntervalMs: 1,
      request: null,
      selectedIndex: null,
      session: "session-1",
      workerClient,
    });

    render(<ImageViewerPanel compact={false} onReadyChange={onReadyChange} previewAction={previewAction} />);

    expect(workerClient.packageImage).not.toHaveBeenCalled();
    expect(workerClient.imageStatus).not.toHaveBeenCalled();
    expect(workerClient.imageData).not.toHaveBeenCalled();
    expect(workerClient.downloadPackage).not.toHaveBeenCalled();
  });

  it("does not start package flow after lens restore succeeds", () => {
    viewerRestoredSession = true;
    const workerClient = {
      packageImage: vi.fn(),
      imageStatus: vi.fn(),
      imageData: vi.fn(),
      downloadPackage: vi.fn(),
    };
    imageViewerStoreApi.getState().setHostInput({
      apiGatewayUrl: "https://gateway",
      authToken: "token",
      onError: vi.fn(),
      pageCount: 2,
      pageMap: new Map(),
      packagePollIntervalMs: 1,
      request: null,
      selectedIndex: null,
      session: "session-1",
      workerClient,
    });

    render(<ImageViewerPanel compact={false} onReadyChange={onReadyChange} previewAction={previewAction} />);

    expect(workerClient.packageImage).not.toHaveBeenCalled();
    expect(workerClient.imageStatus).not.toHaveBeenCalled();
    expect(workerClient.imageData).not.toHaveBeenCalled();
    expect(workerClient.downloadPackage).not.toHaveBeenCalled();
  });

  it("does not start package flow while restored lens state reaches the hook", () => {
    const workerClient = {
      packageImage: vi.fn(),
      imageStatus: vi.fn(),
      imageData: vi.fn(),
      downloadPackage: vi.fn(),
    };
    imageViewerStoreApi.getState().setHostInput({
      apiGatewayUrl: "https://gateway",
      authToken: "token",
      onError: vi.fn(),
      pageCount: 2,
      pageMap: new Map(),
      packagePollIntervalMs: 1,
      request: null,
      selectedIndex: null,
      session: "session-1",
      workerClient,
    });
    imageViewerStoreApi.getState().setViewerState({
      pageIndex: 1,
      status: "ready",
    } as unknown as ViewerState);
    imageViewerStoreApi.getState().setReady();

    render(<ImageViewerPanel compact={false} onReadyChange={onReadyChange} previewAction={previewAction} />);

    expect(workerClient.packageImage).not.toHaveBeenCalled();
    expect(workerClient.imageStatus).not.toHaveBeenCalled();
    expect(workerClient.imageData).not.toHaveBeenCalled();
    expect(workerClient.downloadPackage).not.toHaveBeenCalled();
  });

  it("starts package flow when ready status has no local package", async () => {
    const workerClient = {
      packageImage: vi.fn(async () => ({ status: "processing", data: "" })),
      imageStatus: vi.fn(async () => ({ status: "completed", data: "" })),
      imageData: vi.fn(async () => ({
        status: "completed" as const,
        data: directPackage,
      })),
      downloadPackage: vi.fn(async () => ({ packageMetadata: { pages: [] }, tiffBytes: new ArrayBuffer(4), tiffType: "image/tiff" })),
    };
    imageViewerStoreApi.getState().setHostInput({
      apiGatewayUrl: "https://gateway",
      authToken: "token",
      onError: vi.fn(),
      pageCount: 2,
      pageMap: new Map(),
      packagePollIntervalMs: 1,
      request: null,
      selectedIndex: null,
      session: "session-1",
      workerClient,
    });
    imageViewerStoreApi.getState().setStatus("ready");

    render(<ImageViewerPanel compact={false} onReadyChange={onReadyChange} previewAction={previewAction} />);

    await waitFor(() => expect(workerClient.packageImage).toHaveBeenCalledTimes(1));
    expect(workerClient.imageData).toHaveBeenCalledTimes(1);
    expect(workerClient.downloadPackage).toHaveBeenCalledTimes(1);
  });

  it("bubbles package errors without rendering a package alert", async () => {
    const onError = vi.fn();
    const workerClient = {
      packageImage: vi.fn(async () => ({ status: "processing", data: "" })),
      imageStatus: vi.fn(async () => ({ status: "completed", data: "" })),
      imageData: vi.fn(async () => ({
        status: "completed" as const,
        data: { data: "", tiff: "" },
      })),
      downloadPackage: vi.fn(),
    };
    imageViewerStoreApi.getState().setHostInput({
      apiGatewayUrl: "https://gateway",
      authToken: "token",
      onError,
      pageCount: 2,
      pageMap: new Map(),
      packagePollIntervalMs: 1,
      request: null,
      selectedIndex: null,
      session: "session-1",
      workerClient,
    });

    render(<ImageViewerPanel compact={false} onReadyChange={onReadyChange} previewAction={previewAction} />);

    await waitFor(() => expect(onError).toHaveBeenCalledWith(expect.objectContaining({
      code: "invalid_image_package",
      error: "Image package JSON does not identify TIFF and JSON URLs.",
    })));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(workerClient.downloadPackage).not.toHaveBeenCalled();
  });

  it("reports lens progress before the first Aurora Lens page is available", () => {
    viewerPageCount = 0;
    imageViewerStoreApi.setState({ viewerStatus: "loadingPage" });
    const onLoaderChange = vi.fn();

    render(<ImageViewerPanel compact={false} onLoaderChange={onLoaderChange} onReadyChange={onReadyChange} previewAction={previewAction} />);

    expect(screen.queryByRole("progressbar", { name: "image viewer progress" })).not.toBeInTheDocument();
    expect(document.querySelector("[data-document-lens-host='true']")).toBeInTheDocument();
    expect(onLoaderChange).toHaveBeenLastCalledWith(["Decoding document page..."]);
    expect(onReadyChange).toHaveBeenLastCalledWith(false);
  });

  it("reports lens progress during page navigation", () => {
    imageViewerStoreApi.setState({ viewerStatus: "loadingPage" });
    const onLoaderChange = vi.fn();

    render(<ImageViewerPanel compact={false} onLoaderChange={onLoaderChange} onReadyChange={onReadyChange} previewAction={previewAction} />);

    expect(screen.queryByRole("progressbar", { name: "image viewer progress" })).not.toBeInTheDocument();
    expect(onLoaderChange).toHaveBeenLastCalledWith(["Decoding document page..."]);
    expect(onReadyChange).toHaveBeenLastCalledWith(false);
  });

  it("reports lens progress while copying a selection", () => {
    imageViewerStoreApi.setState({ viewerStatus: "copyingSelection" });
    const onLoaderChange = vi.fn();

    render(<ImageViewerPanel compact={false} onLoaderChange={onLoaderChange} onReadyChange={onReadyChange} previewAction={previewAction} />);

    expect(screen.queryByRole("progressbar", { name: "image viewer progress" })).not.toBeInTheDocument();
    expect(onLoaderChange).toHaveBeenLastCalledWith(["Copying selection..."]);
    expect(onReadyChange).toHaveBeenLastCalledWith(false);
  });
});
