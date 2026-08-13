import { afterEach, describe, expect, it, vi } from "vitest";
import { imageViewerStoreApi } from "../store/imageViewerStore";

describe("imageViewerStore", () => {
  afterEach(() => {
    imageViewerStoreApi.getState().resetViewer();
    vi.restoreAllMocks();
  });

  it("stores host input and replaces local package bytes", () => {
    const onError = vi.fn();
    imageViewerStoreApi.getState().setHostInput({
      apiGatewayUrl: "https://gateway",
      authToken: "token",
      onError,
      pageCount: 2,
      pageMap: new Map([["1", "page-1"]]),
      request: {
        code: "page-1",
        highlightOptions: { scroll: false },
        index: "page",
        metadataIndex: null,
        page: 1,
        quote: "",
        segment: "page",
        session: "session-1",
        value: "",
      },
      selectedIndex: { code: "idx-1", segment: "party" },
      session: "session-1",
    });
    imageViewerStoreApi.getState().setLocalPackage({ packageMetadata: { pages: [] }, tiffBytes: new ArrayBuffer(1), tiffType: "image/tiff" });
    imageViewerStoreApi.getState().setLocalPackage({ packageMetadata: { pages: [] }, tiffBytes: new ArrayBuffer(2), tiffType: "image/tiff" });

    expect(imageViewerStoreApi.getState()).toMatchObject({
      apiGatewayUrl: "https://gateway",
      authToken: "token",
      pageCount: 2,
      request: {
        code: "page-1",
        highlightOptions: { scroll: false },
        index: "page",
        metadataIndex: null,
        page: 1,
        quote: "",
        segment: "page",
        session: "session-1",
        value: "",
      },
      selectedIndex: { code: "idx-1", segment: "party" },
      session: "session-1",
      status: "ready",
      tiffType: "image/tiff",
    });
    imageViewerStoreApi.getState().setError({ error: "failed" });
    expect(onError).toHaveBeenCalledWith({ error: "failed" });
    expect(imageViewerStoreApi.getState().tiffBytes?.byteLength).toBe(2);
  });

  it("clears downloaded package values when session changes", () => {
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
    imageViewerStoreApi.getState().setLocalPackage({ packageMetadata: { pages: [] }, tiffBytes: new ArrayBuffer(1), tiffType: "image/tiff" });
    imageViewerStoreApi.getState().setHostInput({
      apiGatewayUrl: "https://gateway",
      authToken: "token",
      onError: vi.fn(),
      pageCount: 2,
      pageMap: new Map(),
      request: null,
      selectedIndex: null,
      session: "session-2",
    });

    expect(imageViewerStoreApi.getState()).toMatchObject({
      packageMetadata: null,
      requestVersion: 0,
      status: "idle",
      tiffBytes: null,
      tiffType: null,
    });
  });

  it("versions every View Index request", () => {
    const request = {
      code: "page-1",
      highlightOptions: { scroll: false },
      index: "page",
      metadataIndex: null,
      page: 1,
      quote: "",
      segment: "page",
      session: "session-1",
      value: "",
    };
    imageViewerStoreApi.getState().setRequest(request);
    imageViewerStoreApi.getState().setRequest(request);

    expect(imageViewerStoreApi.getState().requestVersion).toBe(2);
  });

  it("versions each fit page command", () => {
    imageViewerStoreApi.getState().fitPage();
    imageViewerStoreApi.getState().fitPage();

    expect(imageViewerStoreApi.getState().fitPageVersion).toBe(2);
  });

  it("clears transient lens state without clearing same-session package values", () => {
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
    imageViewerStoreApi.getState().setLocalPackage({ packageMetadata: { pages: [] }, tiffBytes: new ArrayBuffer(3), tiffType: "image/tiff" });
    imageViewerStoreApi.getState().setSearchText("value");
    imageViewerStoreApi.getState().setThumbsOpen(true);
    imageViewerStoreApi.getState().setViewerStatus("loadingPage");

    imageViewerStoreApi.getState().resetLens();

    expect(imageViewerStoreApi.getState()).toMatchObject({
      fitPageVersion: 0,
      packageMetadata: { pages: [] },
      packageStatus: "completed",
      searchText: "",
      session: "session-1",
      status: "ready",
      thumbsOpen: false,
      tiffType: "image/tiff",
      viewerState: null,
      viewerStatus: "idle",
    });
    expect(imageViewerStoreApi.getState().tiffBytes?.byteLength).toBe(3);
  });

  it("preserves same-session package bytes when TIFF content type is empty", () => {
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
    imageViewerStoreApi.getState().setLocalPackage({ packageMetadata: { pages: [] }, tiffBytes: new ArrayBuffer(3), tiffType: "" });

    imageViewerStoreApi.getState().resetLens();

    expect(imageViewerStoreApi.getState()).toMatchObject({
      packageStatus: "completed",
      status: "ready",
      tiffType: "",
    });
    expect(imageViewerStoreApi.getState().tiffBytes?.byteLength).toBe(3);
  });
});
