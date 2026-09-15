import { readFileSync } from "node:fs";
import path from "node:path";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { imageViewerStoreApi } from "../store/imageViewerStore";
import type { LensApi } from "../type/imageViewer.types";

const packageRoot = path.join(process.cwd(), "src", "test", "package");
const packageMetadata = JSON.parse(readFileSync(path.join(packageRoot, "image.json"), "utf8")) as { pages: unknown[] };
const tiffBytes = readFileSync(path.join(packageRoot, "image.tiff"));

const configurePdfWorker = vi.hoisted(() => vi.fn());
const indexedDbViewerSessionStore = vi.hoisted(() => vi.fn());
const lensInstances = vi.hoisted(() => [] as LensApi[]);
const restoreSessionResult = vi.hoisted(() => ({ value: false }));
const restoreSessionWait = vi.hoisted(() => ({ promise: null as Promise<void> | null }));
const exportSelectionError = vi.hoisted(() => ({ value: null as Error | null }));
const copyWait = vi.hoisted(() => ({ promise: null as Promise<void> | null }));
const viewerCanExport = vi.hoisted(() => ({ value: true }));
const viewerHasMetadata = vi.hoisted(() => ({ value: true }));
const viewerCanSelect = vi.hoisted(() => ({ value: true }));
const viewerCanSearch = vi.hoisted(() => ({ value: true }));
const decodeDocError = vi.hoisted(() => ({ value: null as Error | null }));
const decodeWait = vi.hoisted(() => ({ promise: null as Promise<void> | null }));
const auroraLensCtor = vi.hoisted(() =>
  vi.fn(function AuroraLensMock(
    this: unknown,
    _host: HTMLElement,
    options: { onStateChange?: (state: unknown) => void; onStatusChange?: (status: string) => void },
  ) {
    const emitState = (status: "idle" | "loadingPage" | "ready") => {
      options.onStatusChange?.(status);
      options.onStateChange?.({
        canActualSize: status === "ready",
        canClearSelection: status === "ready",
        canCopy: status === "ready" && viewerCanExport.value,
        canDraw: status === "ready" && viewerCanSelect.value,
        canFitHeight: status === "ready",
        canFitPage: status === "ready",
        canFitWidth: status === "ready",
        canGoFirst: status === "ready",
        canGoLast: status === "ready",
        canGoNext: status === "ready",
        canGoPrevious: status === "ready",
        canSearch: status === "ready" && viewerCanSearch.value && viewerHasMetadata.value,
        canShowThumbnails: status === "ready",
        canZoomIn: status === "ready",
        canZoomOut: status === "ready",
        pageCount: status === "ready" ? 4 : 0,
        pageIndex: status === "ready" ? 1 : -1,
        pageInfo: status === "ready" && viewerHasMetadata.value ? { class: "Deed", indexes: [], pageNumber: 2, segments: [] } : null,
        drawMode: false,
        status,
        viewMode: "page",
        zoom: status === "ready" ? 1.25 : 0,
      });
    };
    const lens = {
      actualSize: vi.fn(),
      clear: vi.fn(),
      clearSelection: vi.fn(),
      close: vi.fn(),
      copySelection: vi.fn(async () => {
        const ready = imageViewerStoreApi.getState().viewerState!;
        options.onStatusChange?.("copyingSelection");
        options.onStateChange?.({ ...ready, status: "copyingSelection", canCopy: false });
        await copyWait.promise;
        if (exportSelectionError.value) throw exportSelectionError.value;
        options.onStatusChange?.("ready");
        options.onStateChange?.(ready);
        return { copied: true, groups: [{ value: { context: ["Mock paragraph"], kind: ["BODY"], token: ["Mock value"] } }], text: "" };
      }),
      decodeDoc: vi.fn(async () => {
        if (decodeDocError.value) throw decodeDocError.value;
        emitState("loadingPage");
        await decodeWait.promise;
        emitState("ready");
      }),
      firstPage: vi.fn(),
      fitHeight: vi.fn(),
      fitPage: vi.fn(),
      fitWidth: vi.fn(),
      goToPage: vi.fn(),
      lastPage: vi.fn(),
      loadMetadata: vi.fn(),
      nextPage: vi.fn(),
      previousPage: vi.fn(),
      readPageInfo: vi.fn(() => ({ class: "Deed", indexes: [], pageNumber: 3, segments: [] })),
      restoreSession: vi.fn(async () => {
        await restoreSessionWait.promise;
        if (restoreSessionResult.value) emitState("ready");
        return restoreSessionResult.value;
      }),
      search: vi.fn(),
      searchIndex: vi.fn(),
      setDrawMode: vi.fn(),
      showThumbnails: vi.fn(),
      zoomIn: vi.fn(),
      zoomOut: vi.fn(),
    };
    lensInstances.push(lens);
    emitState("idle");
    return lens;
  }),
);

