import { pageSize } from "../../../test/pageSize";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ViewerState } from "@tabulariumai/aurora-lens";
import { loadImagePackage } from "../data/loadImagePackage";
import { imageViewerStoreApi } from "../store/imageViewerStore";

describe("loadImagePackage", () => {
  it.each(["packageImage", "imageStatus", "imageData", "downloadPackage"] as const)("ignores session A after switching to B during %s", async stage => {
    let release!: () => void;
    const gate = new Promise<void>(resolve => { release = resolve; });
    const workerClient = {
      packageImage: vi.fn(async () => ({ status: "completed", data: "" })),
      imageStatus: vi.fn(async () => ({ status: "error", data: "A failed" })),
      imageData: vi.fn(async () => ({ status: "completed" as const, data: { data: "https://storage.test/A.json", tiff: "https://storage.test/A.tiff" } })),
      downloadPackage: vi.fn(async () => ({ packageMetadata: { pages: [] }, tiffBytes: new ArrayBuffer(4), tiffType: "image/tiff" })),
    };
    if (stage !== "imageStatus") workerClient.imageStatus.mockResolvedValue({ status: "completed", data: "" });
    const original = workerClient[stage].getMockImplementation()!;
    workerClient[stage].mockImplementation((async () => { await gate; return original(); }) as never);
    const onError = vi.fn();
    const loading = loadImagePackage({ pageSize, apiGatewayUrl: "https://gateway", authToken: "token", onError, session: "A", workerClient });
    await vi.waitFor(() => expect(workerClient[stage]).toHaveBeenCalledOnce());
    imageViewerStoreApi.getState().setHostInput({ pageSize, apiGatewayUrl: "https://gateway", authToken: "token", onError, session: "B", pageMap: new Map(), request: null, selectedIndex: null });
    release(); await loading;
    expect(imageViewerStoreApi.getState()).toMatchObject({ session: "B", status: "idle", packageStatus: null, error: null, tiffBytes: null });
    expect(onError).not.toHaveBeenCalled();
  });

  it("does not run a queued restart after the host switches sessions", async () => {
    let release!: () => void;
    const gate = new Promise<void>(resolve => { release = resolve; });
    const workerClient = { packageImage: vi.fn(async () => { await gate; return { status: "completed", data: "" }; }), imageStatus: vi.fn(async () => ({ status: "error", data: "A" })), imageData: vi.fn(), downloadPackage: vi.fn() };
    const input = { pageSize, apiGatewayUrl: "https://gateway", authToken: "token", onError: vi.fn(), session: "A", workerClient };
    const loading = loadImagePackage(input);
    const restart = loadImagePackage({ ...input, restart: true });
    imageViewerStoreApi.getState().setHostInput({ pageSize, apiGatewayUrl: "https://gateway", authToken: "token", onError: vi.fn(), session: "B", pageMap: new Map(), request: null, selectedIndex: null });
    release(); await Promise.all([loading, restart]);
    expect(workerClient.packageImage).toHaveBeenCalledOnce();
    expect(imageViewerStoreApi.getState()).toMatchObject({ session: "B", status: "idle", error: null });
  });

  it("does not report a rejected previous-session request to the host", async () => {
    let reject!: (error: Error) => void;
    const gate = new Promise<never>((_, fail) => { reject = fail; });
    const onError = vi.fn();
    const workerClient = { packageImage: vi.fn(() => gate), imageStatus: vi.fn(), imageData: vi.fn(), downloadPackage: vi.fn() };
    const loading = loadImagePackage({ pageSize, apiGatewayUrl: "https://gateway", authToken: "token", onError, session: "A", workerClient });
    imageViewerStoreApi.getState().setHostInput({ pageSize, apiGatewayUrl: "https://gateway", authToken: "token", onError, session: "B", pageMap: new Map(), request: null, selectedIndex: null });
    reject(new Error("A failed")); await loading;
    expect(onError).not.toHaveBeenCalled();
    expect(imageViewerStoreApi.getState()).toMatchObject({ session: "B", status: "idle", error: null });
  });

  afterEach(() => {
    imageViewerStoreApi.getState().resetViewer();
    vi.useRealTimers();
  });

  it("loads and stores an image package without rendering the viewer", async () => {
    const workerClient = {
      packageImage: vi.fn(async () => ({ status: "processing", data: "" })),
      imageStatus: vi.fn(async () => ({ status: "completed", data: "" })),
      imageData: vi.fn(async () => ({
        status: "completed" as const,
        data: {
          data: "https://storage.test/image.json",
          tiff: "https://storage.test/image.tiff",
        },
      })),
      downloadPackage: vi.fn(async () => ({
        packageMetadata: { pages: [{ pageNumber: 1 }] },
        tiffBytes: new ArrayBuffer(4),
        tiffType: "image/tiff",
      })),
    };

    await loadImagePackage({
      pageSize,
      apiGatewayUrl: "https://gateway",
      authToken: "token",
      onError: vi.fn(),
      session: "session-1",
      workerClient,
    });

    expect(workerClient.packageImage).toHaveBeenCalledWith("token", "session-1");
    expect(workerClient.imageStatus).toHaveBeenCalledWith("token", "session-1");
    expect(workerClient.imageData).toHaveBeenCalledWith("token", "session-1");
    expect(workerClient.downloadPackage).toHaveBeenCalledWith("token", {
      jsonUrl: "https://storage.test/image.json",
      tiffUrl: "https://storage.test/image.tiff",
    });
    expect(imageViewerStoreApi.getState()).toMatchObject({
      pageSize,
      apiGatewayUrl: "https://gateway",
      authToken: "token",
      packageMetadata: { pages: [{ pageNumber: 1 }] },
      packageStatus: "completed",
      session: "session-1",
      status: "ready",
      tiffType: "image/tiff",
    });
    expect(imageViewerStoreApi.getState().tiffBytes?.byteLength).toBe(4);
  });

  it("does not restart same-session loaded package", async () => {
    const workerClient = {
      packageImage: vi.fn(async () => ({ status: "processing", data: "" })),
      imageStatus: vi.fn(async () => ({ status: "completed", data: "" })),
      imageData: vi.fn(async () => ({
        status: "completed" as const,
        data: {
          data: "https://storage.test/image.json",
          tiff: "https://storage.test/image.tiff",
        },
      })),
      downloadPackage: vi.fn(async () => ({
        packageMetadata: { pages: [] },
        tiffBytes: new ArrayBuffer(4),
        tiffType: "image/tiff",
      })),
    };
    const input = {
      pageSize,
      apiGatewayUrl: "https://gateway",
      authToken: "token",
      onError: vi.fn(),
      session: "session-1",
      workerClient,
    };

    await loadImagePackage(input);
    await loadImagePackage(input);

    expect(workerClient.packageImage).toHaveBeenCalledTimes(1);
    expect(workerClient.imageData).toHaveBeenCalledTimes(1);
    expect(workerClient.downloadPackage).toHaveBeenCalledTimes(1);
  });

  it("restarts a same-session loaded package when requested", async () => {
    const workerClient = {
      packageImage: vi.fn(async () => ({ status: "processing", data: "" })),
      imageStatus: vi.fn(async () => ({ status: "completed", data: "" })),
      imageData: vi.fn(async () => ({
        status: "completed" as const,
        data: {
          data: "https://storage.test/image.json",
          tiff: "https://storage.test/image.tiff",
        },
      })),
      downloadPackage: vi.fn(async () => ({
        packageMetadata: { pages: [] },
        tiffBytes: new ArrayBuffer(4),
        tiffType: "image/tiff",
      })),
    };
    const input = {
      pageSize,
      apiGatewayUrl: "https://gateway",
      authToken: "token",
      onError: vi.fn(),
      session: "session-1",
      workerClient,
    };

    await loadImagePackage(input);
    await loadImagePackage({ ...input, restart: true });

    expect(workerClient.packageImage).toHaveBeenCalledTimes(2);
    expect(workerClient.imageData).toHaveBeenCalledTimes(2);
    expect(workerClient.downloadPackage).toHaveBeenCalledTimes(2);
    expect(imageViewerStoreApi.getState().packageVersion).toBe(2);
  });

  it("does not restart package flow after same-session lens restore", async () => {
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
      request: null,
      selectedIndex: null,
      session: "session-1",
      workerClient,
    });
    imageViewerStoreApi.getState().setViewerState({
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
      pageIndex: 0,
      status: "ready",
      viewMode: "page",
    } as unknown as ViewerState);
    imageViewerStoreApi.getState().setReady();

    await loadImagePackage({
      pageSize,
      apiGatewayUrl: "https://gateway",
      authToken: "token",
      onError: vi.fn(),
      session: "session-1",
      workerClient,
    });

    expect(workerClient.packageImage).not.toHaveBeenCalled();
    expect(workerClient.imageStatus).not.toHaveBeenCalled();
    expect(workerClient.imageData).not.toHaveBeenCalled();
    expect(workerClient.downloadPackage).not.toHaveBeenCalled();
  });

  it("stores package errors through the viewer store error path", async () => {
    const onError = vi.fn();
    const workerClient = {
      packageImage: vi.fn(async () => ({ status: "processing", data: "" })),
      imageStatus: vi.fn(async () => ({ status: "error", data: "package failed" })),
      imageData: vi.fn(),
      downloadPackage: vi.fn(),
    };

    await loadImagePackage({
      pageSize,
      apiGatewayUrl: "https://gateway",
      authToken: "token",
      onError,
      session: "session-1",
      workerClient,
    });

    expect(onError).toHaveBeenCalledWith({
      code: "image_package_error",
      details: { status: "error", data: "package failed" },
      error: "package failed",
    });
    expect(imageViewerStoreApi.getState()).toMatchObject({
      packageStatus: "error",
      status: "error",
    });
    expect(workerClient.imageData).not.toHaveBeenCalled();
    expect(workerClient.downloadPackage).not.toHaveBeenCalled();
  });
});
