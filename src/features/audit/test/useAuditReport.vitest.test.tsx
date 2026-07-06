import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { auditStoreApi } from "../store/auditStore";
import { useAuditReport } from "../hook/useAuditReport";
import type { AuditReport, AuditWorkerClient, AuditWorkerError } from "../type/audit.types";

const report: AuditReport = {
  gaps: [
    {
      aspect: "ADD",
      changeType: "ADD",
      date: "2026-01-03T12:00:00Z",
      message: "added row",
      page: 1,
      process: "VERIFICATION",
    },
  ],
};

function createClient(): AuditWorkerClient {
  return {
    loadReport: vi.fn(async () => report),
  };
}

const previewAction = <button type="button">Close preview</button>;

describe("useAuditReport", () => {
  beforeEach(() => {
    auditStoreApi.getState().resetAudit();
  });

  it("loads report on mount and calls onAuditLoaded", async () => {
    const client = createClient();
    const callbacks = { onAuditLoaded: vi.fn() };

    renderHook(() =>
      useAuditReport({
        apiGatewayUrl: "https://api",
        authToken: "token",
        callbacks,
        previewAction,
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
        apiGatewayUrl: "https://api",
        authToken: "token",
        callbacks,
        previewAction,
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
        apiGatewayUrl: "https://api",
        authToken: "token",
        callbacks,
        previewAction,
        session: "session-1",
        workerClient: client,
      }),
    );

    await waitFor(() => expect(client.loadReport).toHaveBeenCalledTimes(1));
    unmount();
    expect(callbacks.onAuditCanceled).toHaveBeenCalledTimes(1);
  });
});