vi.mock("@tabulariumai/aurora-lens", () => ({
  AuroraLens: auroraLensCtor,
  IndexedDbViewerSessionStore: indexedDbViewerSessionStore,
  configurePdfWorker,
}));

vi.mock("pdfjs-dist/build/pdf.worker.mjs?url", () => ({
  default: "pdf-worker-url",
}));

import { useImageViewer } from "../hook/useImageViewer";
import { ImageViewerPanel } from "../component/ImageViewerPanel";
import { addIndexStoreApi } from "../../addindex/store/addIndexStore";

function Harness() {
  const viewer = useImageViewer();
  const [exportedPage, setExportedPage] = useState<number | null>(null);
  return (
    <>
      <div ref={viewer.lensHostRef} />
      <button disabled={!viewer.canActualSize} onClick={viewer.actualSize} type="button">actual size</button>
      <button disabled={!viewer.canClearSearch} onClick={viewer.clearSearch} type="button">clear search</button>
      <button disabled={!viewer.canSelect} onClick={viewer.select} type="button">select</button>
      <button
        disabled={!viewer.canExport}
        onClick={() => void viewer.exportSelection().then((selection) => setExportedPage(selection?.pageNumber ?? null))}
        type="button"
      >
        export
      </button>
      <button disabled={!viewer.canGoFirst} onClick={viewer.firstPage} type="button">first page</button>
      <button disabled={!viewer.canFitHeight} onClick={viewer.fitHeight} type="button">fit height</button>
      <button disabled={!viewer.canFitPage} onClick={viewer.fitPage} type="button">fit page</button>
      <button disabled={!viewer.canFitWidth} onClick={viewer.fitWidth} type="button">fit width</button>
      <button disabled={!viewer.canGoLast} onClick={viewer.lastPage} type="button">last page</button>
      <button disabled={!viewer.canGoNext} onClick={viewer.nextPage} type="button">next page</button>
      <button disabled={!viewer.canGoPrevious} onClick={viewer.previousPage} type="button">previous page</button>
      <button disabled={!viewer.canSearch} onClick={viewer.search} type="button">search</button>
      <button disabled={!viewer.canZoomIn} onClick={viewer.zoomIn} type="button">zoom in</button>
      <button disabled={!viewer.canZoomOut} onClick={viewer.zoomOut} type="button">zoom out</button>
      <span data-testid="restored-session">{viewer.isRestoredSession ? "restored" : "not-restored"}</span>
      <span data-testid="restore-state">{viewer.isRestoring ? "restoring" : "ready"}</span>
      <span data-testid="navigating">{String(viewer.isNavigating)}</span>
      <span data-testid="exported-page">{exportedPage}</span>
      <span data-testid="reload-id">{viewer.reloadId}</span>
      <span data-testid="zoom">{viewer.zoom}</span>
    </>
  );
}

function setRequest() {
  imageViewerStoreApi.getState().setRequest({
    code: "idx-1",
    highlightOptions: { scroll: false },
    index: "party",
    metadataIndex: {
      ambiguous: "NO",
      label: "Party",
      source: "quote",
      value: "Alice",
    },
    page: 2,
    quote: "quote",
    segment: "party",
    session: "session-1",
    value: "Alice",
  });
}

function setHost(onError = vi.fn()) {
  imageViewerStoreApi.getState().setHostInput({
    apiGatewayUrl: "https://gateway",
    authToken: "token",
    onError,
    pageCount: 2,
    pageMap: new Map(),
    request: null,
    selectedIndex: null,
    session: "session-1",
  });
}

