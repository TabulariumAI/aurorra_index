import { beforeEach, describe, expect, it } from "vitest";
import { iqStoreApi } from "../store/iqStore";
import type { IqReport } from "../type/iq.types";

const report: IqReport = {
  iq_doc: 90,
  decision: "Review",
  gates: [
    { code: "gate-1", status: "FAIL", description: "Fail" },
    { code: "gate-2", status: "PASS", description: "Pass" },
  ],
  segments: [],
  explanation: [],
};

describe("iqStore", () => {
  beforeEach(() => {
    iqStoreApi.getState().resetIq();
  });

  it("sets loading and refreshing while preserving report", () => {
    iqStoreApi.getState().setLoaded("session-1", report);
    iqStoreApi.getState().setLoading("session-2");
    expect(iqStoreApi.getState()).toMatchObject({ activeSession: "session-2", error: null, report, status: "loading" });

    iqStoreApi.getState().setRefreshing("session-3");
    expect(iqStoreApi.getState()).toMatchObject({ activeSession: "session-3", error: null, report, status: "refreshing" });
  });

  it("sets loaded and error states", () => {
    iqStoreApi.getState().setLoaded("session-1", report);
    expect(iqStoreApi.getState()).toMatchObject({ activeSession: "session-1", error: null, report, status: "success" });

    iqStoreApi.getState().setError({ code: "x", error: "failed", status: 500 });
    expect(iqStoreApi.getState()).toMatchObject({ error: { code: "x", error: "failed", status: 500 }, report, status: "error" });
  });

  it("queues refreshes for the requested session", () => {
    iqStoreApi.getState().refreshIq("session-1");
    iqStoreApi.getState().refreshIq("session-2");

    expect(iqStoreApi.getState()).toMatchObject({
      refresh: { id: 2, session: "session-2" },
      refreshId: 2,
    });
  });

  it("tracks acking gates and removes acknowledged gates", () => {
    iqStoreApi.getState().setLoaded("session-1", report);
    iqStoreApi.getState().ackStart("gate-1");
    expect(iqStoreApi.getState().ackingCodes.has("gate-1")).toBe(true);

    iqStoreApi.getState().ackSuccess("gate-1");
    expect(iqStoreApi.getState().ackingCodes.has("gate-1")).toBe(false);
    expect(iqStoreApi.getState().report?.gates.map((gate) => gate.code)).toEqual(["gate-2"]);
  });

  it("resets to initial state", () => {
    iqStoreApi.getState().setLoaded("session-1", report);
    iqStoreApi.getState().ackStart("gate-1");
    iqStoreApi.getState().resetIq();
    expect(iqStoreApi.getState()).toMatchObject({
      activeSession: null,
      error: null,
      refresh: null,
      refreshId: 0,
      report: null,
      status: "idle",
    });
    expect(iqStoreApi.getState().ackingCodes.size).toBe(0);
  });
});
