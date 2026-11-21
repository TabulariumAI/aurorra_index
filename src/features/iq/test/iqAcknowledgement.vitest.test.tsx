import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { useIqReport } from "../hook/useIqReport";
import { iqStoreApi } from "../store/iqStore";
import { iqQueueStore } from "../store/iqQueueStore";
import type { IqReport, IqWorkerClient } from "../type/iq.types";

const report: IqReport = { iq_doc: 90, gates: [{ code: "gate", status: "FAIL", description: "Review signature" }], segments: [], notes: [] };

function deferred() {
  let resolve!: () => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<void>((complete, fail) => { resolve = complete; reject = fail; });
  return { promise, resolve, reject };
}

beforeEach(() => { iqQueueStore.getState().reset(); iqStoreApi.getState().resetIq(); });
afterEach(() => { cleanup(); iqQueueStore.getState().reset(); iqStoreApi.getState().resetIq(); });

function setup() {
  const pending = deferred();
  const client = { ackCue: vi.fn(),
    loadReport: vi.fn(async () => ({ report: structuredClone(report), metadataEtag: "version" })),
    ackGate: vi.fn<IqWorkerClient["ackGate"]>(async () => { await pending.promise; return { status: "ok", etag: "inputs-after", data: {}, isComplete: true as const }; }),
  };
  const callbacks = { onIqAck: vi.fn(), onIqError: vi.fn(), onIqChange: vi.fn() };
  const view = renderHook(({ session }) => useIqReport({ apiGatewayUrl: "https://gateway.example.test", authToken: "token", callbacks,
    retryLimit: 0, retryIntervalMs: 1, session, workerClient: client }), { initialProps: { session: "session-a" } });
  return { pending, client, callbacks, view };
}

it("clears failed acknowledgement state and permits retry without removing the gate", async () => {
  const { view, pending, client, callbacks } = setup();
  await waitFor(() => expect(iqStoreApi.getState().status).toBe("success"));
  let acknowledgement!: Promise<void>;
  act(() => { acknowledgement = view.result.current.ackGate("gate"); });
  expect(iqQueueStore.getState().tasks[0]).toMatchObject({ code: "gate", session: "session-a", status: "processing" });
  await act(async () => { pending.reject({ error: "Acknowledgement unavailable" }); await acknowledgement; });
  await waitFor(() => expect(iqQueueStore.getState().tasks[0].status).toBe("failed"));
  expect(iqStoreApi.getState().report?.gates).toEqual(report.gates);
  expect(callbacks.onIqError).not.toHaveBeenCalled();
  expect(callbacks.onIqChange).toHaveBeenLastCalledWith(expect.objectContaining({ status: "failed" }));
  client.ackGate.mockResolvedValueOnce({ status: "ok", etag: "inputs-after", data: {}, isComplete: true });
  client.loadReport.mockResolvedValueOnce({ report: { ...report, gates: [] }, metadataEtag: "new" });
  act(() => iqQueueStore.getState().retry(iqQueueStore.getState().tasks[0].id));
  await waitFor(() => expect(view.result.current.view?.gates.data?.items).toEqual([]));
  expect(callbacks.onIqAck).toHaveBeenCalledTimes(1);
});

it.each(["success", "failure"])("ignores old-session acknowledgement %s after switching to a report with the same gate", async outcome => {
  const { view, pending, callbacks } = setup();
  await waitFor(() => expect(iqStoreApi.getState().status).toBe("success"));
  let acknowledgement!: Promise<void>;
  act(() => { acknowledgement = view.result.current.ackGate("gate"); });
  view.rerender({ session: "session-b" });
  await waitFor(() => expect(iqStoreApi.getState()).toMatchObject({ activeSession: "session-b", status: "success" }));
  expect(iqQueueStore.getState().tasks[0].session).toBe("session-a");
  const current = iqStoreApi.getState();
  await act(async () => {
    if (outcome === "success") pending.resolve();
    else pending.reject({ error: "Old failure" });
    await acknowledgement;
  });
  await waitFor(() => expect(iqQueueStore.getState().tasks[0]?.status ?? "completed").toBe(outcome === "success" ? "completed" : "failed"));
  expect(iqStoreApi.getState()).toBe(current);
  expect(iqStoreApi.getState().report?.gates).toEqual(report.gates);
  expect(callbacks.onIqAck).not.toHaveBeenCalled();
  expect(callbacks.onIqError).not.toHaveBeenCalled();
});

