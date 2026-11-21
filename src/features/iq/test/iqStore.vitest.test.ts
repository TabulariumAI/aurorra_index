import { beforeEach, describe, expect, it } from "vitest";
import { iqStoreApi } from "../store/iqStore";
import type { IqReport } from "../type/iq.types";

const report: IqReport = {
  iq_doc: 90,
  gates: [
    { code: "gate-1", status: "FAIL", description: "Fail" },
    { code: "gate-2", status: "PASS", description: "Pass" },
  ],
  segments: [],
  notes: [],
};

describe("iqStore", () => {
  beforeEach(() => {
    iqStoreApi.getState().resetIq();
  });

  it("sets loading and refreshing while preserving report", () => {
    iqStoreApi.getState().setLoaded("session-1", report, "");
    iqStoreApi.getState().setLoading("session-1", false);
    expect(iqStoreApi.getState()).toMatchObject({ activeSession: "session-1", error: null, report, status: "loading" });

    iqStoreApi.getState().setLoading("session-1", true);
    expect(iqStoreApi.getState()).toMatchObject({ activeSession: "session-1", error: null, report, status: "refreshing" });
    iqStoreApi.getState().setLoading("session-2", false);
    expect(iqStoreApi.getState()).toMatchObject({ activeSession: "session-2", report: null, metadataEtag: null });
  });

  it("sets loaded and error states", () => {
    iqStoreApi.getState().setLoaded("session-1", report, "");
    expect(iqStoreApi.getState()).toMatchObject({ activeSession: "session-1", error: null, report, status: "success" });

    iqStoreApi.getState().setError({ code: "x", error: "failed", status: 500 });
    expect(iqStoreApi.getState()).toMatchObject({ error: { code: "x", error: "failed", status: 500 }, report, status: "error" });
  });

  it("versions displayed reports without locally removing compliance entries", () => {
    iqStoreApi.getState().setLoaded("session-1", report, "");
    const generation = iqStoreApi.getState().reportGeneration;
    iqStoreApi.getState().setLoading("session-1", true);
    expect(iqStoreApi.getState().reportGeneration).toBeGreaterThan(generation);
    expect(iqStoreApi.getState().report).toBe(report);
  });

  it("resets to initial state", () => {
    iqStoreApi.getState().setLoaded("session-1", report, "");
    const generation = iqStoreApi.getState().generation;
    iqStoreApi.getState().resetIq();
    expect(iqStoreApi.getState().generation).toBe(generation + 1);
    expect(iqStoreApi.getState()).toMatchObject({
      activeSession: null,
      error: null,
      report: null,
      status: "idle",
    });
  });
});
