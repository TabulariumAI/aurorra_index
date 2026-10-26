import { beforeEach, describe, expect, it } from "vitest";
import { auditStoreApi } from "../store/auditStore";
import type { AuditReport } from "../type/audit.types";

const report: AuditReport = {
  gaps: [
    {
      solution: "ADD",
      explanation: "added",
      page: "1",
      owner: "VERIFICATION",
      timestamp: "2026-01-01",
      segment: null,
    },
  ],
};

describe("auditStore", () => {
  beforeEach(() => {
    auditStoreApi.getState().resetAudit();
  });

  it("preserves only the requested session's report while loading and refreshing", () => {
    auditStoreApi.getState().setLoaded("session-1", report);
    auditStoreApi.getState().setLoading("session-1", false);
    expect(auditStoreApi.getState().report).toBe(report);
    auditStoreApi.getState().setLoading("session-2", false);
    expect(auditStoreApi.getState()).toMatchObject({ activeSession: "session-2", error: null, report: null, status: "loading" });

    auditStoreApi.getState().setRefreshing("session-3");
    expect(auditStoreApi.getState()).toMatchObject({
      activeSession: "session-3",
      error: null,
      report: null,
      status: "refreshing",
    });
    auditStoreApi.getState().setRefreshing("session-1");
    expect(auditStoreApi.getState().report).toBe(report);
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

it("keeps background audits available to usage without replacing the open session", () => {
  auditStoreApi.getState().setLoading("open", false);
  auditStoreApi.getState().setLoaded("background", report);
  expect(auditStoreApi.getState()).toMatchObject({ activeSession: "open", report: null, status: "loading" });
  expect(auditStoreApi.getState().reportsBySession.background).toEqual(report);
  auditStoreApi.getState().setLoaded("open", { gaps: [] });
  expect(auditStoreApi.getState().reportsBySession).toEqual({ background: report, open: { gaps: [] } });
  auditStoreApi.getState().resetAudit();
  expect(auditStoreApi.getState().reportsBySession).toEqual({});
});
