import { pageSize } from "../../../test/pageSize";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ViewerState } from "@tabulariumai/aurora-lens";
import { queueStoreApi } from "../../queue/store/queueStore";
import { loadImagePackage } from "../data/loadImagePackage";
import { imageViewerStoreApi } from "../store/imageViewerStore";

const response = { status: "completed" as const, data: { data: "https://storage.test/image.json", tiff: "https://storage.test/image.tiff" } };
const local = { packageMetadata: { pages: [] }, tiffBytes: new ArrayBuffer(4), tiffType: "image/tiff" };
function client() {
  return { packageImage: vi.fn(async () => response), downloadPackage: vi.fn(async () => local) };
}
const input = { pageSize, apiGatewayUrl: "https://gateway", authToken: "token", session: "session-1", onError: vi.fn() };

beforeEach(() => queueStoreApi.getState().reset());

afterEach(() => { imageViewerStoreApi.getState().resetViewer(); vi.clearAllMocks(); });

describe("loadImagePackage", () => {
  it("loads without a metadata ETag or metadata retrieval", async () => {
    queueStoreApi.getState().reset();
    const workerClient = client();
    await loadImagePackage({ ...input, workerClient });
    expect(workerClient.packageImage).toHaveBeenCalledExactlyOnceWith("token", "session-1", false);
    expect(imageViewerStoreApi.getState().status).toBe("ready");
  });
  it.each(["packageImage", "downloadPackage"] as const)("recovers after %s fails", async stage => {
    const workerClient = client();
    workerClient[stage].mockRejectedValueOnce(new Error("Package unavailable"));
    await loadImagePackage({ ...input, workerClient });
    expect(input.onError).toHaveBeenCalledOnce();
    await loadImagePackage({ ...input, workerClient, restart: true });
    expect(workerClient.packageImage.mock.calls).toEqual([["token", "session-1", false], ["token", "session-1", true]]);
    expect(imageViewerStoreApi.getState()).toMatchObject({ status: "ready", error: null });
  });
  it.each(["packageImage", "downloadPackage"] as const)("does not reuse or apply an exited session's %s when reopened", async stage => {
    let release!: () => void;
    const gate = new Promise<void>(resolve => { release = resolve; });
    const oldClient = {
      packageImage: vi.fn(async () => { if (stage === "packageImage") await gate; return response; }),
      downloadPackage: vi.fn(async () => { if (stage === "downloadPackage") await gate; return local; }),
    };
    const old = loadImagePackage({ ...input, workerClient: oldClient });
    await vi.waitFor(() => expect(oldClient[stage]).toHaveBeenCalledOnce());
    imageViewerStoreApi.getState().resetViewer();
    const nextClient = client();
    const next = { ...local, tiffBytes: new ArrayBuffer(8) };
    nextClient.downloadPackage.mockResolvedValueOnce(next);
    await loadImagePackage({ ...input, workerClient: nextClient });
    expect(nextClient.packageImage).toHaveBeenCalledOnce();
    release();
    await old;
    expect(imageViewerStoreApi.getState().tiffBytes).toBe(next.tiffBytes);
    expect(input.onError).not.toHaveBeenCalled();
  });
  it("downloads the orchestrated response without status or data requests", async () => {
    const workerClient = client();
    await loadImagePackage({ ...input, workerClient });
    expect(workerClient.packageImage).toHaveBeenCalledExactlyOnceWith("token", "session-1", false);
    expect(workerClient.downloadPackage).toHaveBeenCalledExactlyOnceWith("token", { jsonUrl: response.data.data, tiffUrl: response.data.tiff });
    expect(imageViewerStoreApi.getState()).toMatchObject({ status: "ready", packageStatus: "completed", ...local });
  });
  it("reuses loaded packages and uses generation only for recovery", async () => {
    const workerClient = client();
    const request = { ...input, workerClient };
    await loadImagePackage(request);
    await loadImagePackage(request);
    expect(workerClient.packageImage).toHaveBeenCalledOnce();
    await loadImagePackage({ ...request, restart: true });
    expect(workerClient.packageImage).toHaveBeenLastCalledWith("token", "session-1", true);
    expect(workerClient.downloadPackage).toHaveBeenCalledTimes(2);
  });
  it("retries failed loads through the normal GET flow", async () => {
    const workerClient = client();
    workerClient.packageImage.mockRejectedValueOnce({ code: "image_timeout", error: "Image package timed out" });
    const request = { ...input, workerClient };
    await loadImagePackage(request);
    expect(input.onError).toHaveBeenCalledWith(expect.objectContaining({ code: "image_timeout", error: "Image package timed out" }));
    expect(workerClient.downloadPackage).not.toHaveBeenCalled();
    await loadImagePackage(request);
    expect(workerClient.packageImage.mock.calls).toEqual([["token", "session-1", false], ["token", "session-1", false]]);
    expect(imageViewerStoreApi.getState()).toMatchObject({ status: "ready", error: null });
  });
  it("deduplicates simultaneous loads", async () => {
    const workerClient = client();
    await Promise.all([loadImagePackage({ ...input, workerClient }), loadImagePackage({ ...input, workerClient })]);
    expect(workerClient.packageImage).toHaveBeenCalledOnce();
    expect(workerClient.downloadPackage).toHaveBeenCalledOnce();
  });
  it.each(["packageImage", "downloadPackage"] as const)("ignores a previous session while awaiting %s", async stage => {
    let release!: () => void;
    const gate = new Promise<void>(resolve => { release = resolve; });
    const workerClient = {
      packageImage: vi.fn(async () => { if (stage === "packageImage") await gate; return response; }),
      downloadPackage: vi.fn(async () => { if (stage === "downloadPackage") await gate; return local; }),
    };
    const loading = loadImagePackage({ ...input, workerClient });
    await vi.waitFor(() => expect(workerClient[stage]).toHaveBeenCalledOnce());
    imageViewerStoreApi.getState().setHostInput({ ...input, session: "session-2", pageMap: new Map(), request: null, selectedIndex: null });
    release(); await loading;
    expect(imageViewerStoreApi.getState()).toMatchObject({ session: "session-2", status: "idle", error: null, tiffBytes: null });
    expect(input.onError).not.toHaveBeenCalled();
  });
  it("loads each selected session using its own request", async () => {
    const workerClient = client();
    await loadImagePackage({ ...input, workerClient });
    queueStoreApi.getState().reset();
    await loadImagePackage({ ...input, session: "session-2", workerClient });
    queueStoreApi.getState().reset();
    await loadImagePackage({ ...input, workerClient });
    expect(workerClient.packageImage.mock.calls).toEqual([["token", "session-1", false], ["token", "session-2", false], ["token", "session-1", false]]);
  });
  it("does not execute queued recovery after switching sessions", async () => {
    let release!: () => void;
    const workerClient = client();
    workerClient.packageImage.mockImplementationOnce(async () => { await new Promise<void>(resolve => { release = resolve; }); return response; });
    const loading = loadImagePackage({ ...input, workerClient });
    const recovery = loadImagePackage({ ...input, workerClient, restart: true });
    await vi.waitFor(() => expect(workerClient.packageImage).toHaveBeenCalledOnce());
    imageViewerStoreApi.getState().setHostInput({ ...input, session: "session-2", pageMap: new Map(), request: null, selectedIndex: null });
    release(); await Promise.all([loading, recovery]);
    expect(workerClient.packageImage).toHaveBeenCalledOnce();
    expect(workerClient.downloadPackage).not.toHaveBeenCalled();
  });
  it("does not report errors from a previous session", async () => {
    let reject!: (error: Error) => void;
    const workerClient = client();
    workerClient.packageImage.mockImplementationOnce(() => new Promise((_, fail) => { reject = fail; }));
    const loading = loadImagePackage({ ...input, workerClient });
    await vi.waitFor(() => expect(workerClient.packageImage).toHaveBeenCalledOnce());
    imageViewerStoreApi.getState().setHostInput({ ...input, session: "session-2", pageMap: new Map(), request: null, selectedIndex: null });
    reject(new Error("Previous session failed")); await loading;
    expect(input.onError).not.toHaveBeenCalled();
    expect(imageViewerStoreApi.getState()).toMatchObject({ status: "idle", error: null });
  });
  it("does not restart package flow after same-session lens restore", async () => {
    const workerClient = {
      packageImage: vi.fn(),
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
    expect(workerClient.downloadPackage).not.toHaveBeenCalled();
  });

});
