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
      selectedIndex: { code: "idx-1", segment: "party" },
      session: "session-1",
    });
    imageViewerStoreApi.getState().setLocalPackage({ packageMetadata: { pages: [] }, tiffBytes: new ArrayBuffer(1), tiffType: "image/tiff" });
    imageViewerStoreApi.getState().setLocalPackage({ packageMetadata: { pages: [] }, tiffBytes: new ArrayBuffer(2), tiffType: "image/tiff" });

    expect(imageViewerStoreApi.getState()).toMatchObject({
      apiGatewayUrl: "https://gateway",
      authToken: "token",
      pageCount: 2,
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
      selectedIndex: null,
      session: "session-1",
    });
    imageViewerStoreApi.getState().setLocalPackage({ packageMetadata: { pages: [] }, tiffBytes: new ArrayBuffer(1), tiffType: "image/tiff" });
    imageViewerStoreApi.getState().setLensSession("session-1");
    imageViewerStoreApi.getState().setHostInput({
      apiGatewayUrl: "https://gateway",
      authToken: "token",
      onError: vi.fn(),
      pageCount: 2,
      pageMap: new Map(),
      selectedIndex: null,
      session: "session-2",
    });

    expect(imageViewerStoreApi.getState()).toMatchObject({
      lensSession: null,
      packageMetadata: null,
      status: "idle",
      tiffBytes: null,
      tiffType: null,
    });
  });

  it("clears transient lens state without clearing same-session package values", () => {
    imageViewerStoreApi.getState().setHostInput({
      apiGatewayUrl: "https://gateway",
      authToken: "token",
      onError: vi.fn(),
      pageCount: 2,
      pageMap: new Map(),
      selectedIndex: null,
      session: "session-1",
    });
    imageViewerStoreApi.getState().setLocalPackage({ packageMetadata: { pages: [] }, tiffBytes: new ArrayBuffer(3), tiffType: "image/tiff" });
    imageViewerStoreApi.getState().setLensSession("session-1");
    imageViewerStoreApi.getState().setSearchText("value");
    imageViewerStoreApi.getState().setThumbsOpen(true);
    imageViewerStoreApi.getState().setViewerStatus("loadingPage");

    imageViewerStoreApi.getState().resetLens();

    expect(imageViewerStoreApi.getState()).toMatchObject({
      packageMetadata: { pages: [] },
      packageStatus: "completed",
      lensSession: "session-1",
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
