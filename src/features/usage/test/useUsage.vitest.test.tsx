import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { useUsage } from "../hook/useUsage";
import { storeApi } from "../../../store/state/store";
import { auditStoreApi } from "../../audit/store/auditStore";
import { splitMetadataJSON } from "aurora-core";

const workers: WorkerMock[] = [];
class WorkerMock {
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: ErrorEvent) => void) | null = null;
  postMessage = vi.fn();
  terminate = vi.fn();
  constructor() { workers.push(this); }
}
const service = { code: "a", name: "extraction" as const, cost: 11, page_num: 1, timestamp: "2026-10-01T00:00:00Z" };

beforeEach(() => {
  workers.length = 0;
  storeApi.getState().resetJSON();
  auditStoreApi.getState().resetAudit();
  vi.stubGlobal("Worker", WorkerMock);
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.useRealTimers(); });

it("ingests loaded audit on startup and later store updates while the dialog is closed", async () => {
  auditStoreApi.getState().setLoaded("s", { gaps: [], usage: { services: [service] } });
  const { result } = renderHook(() => useUsage("owner"));
  expect(workers[0].postMessage).toHaveBeenCalledWith(expect.objectContaining({ owner: "owner", services: [{ ...service, session: "s" }] }));
  act(() => workers[0].onmessage?.({ data: { ok: true, data: [{ ...service, session: "s" }] } } as MessageEvent));
  await waitFor(() => expect(result.current.records).toEqual([{ ...service, session: "s" }]));
  act(() => auditStoreApi.getState().setLoaded("s", { gaps: [], usage: { services: [service, { ...service, code: "b" }] } }));
  act(() => auditStoreApi.getState().setLoading("other", true));
  act(() => auditStoreApi.getState().setLoaded("other", { gaps: [], usage: { services: [{ ...service, code: "c" }] } }));
  expect(workers[0].postMessage.mock.lastCall?.[0].services).toEqual([
    { ...service, code: "c", session: "other" },
  ]);
});

it("terminates the worker, cancels scheduling, and hides old-owner data on scope change", async () => {
  const { result, rerender, unmount } = renderHook(({ owner }) => useUsage(owner), { initialProps: { owner: "one" as string | null } });
  act(() => workers[0].onmessage?.({ data: { ok: true, data: [{ ...service, session: "s" }] } } as MessageEvent));
  rerender({ owner: "two" });
  expect(workers[0].terminate).toHaveBeenCalledOnce();
  expect(result.current.records).toEqual([]);
  act(() => workers[0].onmessage?.({ data: { ok: true, data: [{ ...service, session: "s" }] } } as MessageEvent));
  expect(result.current.records).toEqual([]);
  unmount();
  expect(workers[1].terminate).toHaveBeenCalledOnce();
  const count = workers[1].postMessage.mock.calls.length;
  auditStoreApi.getState().setLoaded("s", { gaps: [] });
  expect(workers[1].postMessage.mock.calls).toHaveLength(count);
});

it("runs cleanup at the UTC month boundary without an audit update", () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-10-31T23:59:59Z"));
  const { unmount } = renderHook(() => useUsage("owner"));
  act(() => vi.advanceTimersByTime(1000));
  expect(workers[0].postMessage).toHaveBeenCalledTimes(2);
  expect(workers[0].postMessage.mock.lastCall?.[0].now).toBe(Date.parse("2026-11-01T00:00:00Z"));
  unmount();
  act(() => vi.advanceTimersByTime(31 * 86400000));
  expect(workers[0].postMessage).toHaveBeenCalledTimes(2);
});

it("reports worker failures and does not start a job without an owner", () => {
  const { result, rerender } = renderHook(({ owner }) => useUsage(owner), { initialProps: { owner: null as string | null } });
  expect(workers).toHaveLength(0);
  rerender({ owner: "owner" });
  const event = new ErrorEvent("error", { message: "Usage database unavailable", error: new Error("Usage database unavailable") });
  act(() => workers[0].onerror?.(event));
  expect(result.current.error).toBe(event);
});

it("ignores metadata updates and leaves stored usage intact when audit loading fails", () => {
  renderHook(() => useUsage("owner"));
  const count = workers[0].postMessage.mock.calls.length;
  act(() => storeApi.getState().setJSON("s", splitMetadataJSON({ heading: { title: "NOTICE" } })));
  act(() => auditStoreApi.getState().setError({ error: "Audit unavailable" }));
  expect(workers[0].postMessage).toHaveBeenCalledTimes(count);
});
