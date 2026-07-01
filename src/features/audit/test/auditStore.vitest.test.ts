import { beforeEach, describe, expect, it } from "vitest";
import { auditStoreApi } from "../store/auditStore";
import type { AuditReport } from "../type/audit.types";

const report: AuditReport = {
  gaps: [
    {
      aspect: "file",
      changeType: "ADD",
      date: "2026-01-01",
      message: "added",
      page: 1,
      process: "VERIFICATION",
    },
  ],
};

describe("auditStore", () => {
  beforeEach(() => {
    auditStoreApi.getState().resetAudit();
  });

  it("sets loading and refreshing while preserving report", () => {
    auditStoreApi.getState().setLoaded("session-1", report);
    auditStoreApi.getState().setLoading("session-2");
    expect(auditStoreApi.getState()).toMatchObject({ activeSession: "session-2", error: null, report, status: "loading" });

    auditStoreApi.getState().setRefreshing("session-3");
    expect(auditStoreApi.getState()).toMatchObject({
      activeSession: "session-3",
      error: null,
      report,
      status: "refreshing",
    });
  });

  it("sets loaded and error states", () => {
    auditStoreApi.getState().setLoaded("session-1", report);
    expect(auditStoreApi.getState()).toMatchObject({
      activeSession: "session-1",
      error: null,
      report,
      status: "success",
    });

    auditStoreApi.getState().setError({ code: "x", error: "failed", status: 500 });
    expect(auditStoreApi.getState()).toMatchObject({
      error: { code: "x", error: "failed", status: 500 },
      report,
      status: "error",
    });
  });

  it("resets to initial state", () => {
    auditStoreApi.getState().setLoaded("session-1", report);
    auditStoreApi.getState().setRefreshing("session-1");
    auditStoreApi.getState().resetAudit();
    expect(auditStoreApi.getState()).toMatchObject({
      activeSession: null,
      error: null,
      report: null,
      status: "idle",
    });
  });
});
