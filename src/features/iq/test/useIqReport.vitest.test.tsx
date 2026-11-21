import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { iqQueueStore } from "../store/iqQueueStore";
import { iqStoreApi } from "../store/iqStore";
import { useIqReport } from "../hook/useIqReport";
import * as iqWorker from "../worker/iqWorkerClient";
import type { IqReport, IqWorkerClient } from "../type/iq.types";

const report: IqReport = {
  iq_doc: 90,
  gates: [{ code: "gate-1", status: "FAIL", description: "Fail" }],
  segments: [],
  notes: [],
};

function createClient(): IqWorkerClient {
  return { ackCue: vi.fn(),
    ackGate: vi.fn(async () => ({ status: "ok", etag: "inputs-after", data: {}, isComplete: true as const })),
    loadReport: vi.fn(async () => ({ report, metadataEtag: "" })),
  };
}


describe("useIqReport", () => {
  afterEach(() => vi.restoreAllMocks());
  beforeEach(() => {
    iqQueueStore.getState().reset();
    iqStoreApi.getState().resetIq();
  });

  it("loads report on mount and calls onIqLoaded", async () => {
    const client = createClient();
    const callbacks = { onIqLoaded: vi.fn() };

    renderHook(() => useIqReport({ apiGatewayUrl: "https://api", authToken: "token", callbacks, retryLimit: 5, retryIntervalMs: 0, session: "session-1", workerClient: client }));

    await waitFor(() => expect(client.loadReport).toHaveBeenCalledWith("token", "session-1", ""));
    expect(iqStoreApi.getState().report).toEqual(report);
    expect(callbacks.onIqLoaded).toHaveBeenCalledWith(report);
  });

  it("refreshes through GET without metadata etag", async () => {
    const client = createClient();
    const callbacks = { onIqRefresh: vi.fn() };
    const { result } = renderHook(() => useIqReport({ apiGatewayUrl: "https://api", authToken: "token", callbacks, retryLimit: 5, retryIntervalMs: 0, session: "session-1", workerClient: client }));

    await waitFor(() => expect(client.loadReport).toHaveBeenCalledTimes(1));
    await act(async () => {
      await result.current.refreshReport();
    });

    expect(callbacks.onIqRefresh).toHaveBeenCalledWith(report);
    expect(client.loadReport).toHaveBeenLastCalledWith("token", "session-1", null);
  });

  it("keeps raw notes in the store and callbacks while replacing prepared note statuses on refresh", async () => {
    const initial: IqReport = { ...report, notes: [{ segment: null, message: "Compliance gates: not satisfied (0 / 1)." }, { segment: null, message: "Indexing quality needing attention: Party." }, { segment: null, message: "Unclassified indexes: Critical (0/0)" }, { segment: null, message: "Missing indexes: Person." }, { segment: null, message: "Neutral note" }] };
    const refreshed: IqReport = { ...report, notes: [{ segment: null, message: "Compliance gates: satisfied (1 / 1)." }, { segment: null, message: "Indexing quality: complete and consistent." }, { segment: null, message: "Unclassified indexes: Satisfied (0/20)" }] };
    const client = createClient();
    client.loadReport = vi.fn().mockResolvedValueOnce({ report: initial, metadataEtag: "" }).mockResolvedValueOnce({ report: refreshed, metadataEtag: "" });
    const callbacks = { onIqLoaded: vi.fn(), onIqRefresh: vi.fn() };
    const { result } = renderHook(() => useIqReport({ apiGatewayUrl: "https://api", authToken: "token", callbacks, retryLimit: 5, retryIntervalMs: 0, session: "session-1", workerClient: client }));
    await waitFor(() => expect(result.current.status).toBe("success"));
    expect(result.current.view?.notes.data).toEqual([
      { ...initial.notes[2], status: "warning" },
      { ...initial.notes[3], status: "warning" },
      { ...initial.notes[4], status: "neutral" },
    ]);
    expect(iqStoreApi.getState().report).toEqual(initial);
    expect(callbacks.onIqLoaded).toHaveBeenCalledWith(initial);
    await act(async () => { await result.current.refreshReport(); });
    expect(result.current.view?.notes.data).toEqual([{ ...refreshed.notes[2], status: "success" }]);
    expect(iqStoreApi.getState().report).toEqual(refreshed);
    expect(callbacks.onIqLoaded).toHaveBeenLastCalledWith(refreshed);
    expect(callbacks.onIqRefresh).toHaveBeenCalledWith(refreshed);
  });

  it("queues a gate, loads the published report, and calls onIqAck", async () => {
    const client = createClient();
    vi.mocked(client.loadReport).mockResolvedValueOnce({ report, metadataEtag: "old" }).mockResolvedValueOnce({ report: { ...report, gates: [] }, metadataEtag: "new" });
    const callbacks = { onIqAck: vi.fn() };
    const { result } = renderHook(() => useIqReport({ apiGatewayUrl: "https://api", authToken: "token", callbacks, retryLimit: 5, retryIntervalMs: 0, session: "session-1", workerClient: client }));

    await waitFor(() => expect(iqStoreApi.getState().report).toEqual(report));
    await act(async () => {
      await result.current.ackGate("gate-1");
    });

    expect(client.ackGate).toHaveBeenCalledWith("token", "session-1", "gate-1");
    await waitFor(() => expect(result.current.view?.gates.data?.items).toEqual([]));
    expect(callbacks.onIqAck).toHaveBeenCalledWith("gate-1");
  });

  it("reports errors and cancel", async () => {
    const client = createClient();
    vi.mocked(client.loadReport).mockRejectedValueOnce(Object.assign(new Error("load failed"), { code: "load_error", status: 500 }));
    const callbacks = { onIqError: vi.fn(), onIqCanceled: vi.fn() };
    const { unmount } = renderHook(() => useIqReport({ apiGatewayUrl: "https://api", authToken: "token", callbacks, retryLimit: 5, retryIntervalMs: 0, session: "session-1", workerClient: client }));

    await waitFor(() => expect(callbacks.onIqError).toHaveBeenCalledWith({ code: "load_error", details: undefined, error: "load failed", status: 500 }));
    unmount();
    expect(callbacks.onIqCanceled).toHaveBeenCalledTimes(1);
  });
  it("discards retries from the default client after unmount and reopening the same session", async () => {
    const client = createClient();
    let resolve!: (value: IqReport) => void;
    vi.mocked(client.loadReport).mockReturnValueOnce(new Promise<{ report: IqReport; metadataEtag: string }>(yes => { resolve = report => yes({ report, metadataEtag: "" }); }));
    const factory = vi.spyOn(iqWorker, "createIqWorkerClient").mockReturnValue(client);
    const callbacks = { onIqLoaded: vi.fn() };
    const { unmount } = renderHook(() => useIqReport({ apiGatewayUrl: "https://api", authToken: "token", callbacks,
      retryLimit: 5, retryIntervalMs: 0, session: "session-1" }));
    const retry = factory.mock.calls.find(([config]) => config.onRetry)![0].onRetry!;
    act(() => retry(2));
    expect(iqStoreApi.getState().retryAttempt).toBe(2);
    unmount();
    iqQueueStore.getState().reset();
    iqStoreApi.getState().resetIq();
    iqStoreApi.getState().setLoaded("session-1", { ...report, iq_doc: 55 }, "");
    retry(3);
    await act(async () => resolve(report));
    expect(iqStoreApi.getState()).toMatchObject({ report: { iq_doc: 55 }, retryAttempt: 0, status: "success" });
    expect(callbacks.onIqLoaded).not.toHaveBeenCalled();
  });

});
