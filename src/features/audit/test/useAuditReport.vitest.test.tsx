import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { auditStoreApi } from "../store/auditStore";
import { useAuditReport } from "../hook/useAuditReport";
import type { AuditReport, AuditWorkerClient, AuditWorkerError } from "../type/audit.types";

const report: AuditReport = {
  gaps: [
    {
      solution: "ADD",
      explanation: "added row",
      page: "1",
      owner: "VERIFICATION",
      timestamp: "2026-01-03T12:00:00Z",
      segment: "party",
    },
  ],
};

function createClient(): AuditWorkerClient {
  return {
    loadReport: vi.fn(async () => report),
  };
}


describe("useAuditReport", () => {
  beforeEach(() => {
    auditStoreApi.getState().resetAudit();
  });

  it("loads report on mount and calls onAuditLoaded", async () => {
    const client = createClient();
    const callbacks = { onAuditLoaded: vi.fn() };

    renderHook(() =>
      useAuditReport({
        onResource: vi.fn(),
        apiGatewayUrl: "https://api",
        authToken: "token",
        callbacks,

        retryLimit: 5,
        retryIntervalMs: 0,
        session: "session-1",
        workerClient: client,
      }),
    );

    await waitFor(() => expect(client.loadReport).toHaveBeenCalledWith("token", "session-1"));
    expect(auditStoreApi.getState().report).toEqual(report);
    expect(callbacks.onAuditLoaded).toHaveBeenCalledWith(report);
    expect(auditStoreApi.getState().status).toBe("success");
  });

  it("reports errors and sets store state", async () => {
    const client = createClient();
    const error: AuditWorkerError = { code: "load_error", status: 500, error: "load failed" };
    vi.mocked(client.loadReport).mockRejectedValueOnce(error);
    const callbacks = { onAuditError: vi.fn() };

    renderHook(() =>
      useAuditReport({
        onResource: vi.fn(),
        apiGatewayUrl: "https://api",
        authToken: "token",
        callbacks,

        retryLimit: 5,
        retryIntervalMs: 0,
        session: "session-1",
        workerClient: client,
      }),
    );

    await waitFor(() => expect(callbacks.onAuditError).toHaveBeenCalledWith(error));
    expect(auditStoreApi.getState().error).toEqual(error);
    expect(auditStoreApi.getState().status).toBe("error");
  });

  it("calls onAuditCanceled on unmount", async () => {
    const client = createClient();
    const callbacks = { onAuditCanceled: vi.fn() };
    const { unmount } = renderHook(() =>
      useAuditReport({
        onResource: vi.fn(),
        apiGatewayUrl: "https://api",
        authToken: "token",
        callbacks,

        retryLimit: 5,
        retryIntervalMs: 0,
        session: "session-1",
        workerClient: client,
      }),
    );

    await waitFor(() => expect(client.loadReport).toHaveBeenCalledTimes(1));
    unmount();
    expect(callbacks.onAuditCanceled).toHaveBeenCalledTimes(1);
  });
});

it("requests the latest audit when reopened even with an existing report", async () => {
  const client = createClient();
  const props = { onResource: vi.fn(), apiGatewayUrl: "https://api", authToken: "token", callbacks: {}, retryLimit: 5, retryIntervalMs: 0, session: "s", workerClient: client };
  auditStoreApi.getState().setLoaded("s", { gaps: [] });
  const view = renderHook(() => useAuditReport(props));
  await waitFor(() => expect(client.loadReport).toHaveBeenCalledTimes(1));
  view.unmount();
  renderHook(() => useAuditReport(props));
  await waitFor(() => expect(client.loadReport).toHaveBeenCalledTimes(2));
});

it("does not publish a late audit or error after the owner resets", async () => {
  for (const fail of [false, true]) {
    let finish!: () => void;
    const client: AuditWorkerClient = { loadReport: vi.fn(() => new Promise<AuditReport>((resolve, reject) => {
      finish = () => fail ? reject(new Error("Old owner")) : resolve(report);
    })) };
    const callbacks = { onAuditLoaded: vi.fn(), onAuditError: vi.fn() };
    const view = renderHook(() => useAuditReport({ onResource: vi.fn(), apiGatewayUrl: "https://api", authToken: "old-token", callbacks, retryLimit: 5, retryIntervalMs: 0, session: "old", workerClient: client }));
    await waitFor(() => expect(client.loadReport).toHaveBeenCalledOnce());
    auditStoreApi.getState().resetAudit();
    finish();
    await Promise.resolve();
    await Promise.resolve();
    expect(auditStoreApi.getState().report).toBeNull();
    expect(auditStoreApi.getState().error).toBeNull();
    expect(callbacks.onAuditLoaded).not.toHaveBeenCalled();
    expect(callbacks.onAuditError).not.toHaveBeenCalled();
    view.unmount();
  }
});

it("never renders another session's report or error while the requested report is pending", async () => {
  auditStoreApi.getState().resetAudit();
  auditStoreApi.getState().setLoaded("previous", report);
  auditStoreApi.getState().setError({ error: "Previous session failed" });
  let resolve!: (report: AuditReport) => void;
  const client: AuditWorkerClient = { loadReport: vi.fn(() => new Promise<AuditReport>(done => { resolve = done; })) };
  const seen: Array<{ report: AuditReport | null; error: AuditWorkerError | null }> = [];
  const view = renderHook(() => {
    const state = useAuditReport({ onResource: vi.fn(), apiGatewayUrl: "https://api", authToken: "token", callbacks: {},
      retryLimit: 5, retryIntervalMs: 0, session: "next", workerClient: client });
    seen.push({ report: state.report, error: state.error });
    return state;
  });
  expect(seen.every(state => state.report === null && state.error === null)).toBe(true);
  const next: AuditReport = { gaps: [] };
  await act(async () => resolve(next));
  expect(view.result.current.report).toBe(next);
  expect(auditStoreApi.getState().reportsBySession.previous).toBe(report);
});
