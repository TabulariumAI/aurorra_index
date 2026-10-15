import { pageSize } from "../../../test/pageSize";
import { readFileSync } from "node:fs";
import path from "node:path";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { PageSizeFailure, ViewerState } from "@tabulariumai/aurora-lens";
import { afterEach, describe, expect, it, vi } from "vitest";
import { addIndexStoreApi } from "../../addindex/store/addIndexStore";
import { imageViewerStoreApi } from "../store/imageViewerStore";
import { storeApi } from "../../../store/state/store";
import { splitMetadataJSON } from "aurora-core";

let sizeFailure: PageSizeFailure | null = null;
const acceptSize = vi.hoisted(() => vi.fn());
const cancelSize = vi.hoisted(() => vi.fn());
let viewerPageCount = 2;
let viewerPage = 2;
let viewerReloadId = 0;
let viewerRestoring = false;
let viewerRestoredSession = false;
let viewerNavigating = false;
let viewerThumbs = false;
const exportSelection = vi.hoisted(() => vi.fn(async () => ({
  groups: [
    { value: { context: ["Selected context"], kind: ["BODY"], token: ["Selected value"] } },
  ],
  pageName: "Exhibit-A",
})));
const copySelection = vi.hoisted(() => vi.fn(async () => ({ copied: true, groups: [], text: "Selected value" })));
const select = vi.hoisted(() => vi.fn());
const setNoMatch = vi.hoisted(() => vi.fn());
let viewerNoMatch = false;
const showThumbnails = vi.hoisted(() => vi.fn());

