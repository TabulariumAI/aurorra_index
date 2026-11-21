import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { useIqReport } from "../hook/useIqReport";
import { useIqRefresh } from "../hook/useIqRefresh";
import { iqStoreApi } from "../store/iqStore";
import { iqQueueStore } from "../store/iqQueueStore";
import type { IqResource } from "../type/iq.types";

const resource: IqResource = {
  report: { iq_doc: 80, notes: [{ segment: null, message: "Saved note" }], gates: [
    { code: "gate", status: "FAIL", description: "Signature missing" },
    { code: "other", status: "PASS", description: "Present" },
  ], segments: [{ segment_name: "party", expected_weight: 10, actual_weight: 8, iq: 80,
    explanations: ["Saved explanation"], cues: [{ code: "cue", aspect: "person", description: "Missing person" }] }] },
  etag: "inputs-before", reportEtag: "inputs-before", acknowledgements: [],
};

beforeEach(() => { iqQueueStore.getState().reset(); iqStoreApi.getState().resetIq(); });
afterEach(() => { cleanup(); iqQueueStore.getState().reset(); iqStoreApi.getState().resetIq(); });

it.each(["gates", "cues"] as const)("removes only the saved %s item and waits for explicit Refresh to recalculate", async kind => {
  const ack = vi.fn().mockResolvedValue({ status: "completed", etag: "inputs-after", data: {}, isComplete: true });
  const client = { ackGate: ack, ackCue: ack, loadReport: vi.fn().mockResolvedValue(structuredClone(resource)) };
  const callbacks = { onIqAck: vi.fn(), onIqLoaded: vi.fn(), onIqRefresh: vi.fn() };
  const { result } = renderHook(() => ({
    report: useIqReport({ apiGatewayUrl: "x", authToken: "token", session: "s", callbacks,
      retryLimit: 0, retryIntervalMs: 1, workerClient: client }),
    stale: useIqRefresh(),
  }));
  await waitFor(() => expect(result.current.report.status).toBe("success"));
  const saved = iqStoreApi.getState().report;
  const view = result.current.report.view!;
  await act(async () => {
    await result.current.report[kind === "gates" ? "ackGate" : "ackCue"](kind === "gates" ? "gate" : "cue");
  });
  await waitFor(() => expect(iqQueueStore.getState().tasks).toEqual([]));
  expect(client.loadReport).toHaveBeenCalledOnce();
  expect(iqStoreApi.getState().report).toBe(saved);
  expect(result.current.report.view!.iq).toEqual(view.iq);
  expect(result.current.report.view!.notes).toEqual(view.notes);
  expect(result.current.report.view!.gates.data!.displayPercent).toBe(view.gates.data!.displayPercent);
  expect(result.current.report.view!.gates.data!.total).toBe(view.gates.data!.total);
  expect(result.current.report.view!.segments.data![0].iq).toBe(80);
  expect(result.current.report.view!.segments.data![0].explanations).toEqual(view.segments.data![0].explanations);
  expect(kind === "gates" ? result.current.report.view!.gates.data!.items.map(item => item.code)
    : result.current.report.view!.segments.data![0].cues.data!.map(item => item.code)).not.toContain(kind === "gates" ? "gate" : "cue");
  expect(result.current.stale).toBe(true);
  expect(iqStoreApi.getState()).toMatchObject({ etag: "inputs-after", reportEtag: "inputs-before" });
  expect(callbacks.onIqLoaded).toHaveBeenCalledOnce();
  expect(callbacks.onIqRefresh).not.toHaveBeenCalled();
  expect(callbacks.onIqAck).toHaveBeenCalledExactlyOnceWith(kind === "gates" ? "gate" : "cue");
  client.loadReport.mockRejectedValueOnce(new Error("Refresh failed"));
  await act(async () => result.current.report.refreshReport());
  expect(result.current.stale).toBe(true);
  expect(iqStoreApi.getState().report).toBe(saved);
  client.loadReport.mockResolvedValue({ ...resource, report: { ...resource.report, iq_doc: 100 },
    etag: "inputs-after", reportEtag: "inputs-after", acknowledgements: [{ code: kind === "gates" ? "gate" : "cue", status: "DISMISSED" }] });
  await act(async () => result.current.report.refreshReport());
  expect(client.loadReport).toHaveBeenLastCalledWith("token", "s", null);
  expect(result.current.stale).toBe(false);
  expect(result.current.report.view!.iq.data!.displayInt).toBe(100);
});

it("restores saved removals and freshness when reopening a report without generating it", async () => {
  const client = { ackGate: vi.fn(), ackCue: vi.fn(), loadReport: vi.fn().mockResolvedValue({ ...resource,
    etag: "inputs-after", acknowledgements: [{ code: "gate", status: "CLEARED" }, { code: "cue", status: "DISMISSED" }] }) };
  const { result } = renderHook(() => ({ report: useIqReport({ apiGatewayUrl: "x", authToken: "token", session: "s",
    callbacks: {}, retryLimit: 0, retryIntervalMs: 1, workerClient: client }), stale: useIqRefresh() }));
  await waitFor(() => expect(result.current.report.status).toBe("success"));
  expect(result.current.stale).toBe(true);
  expect(result.current.report.view!.gates.data!.items.map(item => item.code)).toEqual(["other"]);
  expect(result.current.report.view!.gates.data!.total).toBe(2);
  expect(result.current.report.view!.segments.data![0].cues.data).toEqual([]);
  expect(client.loadReport).toHaveBeenCalledExactlyOnceWith("token", "s", "");
});