it("ignores acknowledgement completion after reset and reopening the same session", async () => {
  const { view, pending, callbacks } = setup();
  await waitFor(() => expect(iqStoreApi.getState().status).toBe("success"));
  let acknowledgement!: Promise<void>;
  act(() => { acknowledgement = view.result.current.ackGate("gate"); });
  act(() => { iqStoreApi.getState().resetIq(); iqStoreApi.getState().setLoaded("session-a", structuredClone(report), "new-version"); });
  const current = iqStoreApi.getState();
  await act(async () => { pending.resolve(); await acknowledgement; });
  await waitFor(() => expect(iqQueueStore.getState().tasks).toEqual([]));
  expect(iqStoreApi.getState()).toBe(current);
  expect(callbacks.onIqAck).not.toHaveBeenCalled();
});

it("claims one acknowledgment per gate and serializes different gates", async () => {
  const { view, pending, client } = setup();
  await waitFor(() => expect(iqStoreApi.getState().status).toBe("success"));
  act(() => iqStoreApi.getState().setLoaded("session-a", {
    ...report, gates: [...report.gates, { code: "other", status: "FAIL", description: "Review other signature" }],
  }, "version"));
  let first!: Promise<void>, second!: Promise<void>, duplicate!: Promise<void>;
  act(() => { first = view.result.current.ackGate("gate"); second = view.result.current.ackGate("other"); duplicate = view.result.current.ackGate("gate"); });
  expect(client.ackGate.mock.calls.map(call => call[2])).toEqual(["gate"]);
  client.loadReport.mockResolvedValue({ report: { ...report, gates: [] }, metadataEtag: "new" });
  await act(async () => { pending.resolve(); await Promise.all([first, second, duplicate]); });
  await waitFor(() => expect(iqQueueStore.getState().tasks).toEqual([]));
  expect(client.ackGate.mock.calls.map(call => call[2])).toEqual(["gate", "other"]);
  expect(view.result.current.view?.gates.data?.items).toEqual([]);
});

it("ignores acknowledgement completion after the current report refreshes", async () => {
  const { view, pending, callbacks } = setup();
  await waitFor(() => expect(iqStoreApi.getState().status).toBe("success"));
  let acknowledgement!: Promise<void>;
  act(() => { acknowledgement = view.result.current.ackGate("gate"); });
  await act(async () => view.result.current.refreshReport());
  const current = iqStoreApi.getState();
  await act(async () => { pending.resolve(); await acknowledgement; });
  expect(iqStoreApi.getState()).toBe(current);
  expect(callbacks.onIqAck).not.toHaveBeenCalled();
});

it("ignores the first report's acknowledgement after switching away and back", async () => {
  const { view, pending, callbacks } = setup();
  await waitFor(() => expect(iqStoreApi.getState().status).toBe("success"));
  let acknowledgement!: Promise<void>;
  act(() => { acknowledgement = view.result.current.ackGate("gate"); });
  view.rerender({ session: "session-b" });
  await waitFor(() => expect(iqStoreApi.getState().activeSession).toBe("session-b"));
  view.rerender({ session: "session-a" });
  await waitFor(() => expect(iqStoreApi.getState()).toMatchObject({ activeSession: "session-a", status: "success" }));
  const current = iqStoreApi.getState();
  await act(async () => { pending.resolve(); await acknowledgement; });
  expect(iqStoreApi.getState()).toBe(current);
  expect(callbacks.onIqAck).not.toHaveBeenCalled();
});