function setPackage(metadata: { pages: unknown[] } = { pages: [] }, bytes: ArrayBuffer = new TextEncoder().encode("tiff").buffer) {
  imageViewerStoreApi.getState().setLocalPackage({
    packageMetadata: metadata,
    tiffBytes: bytes,
    tiffType: "image/tiff",
  });
}

function seedPackage(metadata: { pages: unknown[] } = { pages: [] }, bytes: ArrayBuffer = new TextEncoder().encode("tiff").buffer) {
  setHost();
  setRequest();
  setPackage(metadata, bytes);
}

describe("useImageViewer", () => {
  beforeEach(() => {
    vi.spyOn(console, "info").mockImplementation(() => undefined);
  });

  afterEach(() => {
    imageViewerStoreApi.getState().resetViewer();
    lensInstances.length = 0;
    exportSelectionError.value = null;
    copyWait.promise = null;
    addIndexStoreApi.getState().close();
    decodeDocError.value = null;
    decodeWait.promise = null;
    restoreSessionWait.promise = null;
    restoreSessionResult.value = false;
    viewerCanExport.value = true;
    viewerHasMetadata.value = true;
    viewerCanSelect.value = true;
    viewerCanSearch.value = true;
    vi.unstubAllGlobals();
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it("does not treat initial decoding as navigation", async () => {
    let finish!: () => void;
    decodeWait.promise = new Promise<void>((resolve) => { finish = resolve; });
    seedPackage();
    render(<Harness />);
    await waitFor(() => expect(lensInstances[0]?.decodeDoc).toHaveBeenCalled());
    expect(imageViewerStoreApi.getState().viewerStatus).toBe("loadingPage");
    expect(screen.getByTestId("navigating")).toHaveTextContent("false");
    expect(screen.getByRole("button", { name: "next page" })).toBeDisabled();
    await act(async () => finish());
    await waitFor(() => expect(screen.getByRole("button", { name: "next page" })).toBeEnabled());
    expect(screen.getByTestId("navigating")).toHaveTextContent("false");
  });

  it.each([false, true])("identifies navigation and blocks actions after decode or restore (restored=%s)", async (restored) => {
    restoreSessionResult.value = restored;
    if (restored) setHost();
    else seedPackage();
    render(<Harness />);
    await waitFor(() => expect(screen.getByRole("button", { name: "next page" })).toBeEnabled());
    const ready = imageViewerStoreApi.getState().viewerState!;
    for (const name of ["next page", "previous page"]) {
      fireEvent.click(screen.getByRole("button", { name }));
      act(() => imageViewerStoreApi.getState().setViewerStatus("loadingPage"));
      expect(screen.getByTestId("navigating")).toHaveTextContent("true");
      act(() => imageViewerStoreApi.getState().setViewerState({ ...ready, status: "loadingPage" }));
      for (const action of ["next page", "previous page", "first page", "last page", "zoom in", "zoom out", "select", "export"]) {
        expect(screen.getByRole("button", { name: action })).toBeDisabled();
      }
      act(() => imageViewerStoreApi.getState().setViewerStatus("ready"));
      expect(screen.getByTestId("navigating")).toHaveTextContent("true");
      act(() => imageViewerStoreApi.getState().setViewerState(ready));
      expect(screen.getByTestId("navigating")).toHaveTextContent("false");
      expect(screen.getByRole("button", { name })).toBeEnabled();
    }
    expect(lensInstances[0].nextPage).toHaveBeenCalledTimes(1);
    expect(lensInstances[0].previousPage).toHaveBeenCalledTimes(1);
    for (const status of ["copyingSelection", "addingPages", "error"] as const) {
      act(() => imageViewerStoreApi.getState().setViewerStatus(status));
      expect(screen.getByTestId("navigating")).toHaveTextContent("false");
    }
    act(() => imageViewerStoreApi.getState().setHostInput({
      apiGatewayUrl: "https://gateway", authToken: "token", onError: vi.fn(),
      pageCount: 2, pageMap: new Map(), request: null, selectedIndex: null, session: "session-2",
    }));
    expect(screen.getByTestId("navigating")).toHaveTextContent("false");
  });

  it.each([
    { restored: false, compact: false }, { restored: false, compact: true },
    { restored: true, compact: false }, { restored: true, compact: true },
  ])("exports without hiding or reloading the panel (restored=$restored, compact=$compact)", async ({ restored, compact }) => {
    restoreSessionResult.value = restored;
    if (restored) setHost();
    else seedPackage();
    let finish!: () => void;
    copyWait.promise = new Promise<void>((resolve) => { finish = resolve; });
    const onReadyChange = vi.fn();
    const onLoaderChange = vi.fn();
    render(<ImageViewerPanel compact={compact} onReadyChange={onReadyChange} onLoaderChange={onLoaderChange} />);
    const button = screen.getByRole("button", { name: "Export" });
    await waitFor(() => expect(button).toBeEnabled());
    const top = screen.getByLabelText("Image viewer top toolbar");
    const footer = screen.getByLabelText("Image viewer footer toolbar");
    const host = document.querySelector("[data-document-lens-host='true']");
    const decodeCount = vi.mocked(lensInstances[0].decodeDoc).mock.calls.length;
    onReadyChange.mockClear();
    onLoaderChange.mockClear();
    fireEvent.click(button);
    await waitFor(() => expect(button).toBeDisabled());
    expect(imageViewerStoreApi.getState().viewerStatus).toBe("copyingSelection");
    expect(onReadyChange).not.toHaveBeenCalledWith(false);
    expect(onLoaderChange.mock.calls.every(([lines]) => lines === null)).toBe(true);
    expect(screen.getByLabelText("Image viewer footer toolbar")).toBe(footer);
    expect(addIndexStoreApi.getState().request).toBeNull();
    fireEvent.click(button);
    expect(lensInstances[0].copySelection).toHaveBeenCalledTimes(1);
    await act(async () => finish());
    expect(button).toBeEnabled();
    expect(screen.getByLabelText("Image viewer top toolbar")).toBe(top);
    expect(screen.getByLabelText("Image viewer footer toolbar")).toBe(footer);
    expect(document.querySelector("[data-document-lens-host='true']")).toBe(host);
    expect(onReadyChange).not.toHaveBeenCalledWith(false);
    expect(lensInstances[0].decodeDoc).toHaveBeenCalledTimes(decodeCount);
    expect(lensInstances[0].close).not.toHaveBeenCalled();
    expect(auroraLensCtor).toHaveBeenCalledTimes(1);
    expect(addIndexStoreApi.getState().request).toEqual({
      groups: [{ value: { context: ["Mock paragraph"], kind: ["BODY"], token: ["Mock value"] } }],
      pageNumber: 3,
    });
  });

  it("reports export failure without opening Add Index or decoding again", async () => {
    seedPackage();
    const onError = vi.fn();
    imageViewerStoreApi.setState({ onError });
    exportSelectionError.value = new Error("export failed");
    const onReadyChange = vi.fn();
    render(<ImageViewerPanel compact={false} onReadyChange={onReadyChange} />);
    const button = screen.getByRole("button", { name: "Export" });
    await waitFor(() => expect(button).toBeEnabled());
    fireEvent.click(button);
    await waitFor(() => expect(onError).toHaveBeenCalledWith({ error: "export failed" }));
    expect(addIndexStoreApi.getState().request).toBeNull();
    expect(imageViewerStoreApi.getState().status).toBe("error");
    expect(onReadyChange).toHaveBeenLastCalledWith(false);
    expect(lensInstances[0].decodeDoc).toHaveBeenCalledTimes(1);
  });

  it("creates read-only lens and decodes completed TIFF package", async () => {
    seedPackage();
    await act(async () => {
      render(<Harness />);
    });
    await waitFor(() => expect(auroraLensCtor).toHaveBeenCalled());

    await waitFor(() => expect(lensInstances[0].decodeDoc).toHaveBeenCalled());
    const file = vi.mocked(lensInstances[0].decodeDoc).mock.calls[0][0];
    expect(configurePdfWorker).toHaveBeenCalledWith("pdf-worker-url");
    expect(indexedDbViewerSessionStore).toHaveBeenCalledTimes(1);
    expect(auroraLensCtor).toHaveBeenCalledWith(expect.any(HTMLElement), expect.objectContaining({
      allowEdit: false,
      selectionTheme: {
        intelligence: {
          fill: "rgba(0, 128, 128, 0.12)",
          stroke: "#008080",
        },
      },
    }));
    expect(file).toBeInstanceOf(File);
    expect(file.type).toBe("image/tiff");
    expect(lensInstances[0].loadMetadata).toHaveBeenCalledTimes(1);
    expect(lensInstances[0].loadMetadata).toHaveBeenCalledWith({ pages: [] });
    expect(lensInstances[0].decodeDoc).toHaveBeenCalledWith(file, { page: 1, viewMode: "page" });
    expect(lensInstances[0].goToPage).not.toHaveBeenCalled();
    expect(lensInstances[0].restoreSession).toHaveBeenCalledTimes(1);
    expect(lensInstances[0].searchIndex).toHaveBeenCalledWith(2, {
      ambiguous: "NO",
      label: "Party",
      source: "quote",
      value: "Alice",
    }, { additive: false });
    expect(console.info).toHaveBeenCalledWith("imageviewer lens create", { session: "session-1" });
    expect(console.info).toHaveBeenCalledWith("imageviewer lens restore start", { session: "session-1" });
    expect(console.info).toHaveBeenCalledWith("imageviewer lens metadata load", {
      metadataPages: 0,
      packageVersion: 1,
      session: "session-1",
    });
    expect(console.info).toHaveBeenCalledWith("imageviewer lens decode start", {
      page: 2,
      packageVersion: 1,
      previousDecodedPackageVersion: 0,
      previousDecodedSession: null,
      session: "session-1",
      tiffBytes: 4,
      tiffType: "image/tiff",
    });
    expect(console.info).toHaveBeenCalledWith("imageviewer lens ready", {
      page: 2,
      packageVersion: 1,
      session: "session-1",
    });
  });

  it("creates lens and restores stored session without package inputs", async () => {
    setHost();
    restoreSessionResult.value = true;
    await act(async () => {
      render(<Harness />);
    });

    await waitFor(() => expect(lensInstances[0].restoreSession).toHaveBeenCalledTimes(1));
    expect(indexedDbViewerSessionStore).toHaveBeenCalledTimes(1);
    expect(lensInstances[0].decodeDoc).not.toHaveBeenCalled();
    expect(lensInstances[0].loadMetadata).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.getByRole("button", { name: "search" })).toBeEnabled());
    expect(screen.getByTestId("restored-session")).toHaveTextContent("restored");
    expect(imageViewerStoreApi.getState().status).toBe("ready");
  });

  it("keeps restore pending until stored session restore completes", async () => {
    let resolveRestore!: () => void;
    restoreSessionWait.promise = new Promise<void>((resolve) => {
      resolveRestore = resolve;
    });
    setHost();
    await act(async () => {
      render(<Harness />);
    });

    await waitFor(() => expect(lensInstances[0].restoreSession).toHaveBeenCalledTimes(1));
    expect(screen.getByTestId("restore-state")).toHaveTextContent("restoring");

    await act(async () => {
      resolveRestore();
      await restoreSessionWait.promise;
    });

    await waitFor(() => expect(screen.getByTestId("restore-state")).toHaveTextContent("ready"));
  });

  it("decodes the real package TIFF bytes with parsed package metadata", async () => {
    const tiffBuffer = tiffBytes.buffer.slice(tiffBytes.byteOffset, tiffBytes.byteOffset + tiffBytes.byteLength) as ArrayBuffer;
    seedPackage(packageMetadata, tiffBuffer);
    await act(async () => {
      render(<Harness />);
    });
    await waitFor(() => expect(auroraLensCtor).toHaveBeenCalled());

    await waitFor(() => expect(lensInstances[0].decodeDoc).toHaveBeenCalled());
    const file = vi.mocked(lensInstances[0].decodeDoc).mock.calls[0][0];
    expect(file).toBeInstanceOf(File);
    expect(file.size).toBe(tiffBytes.length);
    expect(file.type).toBe("image/tiff");
    expect(lensInstances[0].loadMetadata).toHaveBeenCalledWith(packageMetadata);
    expect(packageMetadata.pages.length).toBeGreaterThan(0);
  });

  it("reports package decode errors", async () => {
    const onError = vi.fn();
    decodeDocError.value = new Error("decode failed");
    setHost(onError);
    setRequest();
    setPackage();
    await act(async () => {
      render(<Harness />);
    });

    await waitFor(() => expect(onError).toHaveBeenCalledWith({
      error: "decode failed",
    }));
    expect(imageViewerStoreApi.getState().status).toBe("error");
  });

  it("reloads the existing Lens after View Index opens a page without metadata", async () => {
    const onError = vi.fn();
    viewerHasMetadata.value = false;
    setHost(onError);
    setRequest();
    setPackage();
    await act(async () => {
      render(<Harness />);
    });

    await waitFor(() => expect(screen.getByTestId("reload-id")).toHaveTextContent("1"));
    expect(console.info).toHaveBeenCalledWith("imageviewer lens package reload requested", {
      decodedVersion: 1,
      packageVersion: 1,
      page: 2,
      requestVersion: 1,
      session: "session-1",
      viewerPageIndex: 1,
    });
    expect(screen.getByRole("button", { name: "search" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "select" })).toBeDisabled();

    viewerHasMetadata.value = true;
    act(() => {
      setPackage();
    });

    await waitFor(() => expect(lensInstances[0].decodeDoc).toHaveBeenCalledTimes(2));
    expect(auroraLensCtor).toHaveBeenCalledTimes(1);
    expect(lensInstances[0].clear).toHaveBeenCalledTimes(2);
    await waitFor(() => expect(screen.getByRole("button", { name: "search" })).toBeEnabled());
    expect(screen.getByRole("button", { name: "select" })).toBeEnabled();
    expect(onError).not.toHaveBeenCalled();
  });

  it("reports metadata unavailable after the refreshed package is decoded", async () => {
    const onError = vi.fn();
    viewerHasMetadata.value = false;
    setHost(onError);
    setRequest();
    setPackage();
    await act(async () => {
      render(<Harness />);
    });

    await waitFor(() => expect(screen.getByTestId("reload-id")).toHaveTextContent("1"));
    act(() => {
      setPackage();
    });

    await waitFor(() => expect(onError).toHaveBeenCalledWith({
      code: "image_metadata_unavailable",
      error: "Image package metadata is unavailable for this page.",
    }));
    expect(auroraLensCtor).toHaveBeenCalledTimes(1);
    expect(lensInstances[0].decodeDoc).toHaveBeenCalledTimes(2);
    expect(imageViewerStoreApi.getState().status).toBe("error");
  });

  it("preserves same-session package bytes when lens unmounts", async () => {
    let view: ReturnType<typeof render> | null = null;
    seedPackage();
    await act(async () => {
      view = render(<Harness />);
    });
    await waitFor(() => expect(auroraLensCtor).toHaveBeenCalled());

    await waitFor(() => expect(lensInstances.at(-1)?.decodeDoc).toHaveBeenCalled());
    act(() => {
      view?.unmount();
    });

    expect(imageViewerStoreApi.getState()).toMatchObject({
      packageMetadata: { pages: [] },
      packageStatus: "completed",
      session: "session-1",
      status: "ready",
      tiffType: "image/tiff",
      viewerState: null,
      viewerStatus: "idle",
    });
    expect(imageViewerStoreApi.getState().tiffBytes?.byteLength).toBe(4);
  });

  it("decodes cached package on remount even when same-session restore succeeds", async () => {
    let view: ReturnType<typeof render> | null = null;
    seedPackage();
    await act(async () => {
      view = render(<Harness />);
    });
    await waitFor(() => expect(auroraLensCtor).toHaveBeenCalled());

    await waitFor(() => expect(lensInstances[0].decodeDoc).toHaveBeenCalledTimes(1));
    act(() => {
      view?.unmount();
    });
    restoreSessionResult.value = true;
    await act(async () => {
      render(<Harness />);
    });

    await waitFor(() => expect(lensInstances[1].restoreSession).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(lensInstances[1].decodeDoc).toHaveBeenCalledTimes(1));
    const file = vi.mocked(lensInstances[1].decodeDoc).mock.calls[0][0];
    expect(lensInstances[1].loadMetadata).toHaveBeenCalledTimes(1);
    expect(lensInstances[1].loadMetadata).toHaveBeenCalledWith({ pages: [] });
    expect(lensInstances[1].decodeDoc).toHaveBeenCalledWith(file, { page: 1, viewMode: "page" });
    expect(lensInstances[1].goToPage).not.toHaveBeenCalled();
    expect(lensInstances[1].searchIndex).toHaveBeenCalledWith(2, {
      ambiguous: "NO",
      label: "Party",
      source: "quote",
      value: "Alice",
    }, { additive: false });
  });

  it("decodes cached package once when restored lens cannot search", async () => {
    let view: ReturnType<typeof render> | null = null;
    seedPackage();
    await act(async () => {
      view = render(<Harness />);
    });
    await waitFor(() => expect(auroraLensCtor).toHaveBeenCalled());

    await waitFor(() => expect(lensInstances[0].decodeDoc).toHaveBeenCalledTimes(1));
    act(() => {
      view?.unmount();
    });
    restoreSessionResult.value = true;
    viewerCanSearch.value = false;
    await act(async () => {
      render(<Harness />);
    });

    await waitFor(() => expect(lensInstances[1].restoreSession).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(lensInstances[1].decodeDoc).toHaveBeenCalledTimes(1));
    const file = vi.mocked(lensInstances[1].decodeDoc).mock.calls[0][0];
    expect(lensInstances[1].loadMetadata).toHaveBeenCalledWith({ pages: [] });
    expect(lensInstances[1].decodeDoc).toHaveBeenCalledWith(file, { page: 1, viewMode: "page" });
    expect(lensInstances[1].searchIndex).toHaveBeenCalledWith(2, {
      ambiguous: "NO",
      label: "Party",
      source: "quote",
      value: "Alice",
    }, { additive: false });
  });

  it("decodes cached package when same-session restore is unavailable", async () => {
    let view: ReturnType<typeof render> | null = null;
    seedPackage();
    await act(async () => {
      view = render(<Harness />);
    });
    await waitFor(() => expect(auroraLensCtor).toHaveBeenCalled());

    await waitFor(() => expect(lensInstances[0].decodeDoc).toHaveBeenCalledTimes(1));
    act(() => {
      view?.unmount();
    });
    await act(async () => {
      render(<Harness />);
    });

    await waitFor(() => expect(lensInstances[1].restoreSession).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(lensInstances[1].decodeDoc).toHaveBeenCalledTimes(1));
    expect(lensInstances[1].decodeDoc).toHaveBeenCalledWith(expect.any(File), { page: 1, viewMode: "page" });
  });

  it("calls lens view controls when viewer state allows view actions", async () => {
    seedPackage();
    await act(async () => {
      render(<Harness />);
    });
    await waitFor(() => expect(auroraLensCtor).toHaveBeenCalled());

    await act(async () => {
      imageViewerStoreApi.getState().setSearchText("Alice");
    });

    await waitFor(() => expect(lensInstances[0].decodeDoc).toHaveBeenCalled());
    expect(screen.getByTestId("zoom")).toHaveTextContent("1.25");
    fireEvent.click(screen.getByRole("button", { name: "actual size" }));
    fireEvent.click(screen.getByRole("button", { name: "clear search" }));
    fireEvent.click(screen.getByRole("button", { name: "select" }));
    fireEvent.click(screen.getByRole("button", { name: "export" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "export" })).toBeEnabled());
    fireEvent.click(screen.getByRole("button", { name: "first page" }));
    fireEvent.click(screen.getByRole("button", { name: "fit height" }));
    fireEvent.click(screen.getByRole("button", { name: "fit page" }));
    fireEvent.click(screen.getByRole("button", { name: "fit width" }));
    fireEvent.click(screen.getByRole("button", { name: "last page" }));
    fireEvent.click(screen.getByRole("button", { name: "next page" }));
    fireEvent.click(screen.getByRole("button", { name: "previous page" }));
    fireEvent.click(screen.getByRole("button", { name: "zoom in" }));
    fireEvent.click(screen.getByRole("button", { name: "zoom out" }));

    expect(lensInstances[0].actualSize).toHaveBeenCalledTimes(1);
    expect(lensInstances[0].clearSelection).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(lensInstances[0].copySelection).toHaveBeenCalledTimes(1));
    expect(lensInstances[0].readPageInfo).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("exported-page")).toHaveTextContent("3");
    expect(lensInstances[0].setDrawMode).toHaveBeenCalledWith(true);
    expect(lensInstances[0].fitHeight).toHaveBeenCalledTimes(1);
    expect(lensInstances[0].fitPage).toHaveBeenCalledTimes(1);
    expect(lensInstances[0].fitWidth).toHaveBeenCalledTimes(1);
    expect(lensInstances[0].firstPage).toHaveBeenCalledTimes(1);
    expect(lensInstances[0].lastPage).toHaveBeenCalledTimes(1);
    expect(lensInstances[0].nextPage).toHaveBeenCalledTimes(1);
    expect(lensInstances[0].previousPage).toHaveBeenCalledTimes(1);
    expect(lensInstances[0].zoomIn).toHaveBeenCalledTimes(1);
    expect(lensInstances[0].zoomOut).toHaveBeenCalledTimes(1);
    expect(imageViewerStoreApi.getState().searchText).toBe("");
    expect(console.info).toHaveBeenCalledWith("imageviewer lens action", { action: "actualSize" });
    expect(console.info).toHaveBeenCalledWith("imageviewer lens action", { action: "clearSearch" });
    expect(console.info).toHaveBeenCalledWith("imageviewer lens action", { action: "exportSelection" });
    expect(console.info).toHaveBeenCalledWith("imageviewer lens action", { action: "select", enabled: true });
    expect(console.info).toHaveBeenCalledWith("imageviewer lens action", { action: "zoomIn" });
  });

  it("runs a requested fit page command after the selected image is ready", async () => {
    seedPackage();
    imageViewerStoreApi.getState().fitPage();
    await act(async () => {
      render(<Harness />);
    });

    await waitFor(() => expect(lensInstances[0].decodeDoc).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(lensInstances[0].fitPage).toHaveBeenCalledTimes(1));
  });

  it("reports selection export errors", async () => {
    const onError = vi.fn();
    exportSelectionError.value = new Error("export failed");
    setHost(onError);
    setRequest();
    setPackage();
    await act(async () => {
      render(<Harness />);
    });
    await waitFor(() => expect(lensInstances[0].decodeDoc).toHaveBeenCalled());

    fireEvent.click(screen.getByRole("button", { name: "export" }));

    await waitFor(() => expect(onError).toHaveBeenCalledWith({ error: "export failed" }));
    expect(imageViewerStoreApi.getState().status).toBe("error");
  });

  it("keeps search text writable and blocks search when lens search capability is false", async () => {
    viewerCanSearch.value = false;
    seedPackage();
    await act(async () => {
      render(<Harness />);
    });
    await waitFor(() => expect(lensInstances[0].decodeDoc).toHaveBeenCalled());

    await act(async () => {
      imageViewerStoreApi.getState().setSearchText("Cedar");
    });
    fireEvent.click(screen.getByRole("button", { name: "search" }));

    expect(screen.getByRole("button", { name: "search" })).toBeDisabled();
    expect(imageViewerStoreApi.getState().searchText).toBe("Cedar");
    expect(lensInstances[0].search).not.toHaveBeenCalledWith("Cedar", { additive: false, context: null });
  });

  it("syncs a changed host page request once after the package is decoded", async () => {
    seedPackage();
    await act(async () => {
      render(<Harness />);
    });
    await waitFor(() => expect(auroraLensCtor).toHaveBeenCalled());

    await waitFor(() => expect(lensInstances[0].decodeDoc).toHaveBeenCalled());
    expect(lensInstances[0].goToPage).not.toHaveBeenCalled();

    await act(async () => {
      imageViewerStoreApi.getState().setRequest({
        code: "idx-2",
        highlightOptions: { scroll: false },
        index: "party",
        metadataIndex: {
          ambiguous: "NO",
          label: "Party",
          source: "second quote",
          value: "Bob",
        },
        page: 3,
        quote: "second quote",
        segment: "party",
        session: "session-1",
        value: "Bob",
      });
    });

    await waitFor(() => expect(lensInstances[0].goToPage).toHaveBeenCalledTimes(1));
    expect(lensInstances[0].goToPage).toHaveBeenCalledWith(2);
    expect(lensInstances[0].searchIndex).toHaveBeenCalledWith(3, {
      ambiguous: "NO",
      label: "Party",
      source: "second quote",
      value: "Bob",
    }, { additive: false });
  });
});
