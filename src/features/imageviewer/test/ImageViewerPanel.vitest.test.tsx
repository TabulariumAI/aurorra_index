import { readFileSync } from "node:fs";
import path from "node:path";
import { render, screen, waitFor } from "@testing-library/react";
import type { ViewerState } from "@tabulariumai/aurora-lens";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { imageViewerStoreApi } from "../store/imageViewerStore";

let viewerPageCount = 2;
let viewerRestoring = false;
let viewerRestoredSession = false;

vi.mock("../hook/useImageViewer", () => ({
  useImageViewer: () => ({
    actualSize: vi.fn(),
    canActualSize: true,
    canClearSearch: true,
    canFitHeight: true,
    canFitPage: true,
    canFitWidth: true,
    canGoFirst: true,
    canGoLast: true,
    canGoNext: true,
    canGoPrevious: true,
    canSearch: true,
    canShowThumbnails: true,
    canZoomIn: true,
    canZoomOut: true,
    clearSearch: vi.fn(),
    firstPage: vi.fn(),
    fitHeight: vi.fn(),
    fitPage: vi.fn(),
    fitWidth: vi.fn(),
    isThumbs: false,
    lastPage: vi.fn(),
    lensHostRef: { current: null },
    nextPage: vi.fn(),
    page: 2,
    pageCount: viewerPageCount,
    previousPage: vi.fn(),
    search: vi.fn(),
    showThumbnails: vi.fn(),
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

describe("ImageViewerPanel", () => {
  beforeEach(() => {
    vi.spyOn(console, "info").mockImplementation(() => undefined);
  });

  afterEach(() => {
    imageViewerStoreApi.getState().resetViewer();
    viewerPageCount = 2;
    viewerRestoring = false;
    viewerRestoredSession = false;
    vi.restoreAllMocks();
  });

  it("shows package progress and completes package flow", async () => {
    const onError = vi.fn();
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

    render(<ImageViewerPanel previewAction={previewAction} />);

    expect(screen.getByRole("progressbar", { name: "image viewer progress" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Close preview" })).toBeInTheDocument();
    await waitFor(() => expect(imageViewerStoreApi.getState().status).toBe("ready"));
    expect(workerClient.packageImage).toHaveBeenCalledBefore(workerClient.imageStatus);
    expect(workerClient.imageData).toHaveBeenCalled();
    expect(workerClient.downloadPackage).toHaveBeenCalledWith("token", {
      jsonUrl: directPackage.data,
      tiffUrl: directPackage.tiff,
    });
    expect(console.info).toHaveBeenCalledWith("imageviewer package start", { session: "session-1" });
    expect(console.info).toHaveBeenCalledWith("imageviewer package requested", { session: "session-1" });
    expect(console.info).toHaveBeenCalledWith("imageviewer package status", { session: "session-1", status: "completed" });
    expect(console.info).toHaveBeenCalledWith("imageviewer package download", { session: "session-1" });
    expect(console.info).toHaveBeenCalledWith("imageviewer package downloaded", {
      metadataPages: 0,
      session: "session-1",
      tiffBytes: 4,
      tiffType: "image/tiff",
    });
    expect(onError).not.toHaveBeenCalled();
    expect(screen.queryByText(/add|remove|reorder|export|draw/i)).not.toBeInTheDocument();
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

    const view = render(<ImageViewerPanel previewAction={previewAction} />);

    await waitFor(() => expect(imageViewerStoreApi.getState().status).toBe("ready"));
    expect(workerClient.downloadPackage).toHaveBeenCalledTimes(1);
    view.unmount();
    render(<ImageViewerPanel previewAction={previewAction} />);

    await waitFor(() => expect(screen.queryByRole("progressbar", { name: "image viewer progress" })).not.toBeInTheDocument());
    expect(workerClient.packageImage).toHaveBeenCalledTimes(1);
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

    render(<ImageViewerPanel previewAction={previewAction} />);

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

    render(<ImageViewerPanel previewAction={previewAction} />);

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

    render(<ImageViewerPanel previewAction={previewAction} />);

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

    render(<ImageViewerPanel previewAction={previewAction} />);

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

    render(<ImageViewerPanel previewAction={previewAction} />);

    await waitFor(() => expect(onError).toHaveBeenCalledWith(expect.objectContaining({
      code: "invalid_image_package",
      error: "Image package JSON does not identify TIFF and JSON URLs.",
    })));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(workerClient.downloadPackage).not.toHaveBeenCalled();
  });

  it("shows lens progress before the first Aurora Lens page is available", () => {
    viewerPageCount = 0;
    imageViewerStoreApi.setState({ viewerStatus: "loadingPage" });

    render(<ImageViewerPanel previewAction={previewAction} />);

    expect(screen.getByRole("progressbar", { name: "image viewer progress" })).toBeInTheDocument();
    expect(screen.getByText("Decoding document page...")).toBeInTheDocument();
  });

  it("shows lens progress during page navigation", () => {
    imageViewerStoreApi.setState({ viewerStatus: "loadingPage" });

    render(<ImageViewerPanel previewAction={previewAction} />);

    expect(screen.getByRole("progressbar", { name: "image viewer progress" })).toBeInTheDocument();
  });
});
