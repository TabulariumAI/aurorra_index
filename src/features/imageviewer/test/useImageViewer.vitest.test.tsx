import { readFileSync } from "node:fs";
import path from "node:path";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { imageViewerStoreApi } from "../store/imageViewerStore";
import type { LensApi } from "../type/imageViewer.types";

const packageRoot = path.join(process.cwd(), "src", "test", "package");
const packageMetadata = JSON.parse(readFileSync(path.join(packageRoot, "image.json"), "utf8")) as { pages: unknown[] };
const tiffBytes = readFileSync(path.join(packageRoot, "image.tiff"));

const configurePdfWorker = vi.hoisted(() => vi.fn());
const indexedDbViewerSessionStore = vi.hoisted(() => vi.fn());
const lensInstances = vi.hoisted(() => [] as LensApi[]);
const restoreSessionResult = vi.hoisted(() => ({ value: false }));
const auroraLensCtor = vi.hoisted(() =>
  vi.fn(function AuroraLensMock(this: unknown, _host: HTMLElement, options: { onStateChange?: (state: unknown) => void }) {
    const lens = {
      actualSize: vi.fn(),
      clear: vi.fn(),
      clearSelection: vi.fn(),
      close: vi.fn(),
      decodeDoc: vi.fn(async () => undefined),
      firstPage: vi.fn(),
      fitHeight: vi.fn(),
      fitPage: vi.fn(),
      fitWidth: vi.fn(),
      goToPage: vi.fn(),
      lastPage: vi.fn(),
      loadMetadata: vi.fn(),
      nextPage: vi.fn(),
      previousPage: vi.fn(),
      restoreSession: vi.fn(async () => restoreSessionResult.value),
      search: vi.fn(),
      searchIndex: vi.fn(),
      showThumbnails: vi.fn(),
      zoomIn: vi.fn(),
      zoomOut: vi.fn(),
    };
    lensInstances.push(lens);
    options.onStateChange?.({
      canActualSize: true,
      canClearSelection: true,
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
      pageCount: 4,
      pageIndex: 1,
      viewMode: "page",
    });
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

function Harness() {
  const viewer = useImageViewer();
  return (
    <>
      <div ref={viewer.lensHostRef} />
      <button disabled={!viewer.canActualSize} onClick={viewer.actualSize} type="button">actual size</button>
      <button disabled={!viewer.canClearSearch} onClick={viewer.clearSearch} type="button">clear search</button>
      <button disabled={!viewer.canGoFirst} onClick={viewer.firstPage} type="button">first page</button>
      <button disabled={!viewer.canFitHeight} onClick={viewer.fitHeight} type="button">fit height</button>
      <button disabled={!viewer.canFitPage} onClick={viewer.fitPage} type="button">fit page</button>
      <button disabled={!viewer.canFitWidth} onClick={viewer.fitWidth} type="button">fit width</button>
      <button disabled={!viewer.canGoLast} onClick={viewer.lastPage} type="button">last page</button>
      <button disabled={!viewer.canGoNext} onClick={viewer.nextPage} type="button">next page</button>
      <button disabled={!viewer.canGoPrevious} onClick={viewer.previousPage} type="button">previous page</button>
      <button disabled={!viewer.canZoomIn} onClick={viewer.zoomIn} type="button">zoom in</button>
      <button disabled={!viewer.canZoomOut} onClick={viewer.zoomOut} type="button">zoom out</button>
    </>
  );
}

function setRequest() {
  imageViewerStoreApi.getState().setRequest({
    code: "idx-1",
    highlightOptions: { scroll: false },
    index: "party",
    page: 2,
    quote: "quote",
    segment: "party",
    session: "session-1",
    value: "Alice",
  });
}

function setHost() {
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
  afterEach(() => {
    imageViewerStoreApi.getState().resetViewer();
    lensInstances.length = 0;
    restoreSessionResult.value = false;
    vi.unstubAllGlobals();
    vi.clearAllMocks();
    vi.restoreAllMocks();
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
    expect(lensInstances[0].search).toHaveBeenCalledWith("Alice", { additive: false, context: "quote" });
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
    expect(imageViewerStoreApi.getState().status).toBe("ready");
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

  it("restores same-session lens without decoding cached package on remount", async () => {
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
    await waitFor(() => expect(lensInstances[1].goToPage).toHaveBeenCalledWith(1));
    expect(lensInstances[1].decodeDoc).not.toHaveBeenCalled();
    expect(lensInstances[1].loadMetadata).not.toHaveBeenCalled();
    expect(lensInstances[1].search).toHaveBeenCalledWith("Alice", { additive: false, context: "quote" });
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
    fireEvent.click(screen.getByRole("button", { name: "actual size" }));
    fireEvent.click(screen.getByRole("button", { name: "clear search" }));
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
        page: 3,
        quote: "second quote",
        segment: "party",
        session: "session-1",
        value: "Bob",
      });
    });

    await waitFor(() => expect(lensInstances[0].goToPage).toHaveBeenCalledTimes(1));
    expect(lensInstances[0].goToPage).toHaveBeenCalledWith(2);
    expect(lensInstances[0].search).toHaveBeenCalledWith("Bob", { additive: false, context: "second quote" });
  });
});
