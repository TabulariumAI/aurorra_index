import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { useIqReport } from "../hook/useIqReport";
import { iqStoreApi } from "../store/iqStore";
import type { IqReport, IqWorkerClient } from "../type/iq.types";

const report: IqReport = { iq_doc: 90, decision: "Review", gates: [{ code: "gate", status: "FAIL", description: "Review signature" }], segments: [], explanation: [] };

function deferred() {
  let resolve!: () => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<void>((complete, fail) => { resolve = complete; reject = fail; });
  return { promise, resolve, reject };
}

beforeEach(() => iqStoreApi.getState().resetIq());
afterEach(() => { cleanup(); iqStoreApi.getState().resetIq(); });

function setup() {
  const pending = deferred();
  const client = {
    loadReport: vi.fn(async () => ({ report: structuredClone(report), metadataEtag: "version" })),
    ackGate: vi.fn<IqWorkerClient["ackGate"]>(async () => { await pending.promise; return { status: "ok", data: {}, isComplete: true as const }; }),
  };
  const callbacks = { onIqAck: vi.fn(), onIqError: vi.fn() };
  const view = renderHook(({ session }) => useIqReport({ apiGatewayUrl: "https://gateway.example.test", authToken: "token", callbacks,
    retryLimit: 0, retryIntervalMs: 1, session, workerClient: client }), { initialProps: { session: "session-a" } });
  return { pending, client, callbacks, view };
}

it("clears failed acknowledgement state and permits retry without removing the gate", async () => {
  const { view, pending, client, callbacks } = setup();
  await waitFor(() => expect(iqStoreApi.getState().status).toBe("success"));
  let acknowledgement!: Promise<void>;
  act(() => { acknowledgement = view.result.current.ackGate("gate"); });
  expect(iqStoreApi.getState().ackingCodes.has("gate")).toBe(true);
  await act(async () => { pending.reject({ error: "Acknowledgement unavailable" }); await acknowledgement; });
  expect(iqStoreApi.getState().ackingCodes.has("gate")).toBe(false);
  expect(iqStoreApi.getState().report?.gates).toEqual(report.gates);
  expect(callbacks.onIqError).toHaveBeenCalledTimes(1);
  client.ackGate.mockResolvedValueOnce({ status: "ok", data: {}, isComplete: true });
  await act(async () => view.result.current.ackGate("gate"));
  expect(iqStoreApi.getState().report?.gates).toEqual([]);
  expect(callbacks.onIqAck).toHaveBeenCalledTimes(1);
});

it.each(["success", "failure"])("ignores old-session acknowledgement %s after switching to a report with the same gate", async outcome => {
  const { view, pending, callbacks } = setup();
  await waitFor(() => expect(iqStoreApi.getState().status).toBe("success"));
  let acknowledgement!: Promise<void>;
  act(() => { acknowledgement = view.result.current.ackGate("gate"); });
  view.rerender({ session: "session-b" });
  await waitFor(() => expect(iqStoreApi.getState()).toMatchObject({ activeSession: "session-b", status: "success" }));
  expect(iqStoreApi.getState().ackingCodes.size).toBe(0);
  const current = iqStoreApi.getState();
  await act(async () => {
    if (outcome === "success") pending.resolve();
    else pending.reject({ error: "Old failure" });
    await acknowledgement;
  });
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
  expect(iqStoreApi.getState()).toBe(current);
  expect(callbacks.onIqAck).not.toHaveBeenCalled();
});

it("claims one acknowledgement per gate while allowing different gates", async () => {
  const { view, pending, client } = setup();
  await waitFor(() => expect(iqStoreApi.getState().status).toBe("success"));
  act(() => iqStoreApi.getState().setLoaded("session-a", {
    ...report, gates: [...report.gates, { code: "other", status: "FAIL", description: "Review other signature" }],
  }, "version"));
  let first!: Promise<void>, second!: Promise<void>, duplicate!: Promise<void>;
  act(() => { first = view.result.current.ackGate("gate"); second = view.result.current.ackGate("other"); duplicate = view.result.current.ackGate("gate"); });
  expect(client.ackGate.mock.calls.map(call => call[2])).toEqual(["gate", "other"]);
  await act(async () => { pending.resolve(); await Promise.all([first, second, duplicate]); });
  expect(iqStoreApi.getState().ackingCodes.size).toBe(0);
  expect(iqStoreApi.getState().report?.gates).toEqual([]);
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