vi.mock("../hook/useImageViewer", () => ({
  useImageViewer: () => ({
    noMatch: viewerNoMatch,
    setNoMatch,
    sizeFailure,
    acceptSize,
    cancelSize,
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
    copySelection,
    exportSelection,
    firstPage: vi.fn(),
    fitHeight: vi.fn(),
    fitPage: vi.fn(),
    fitWidth: vi.fn(),
    isThumbs: viewerThumbs,
    isNavigating: viewerNavigating,
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
import type { ToleranceRenderer } from "../type/imageViewer.types";

const directPackageRaw = readFileSync(path.join(process.cwd(), "src", "test", "package", "image-package.json"), "utf8");
const directPackage = JSON.parse(directPackageRaw) as { data: string; tiff: string };
const onReadyChange = vi.fn();

describe("ImageViewerPanel", () => {
  it("duplicates the Intake decision with a Scale options anchor and preview-only scope", () => {
    sizeFailure = { sourceName: "document-image-package.tiff", pageNumber: 1, width: 2550, height: 3479, tolerance: 0.02, requiredTolerance: 0.0348 };
    const renderer = vi.fn(({ children }: Parameters<ToleranceRenderer>[0]) => <div role="dialog">{children}</div>);
    render(<ImageViewerPanel compact={false} onReadyChange={onReadyChange} renderTolerance={renderer} />);
    expect(renderer.mock.calls.at(-1)?.[0].anchor).toBe(screen.getByRole("button", { name: "Scale options" }));
    expect(renderer.mock.calls.at(-1)?.[0].onClose).toBe(cancelSize);
    expect(screen.getByRole("dialog")).toHaveTextContent("document-image-package.tiff");
    expect(screen.getByRole("dialog")).toHaveTextContent("Page 1: 2550 × 3479 px");
    expect(screen.getByRole("dialog")).toHaveTextContent("2%");
    expect(screen.getByRole("dialog")).toHaveTextContent("3.48%");
    expect(screen.getByRole("dialog")).toHaveTextContent("only to this preview");
    fireEvent.click(screen.getByRole("button", { name: "Process anyway" }));
    expect(acceptSize).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(cancelSize).toHaveBeenCalledTimes(1);
  });

  it("keeps the size decision anchor visible when thumbnail decoding fails", () => {
    viewerThumbs = true;
    sizeFailure = { sourceName: "document-image-package.tiff", pageNumber: 3, width: 2550, height: 3479, tolerance: 0.02, requiredTolerance: 0.0348 };
    render(<ImageViewerPanel compact={false} onReadyChange={onReadyChange} renderTolerance={({ children }) => <div role="dialog">{children}</div>} />);
    expect(screen.getByRole("button", { name: "Scale options" })).toBeVisible();
    expect(screen.getByRole("dialog")).toHaveTextContent("Page 3");
  });

  afterEach(() => {
    cleanup();
    addIndexStoreApi.getState().close();
    storeApi.getState().resetJSON();
    imageViewerStoreApi.getState().resetViewer();
    sizeFailure = null;
    acceptSize.mockClear();
    cancelSize.mockClear();
    viewerPageCount = 2;
    viewerPage = 2;
    viewerReloadId = 0;
    viewerRestoring = false;
    viewerRestoredSession = false;
    viewerNavigating = false;
    viewerThumbs = false;
    viewerNoMatch = false;
    setNoMatch.mockClear();
    vi.restoreAllMocks();
    exportSelection.mockClear();
    copySelection.mockClear();
    select.mockClear();
    showThumbnails.mockClear();
    onReadyChange.mockClear();
  });

  it("uses the existing index-result status style for index text failures and clears on actions", () => {
    viewerNoMatch = true;
    render(<ImageViewerPanel compact={false} onReadyChange={onReadyChange} renderTolerance={({ children }) => children} />);
    const result = screen.getByRole("status", { name: "Index match result" });
    expect(result).toHaveTextContent("Cant match the requested text.");
    expect(result).toHaveStyle({ position: "absolute", pointerEvents: "none" });
    fireEvent.click(screen.getByRole("button", { name: "Clear selections" }));
    expect(setNoMatch).toHaveBeenCalledWith(null);
  });

  it("does not show a match result before Match is used", () => {
    render(<ImageViewerPanel renderTolerance={({ children }) => children} compact={false} onReadyChange={onReadyChange} />);
    expect(screen.queryByRole("status", { name: "Index match result" })).not.toBeInTheDocument();
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
      pageSize,
      apiGatewayUrl: "https://gateway",
      authToken: "token",
      onError,
      pageMap: new Map(),
      packagePollIntervalMs: 1,
      request: null,
      selectedIndex: null,
      session: "session-1",
      workerClient,
    });

    render(<ImageViewerPanel renderTolerance={({ children }) => children} compact={false} onLoaderChange={onLoaderChange} onReadyChange={onReadyChange} />);

    expect(screen.queryByRole("progressbar", { name: "image viewer progress" })).not.toBeInTheDocument();
    expect(onReadyChange).toHaveBeenCalledWith(false);
    await waitFor(() => expect(onLoaderChange).toHaveBeenCalledWith(["Generating the image package"]));
    expect(screen.getByRole("region", { name: "Image viewer" })).not.toHaveStyle({ border: "1px solid rgba(15, 23, 42, 0.18)" });
    expect(screen.getByRole("button", { name: /^Select$/ })).toBeEnabled();
    expect(screen.getByRole("button", { name: "More" })).toBeEnabled();
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
    const view = render(<ImageViewerPanel renderTolerance={({ children }) => children} compact onReadyChange={onReadyChange} />);

    expect(screen.getByLabelText("Image viewer footer toolbar")).toBeVisible();
    expect(showThumbnails).not.toHaveBeenCalled();

    view.rerender(<ImageViewerPanel renderTolerance={({ children }) => children} compact onReadyChange={onReadyChange} />);
    expect(showThumbnails).not.toHaveBeenCalled();

    viewerPage = 3;
    view.rerender(<ImageViewerPanel renderTolerance={({ children }) => children} compact onReadyChange={onReadyChange} />);
    expect(showThumbnails).not.toHaveBeenCalled();

    view.rerender(<ImageViewerPanel renderTolerance={({ children }) => children} compact={false} onReadyChange={onReadyChange} />);
    view.rerender(<ImageViewerPanel renderTolerance={({ children }) => children} compact onReadyChange={onReadyChange} />);
    expect(showThumbnails).not.toHaveBeenCalled();
  });

  it("opens Add Index with the exported selection", async () => {
    viewerRestoredSession = true;
    imageViewerStoreApi.getState().setHostInput({
      pageSize,
      apiGatewayUrl: "https://gateway",
      authToken: "token",
      onError: vi.fn(),
      pageMap: new Map(),
      request: null,
      selectedIndex: null,
      session: "session-1",
    });

    render(<ImageViewerPanel renderTolerance={({ children }) => children} compact={false} onReadyChange={onReadyChange} />);

    fireEvent.click(screen.getByRole("button", { name: /^Select$/ }));
    fireEvent.click(screen.getByRole("button", { name: "More" }));
    fireEvent.click(screen.getByRole("button", { name: "Export" }));

    expect(select).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(exportSelection).toHaveBeenCalledTimes(1));
    expect(addIndexStoreApi.getState().request).toEqual({
      groups: [
        { value: { context: ["Selected context"], kind: ["BODY"], token: ["Selected value"] } },
      ],
      pageName: "Exhibit-A",
    });
  });

  it("copies selected value without opening Add Index", async () => {
    render(<ImageViewerPanel renderTolerance={({ children }) => children} compact={false} onReadyChange={onReadyChange} />);
    fireEvent.click(screen.getByRole("button", { name: "More" }));
    fireEvent.click(screen.getByRole("button", { name: "Copy" }));

    await waitFor(() => expect(copySelection).toHaveBeenCalledTimes(1));
    expect(exportSelection).not.toHaveBeenCalled();
    expect(addIndexStoreApi.getState().request).toBeNull();
  });

  it("matches selected text against cached metadata and focuses the winning index", async () => {
    const onIndexFocus = vi.fn();
    storeApi.getState().setJSON("session-1", splitMetadataJSON({ indexes: [
      { code: "other", segment: "party", page: "5", value: "Selected value", source: "Selected context" },
      { code: "winner", segment: "party", page: "Exhibit-A", value: "Selected value", source: "Selected context" },
    ] }));
    imageViewerStoreApi.getState().setHostInput({
      pageSize,
      apiGatewayUrl: "https://gateway", authToken: "token", onError: vi.fn(),
      pageMap: new Map(), request: null, selectedIndex: null, session: "session-1",
    });
    render(<ImageViewerPanel renderTolerance={({ children }) => children} compact={false} onIndexFocus={onIndexFocus} onReadyChange={onReadyChange} />);

    fireEvent.click(screen.getByRole("button", { name: "More" }));
    fireEvent.click(screen.getByRole("button", { name: "Match" }));

    await waitFor(() => expect(onIndexFocus).toHaveBeenCalledWith({ code: "winner", segment: "party" }));
    expect(addIndexStoreApi.getState().request).toBeNull();
  });

  it("shows a clear status when selected text has no matching index and clears it on a new match", async () => {
    viewerRestoredSession = true;
    storeApi.getState().setJSON("session-1", splitMetadataJSON({ indexes: [
      { code: "other", segment: "party", value: "Unrelated words", source: "Different context" },
    ] }));
    imageViewerStoreApi.getState().setHostInput({
      pageSize,
      apiGatewayUrl: "https://gateway", authToken: "token", onError: vi.fn(),
      pageMap: new Map(), request: null, selectedIndex: null, session: "session-1",
    });
    const onIndexFocus = vi.fn();
    render(<ImageViewerPanel renderTolerance={({ children }) => children} compact={false} onIndexFocus={onIndexFocus} onReadyChange={onReadyChange} />);

    fireEvent.click(screen.getByRole("button", { name: "More" }));
    fireEvent.click(screen.getByRole("button", { name: "Match" }));
    expect(await screen.findByRole("status", { name: "Index match result" })).toHaveTextContent("No matching index found");
    expect(onIndexFocus).not.toHaveBeenCalled();

    storeApi.getState().setJSON("session-1", splitMetadataJSON({ indexes: [
      { code: "winner", segment: "party", value: "Selected value", source: "Selected context" },
    ] }));
    fireEvent.click(screen.getByRole("button", { name: "More" }));
    fireEvent.click(screen.getByRole("button", { name: "Match" }));
    await waitFor(() => expect(onIndexFocus).toHaveBeenCalledWith({ code: "winner", segment: "party" }));
    expect(screen.queryByRole("status", { name: "Index match result" })).not.toBeInTheDocument();
  });

  it.each([false, true])("discards an old Match failure after a new index request, pending=%s", async pending => {
    viewerRestoredSession = true;
    imageViewerStoreApi.getState().setHostInput({
      pageSize, apiGatewayUrl: "https://gateway", authToken: "token", onError: vi.fn(),
      pageMap: new Map(), request: null, selectedIndex: null, session: "session-1",
    });
    let finish!: (selection: Awaited<ReturnType<typeof exportSelection>>) => void;
    if (pending) exportSelection.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
    render(<ImageViewerPanel renderTolerance={({ children }) => children} compact={false} onReadyChange={onReadyChange} />);
    fireEvent.click(screen.getByRole("button", { name: "More" }));
    fireEvent.click(screen.getByRole("button", { name: "Match" }));
    if (!pending) await screen.findByRole("status", { name: "Index match result" });
    act(() => imageViewerStoreApi.getState().setRequest({
      session: "session-1", page: 2, code: "name", index: "party", segment: "party",
      value: "Tyranie Cicek", quote: "", highlightOptions: { scroll: false },
      metadataIndex: { label: "Beneficiary", value: "CICEK TYRANIE", source: "unmatched", ambiguous: "NO" },
    }));
    if (pending) await act(async () => finish({ groups: [{ value: { context: ["Selected context"], kind: ["BODY"], token: ["Selected value"] } }], pageName: "Exhibit-A" }));
    expect(screen.queryByRole("status", { name: "Index match result" })).not.toBeInTheDocument();
  });

  it("shows the no-match result when cached metadata is unavailable", async () => {
    viewerRestoredSession = true;
    imageViewerStoreApi.getState().setHostInput({
      pageSize,
      apiGatewayUrl: "https://gateway", authToken: "token", onError: vi.fn(),
      pageMap: new Map(), request: null, selectedIndex: null, session: "session-1",
    });
    render(<ImageViewerPanel renderTolerance={({ children }) => children} compact={false} onReadyChange={onReadyChange} />);

    fireEvent.click(screen.getByRole("button", { name: "More" }));
    fireEvent.click(screen.getByRole("button", { name: "Match" }));
    expect(await screen.findByRole("status", { name: "Index match result" })).toHaveTextContent("No matching index found");
    act(() => imageViewerStoreApi.getState().setHostInput({
      pageSize,
      apiGatewayUrl: "https://gateway", authToken: "token", onError: vi.fn(),
      pageMap: new Map(), request: null, selectedIndex: null, session: "session-2",
    }));
    expect(screen.queryByRole("status", { name: "Index match result" })).not.toBeInTheDocument();
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
      pageSize,
      apiGatewayUrl: "https://gateway",
      authToken: "token",
      onError: vi.fn(),
      pageMap: new Map(),
      packagePollIntervalMs: 1,
      request: null,
      selectedIndex: null,
      session: "session-1",
      workerClient,
    });

    const view = render(<ImageViewerPanel renderTolerance={({ children }) => children} compact={false} onReadyChange={onReadyChange} />);

    await waitFor(() => expect(imageViewerStoreApi.getState().status).toBe("ready"));
    expect(workerClient.downloadPackage).toHaveBeenCalledTimes(1);
    view.unmount();
    render(<ImageViewerPanel renderTolerance={({ children }) => children} compact={false} onReadyChange={onReadyChange} />);

    await waitFor(() => expect(screen.queryByRole("progressbar", { name: "image viewer progress" })).not.toBeInTheDocument());
    expect(workerClient.packageImage).toHaveBeenCalledTimes(1);
    expect(workerClient.imageData).toHaveBeenCalledTimes(1);
    expect(workerClient.downloadPackage).toHaveBeenCalledTimes(1);
  });

  it("re-downloads a cached package when Lens requests a reload", async () => {
    viewerReloadId = 1;
    const consoleInfo = vi.spyOn(console, "info").mockImplementation(() => undefined);
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
      pageSize,
      apiGatewayUrl: "https://gateway",
      authToken: "token",
      onError: vi.fn(),
      pageMap: new Map(),
      packagePollIntervalMs: 1,
      request: null,
      selectedIndex: null,
      session: "session-1",
      workerClient,
    });
    imageViewerStoreApi.getState().setLocalPackage({ packageMetadata: { pages: [] }, tiffBytes: new ArrayBuffer(4), tiffType: "image/tiff" });

    render(<ImageViewerPanel renderTolerance={({ children }) => children} compact={false} onReadyChange={onReadyChange} />);

    await waitFor(() => expect(workerClient.packageImage).toHaveBeenCalledTimes(1));
    expect(workerClient.imageData).toHaveBeenCalledTimes(1);
    expect(workerClient.downloadPackage).toHaveBeenCalledTimes(1);
    expect(consoleInfo).toHaveBeenCalledWith("imageviewer package load start", {
      hasPackage: true,
      page: null,
      reason: "lens_page_metadata_missing",
      reloadId: 1,
      requestVersion: 0,
      session: "session-1",
      status: "ready",
    });
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
      pageSize,
      apiGatewayUrl: "https://gateway",
      authToken: "token",
      onError: vi.fn(),
      pageMap: new Map(),
      packagePollIntervalMs: 1,
      request: null,
      selectedIndex: null,
      session: "session-1",
      workerClient,
    });

    render(<ImageViewerPanel renderTolerance={({ children }) => children} compact={false} onReadyChange={onReadyChange} />);

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
      pageSize,
      apiGatewayUrl: "https://gateway",
      authToken: "token",
      onError: vi.fn(),
      pageMap: new Map(),
      packagePollIntervalMs: 1,
      request: null,
      selectedIndex: null,
      session: "session-1",
      workerClient,
    });

    render(<ImageViewerPanel renderTolerance={({ children }) => children} compact={false} onReadyChange={onReadyChange} />);

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
      pageSize,
      apiGatewayUrl: "https://gateway",
      authToken: "token",
      onError: vi.fn(),
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

    render(<ImageViewerPanel renderTolerance={({ children }) => children} compact={false} onReadyChange={onReadyChange} />);

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
      pageSize,
      apiGatewayUrl: "https://gateway",
      authToken: "token",
      onError: vi.fn(),
      pageMap: new Map(),
      packagePollIntervalMs: 1,
      request: null,
      selectedIndex: null,
      session: "session-1",
      workerClient,
    });
    imageViewerStoreApi.getState().setStatus("ready");

    render(<ImageViewerPanel renderTolerance={({ children }) => children} compact={false} onReadyChange={onReadyChange} />);

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
      pageSize,
      apiGatewayUrl: "https://gateway",
      authToken: "token",
      onError,
      pageMap: new Map(),
      packagePollIntervalMs: 1,
      request: null,
      selectedIndex: null,
      session: "session-1",
      workerClient,
    });

    render(<ImageViewerPanel renderTolerance={({ children }) => children} compact={false} onReadyChange={onReadyChange} />);

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

    render(<ImageViewerPanel renderTolerance={({ children }) => children} compact={false} onLoaderChange={onLoaderChange} onReadyChange={onReadyChange} />);

    expect(screen.queryByRole("progressbar", { name: "image viewer progress" })).not.toBeInTheDocument();
    expect(document.querySelector("[data-document-lens-host='true']")).toBeInTheDocument();
    expect(onLoaderChange).toHaveBeenLastCalledWith(["Decoding document page..."]);
    expect(onReadyChange).toHaveBeenLastCalledWith(false);
  });

  it.each([false, true])("keeps both toolbars mounted during navigation (compact=%s)", (compact) => {
    viewerPageCount = 4;
    imageViewerStoreApi.getState().setReady();
    const onLoaderChange = vi.fn();
    const view = render(<ImageViewerPanel renderTolerance={({ children }) => children} compact={compact} onLoaderChange={onLoaderChange} onReadyChange={onReadyChange} />);
    const top = screen.getByLabelText("Image viewer top toolbar");
    const footer = screen.getByLabelText("Image viewer footer toolbar");
    for (const page of [3, 2]) {
      viewerNavigating = true;
      act(() => imageViewerStoreApi.getState().setViewerStatus("loadingPage"));
      expect(screen.getByLabelText("Image viewer top toolbar")).toBe(top);
      expect(screen.getByLabelText("Image viewer footer toolbar")).toBe(footer);
      expect(onReadyChange).toHaveBeenLastCalledWith(true);
      expect(onLoaderChange).toHaveBeenLastCalledWith(null);
      viewerPage = page;
      viewerNavigating = false;
      act(() => imageViewerStoreApi.getState().setViewerStatus("ready"));
      view.rerender(<ImageViewerPanel renderTolerance={({ children }) => children} compact={compact} onLoaderChange={onLoaderChange} onReadyChange={onReadyChange} />);
      expect(screen.getByText(`Page ${page} of 4`)).toBeVisible();
      expect(screen.getByLabelText("Image viewer footer toolbar")).toBe(footer);
    }
  });

  it.each([false, true])("preserves thumbnail toolbar visibility (compact=%s)", (compact) => {
    viewerThumbs = true;
    render(<ImageViewerPanel renderTolerance={({ children }) => children} compact={compact} onReadyChange={onReadyChange} />);
    expect(screen.queryByLabelText("Image viewer footer toolbar")).not.toBeInTheDocument();
    expect(Boolean(screen.queryByLabelText("Image viewer top toolbar"))).toBe(compact);
  });

  it("keeps adding pages blocking after a page has loaded", () => {
    imageViewerStoreApi.setState({ status: "ready", viewerStatus: "addingPages" });
    render(<ImageViewerPanel renderTolerance={({ children }) => children} compact={false} onReadyChange={onReadyChange} />);
    expect(onReadyChange).toHaveBeenLastCalledWith(false);
    expect(screen.queryByLabelText("Image viewer footer toolbar")).not.toBeInTheDocument();
  });

  it.each([false, true])("keeps copying nonblocking throughout the status transition (compact=%s)", (compact) => {
    imageViewerStoreApi.setState({ status: "ready", viewerStatus: "ready" });
    const onLoaderChange = vi.fn();

    render(<ImageViewerPanel renderTolerance={({ children }) => children} compact={compact} onLoaderChange={onLoaderChange} onReadyChange={onReadyChange} />);
    const top = screen.getByLabelText("Image viewer top toolbar");
    const footer = screen.getByLabelText("Image viewer footer toolbar");
    const host = document.querySelector("[data-document-lens-host='true']");
    for (const status of ["copyingSelection", "ready"] as const) {
      act(() => imageViewerStoreApi.getState().setViewerStatus(status));
      expect(onReadyChange).toHaveBeenLastCalledWith(true);
      expect(onLoaderChange).toHaveBeenLastCalledWith(null);
      expect(screen.getByLabelText("Image viewer top toolbar")).toBe(top);
      expect(screen.getByLabelText("Image viewer footer toolbar")).toBe(footer);
      expect(document.querySelector("[data-document-lens-host='true']")).toBe(host);
    }
  });
});
