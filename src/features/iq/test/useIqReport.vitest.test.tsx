import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { iqStoreApi } from "../store/iqStore";
import { useIqReport } from "../hook/useIqReport";
import type { IqReport, IqWorkerClient } from "../type/iq.types";

const report: IqReport = {
  iq_doc: 90,
  decision: "Review",
  gates: [{ code: "gate-1", status: "FAIL", description: "Fail" }],
  segments: [],
  explanation: [],
};

function createClient(): IqWorkerClient {
  return {
    ackGate: vi.fn(async () => ({ status: "ok", data: {}, isComplete: true as const })),
    loadReport: vi.fn(async () => report),
    startReport: vi.fn(async () => ({ status: "completed", data: {}, isComplete: true })),
  };
}

describe("useIqReport", () => {
  beforeEach(() => {
    iqStoreApi.getState().resetIq();
  });

  it("loads report on mount and calls onIqLoaded", async () => {
    const client = createClient();
    const callbacks = { onIqLoaded: vi.fn() };

    renderHook(() => useIqReport({ apiGatewayUrl: "https://api", authToken: "token", callbacks, session: "session-1", workerClient: client }));

    await waitFor(() => expect(client.loadReport).toHaveBeenCalledWith("token", "session-1"));
    expect(iqStoreApi.getState().report).toEqual(report);
    expect(callbacks.onIqLoaded).toHaveBeenCalledWith(report);
  });

  it("refreshes and starts reports", async () => {
    const client = createClient();
    const callbacks = { onIqRefresh: vi.fn(), onIqStarted: vi.fn() };
    const { result } = renderHook(() => useIqReport({ apiGatewayUrl: "https://api", authToken: "token", callbacks, session: "session-1", workerClient: client }));

    await waitFor(() => expect(client.loadReport).toHaveBeenCalledTimes(1));
    await act(async () => {
      await result.current.loadReport(true);
      await result.current.startReport();
    });

    expect(callbacks.onIqRefresh).toHaveBeenCalledWith(report);
    expect(callbacks.onIqStarted).toHaveBeenCalledWith({ status: "completed", data: {}, isComplete: true });
  });

  it("acks a gate, removes it from store, and calls onIqAck", async () => {
    const client = createClient();
    const callbacks = { onIqAck: vi.fn() };
    const { result } = renderHook(() => useIqReport({ apiGatewayUrl: "https://api", authToken: "token", callbacks, session: "session-1", workerClient: client }));

    await waitFor(() => expect(iqStoreApi.getState().report).toEqual(report));
    await act(async () => {
      await result.current.ackGate("gate-1");
    });

    expect(client.ackGate).toHaveBeenCalledWith("token", "session-1", "gate-1");
    expect(iqStoreApi.getState().report?.gates).toEqual([]);
    expect(callbacks.onIqAck).toHaveBeenCalledWith("gate-1");
  });

  it("reports errors and cancel", async () => {
    const client = createClient();
    vi.mocked(client.loadReport).mockRejectedValueOnce(Object.assign(new Error("load failed"), { code: "load_error", status: 500 }));
    const callbacks = { onIqError: vi.fn(), onIqCanceled: vi.fn() };
    const { unmount } = renderHook(() => useIqReport({ apiGatewayUrl: "https://api", authToken: "token", callbacks, session: "session-1", workerClient: client }));

    await waitFor(() => expect(callbacks.onIqError).toHaveBeenCalledWith({ code: "load_error", details: undefined, error: "load failed", status: 500 }));
    unmount();
    expect(callbacks.onIqCanceled).toHaveBeenCalledTimes(1);
  });
});
