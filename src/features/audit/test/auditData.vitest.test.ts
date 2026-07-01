import { describe, expect, it } from "vitest";
import {
  CHANGE_ADD,
  CHANGE_CORRECTION,
  CHANGE_REMOVE,
  normalizeAuditReport,
  PROCESS_ENRICHMENT,
  PROCESS_REPROCESS,
  PROCESS_OTHER,
  PROCESS_USER,
  PROCESS_VERIFICATION,
  prepareAuditReport,
} from "../data/auditData";
import type { AuditFilters, AuditReport } from "../type/audit.types";

const rawReport = {
  gaps: [
    { aspect: "Beta", message: "first", page: 2, process: "user", date: "2026-01-01T12:00:00Z", changeType: "REMOVE" },
    { aspect: "Alpha", message: "second", page: 4, process: "verification", date: "2026-01-03T12:00:00Z", changeType: "ADD" },
    { aspect: "Gamma", message: "third", page: 1, process: "Reprocess |", date: "2026-01-02T12:00:00Z", changeType: "UPDATE" },
    ["Alpha", "raw array", "10", "correction", "2026-01-04T09:00:00Z", "CORRECTION"],
    [null, "empty", "", "", "", ""],
    null,
  ],
  usage: { costs: ["$1.50", 2] as const },
} as const;

describe("auditData", () => {
  it("normalizes arrays and objects and sorts gaps", () => {
    expect(normalizeAuditReport(rawReport)).toEqual({
      gaps: [
        {
          aspect: "Alpha",
          message: "raw array",
          page: 10,
          process: PROCESS_ENRICHMENT,
          date: "2026-01-04T09:00:00Z",
          changeType: "CORRECTION",
        },
        {
          aspect: "Alpha",
          message: "second",
          page: 4,
          process: PROCESS_VERIFICATION,
          date: "2026-01-03T12:00:00Z",
          changeType: CHANGE_ADD,
        },
        {
          aspect: "Gamma",
          message: "third",
          page: 1,
          process: PROCESS_REPROCESS,
          date: "2026-01-02T12:00:00Z",
          changeType: CHANGE_CORRECTION,
        },
      {
        aspect: "Beta",
        message: "first",
        page: 2,
        process: PROCESS_USER,
        date: "2026-01-01T12:00:00Z",
        changeType: CHANGE_REMOVE,
      },
      {
        aspect: "",
        message: "empty",
        page: 0,
        process: PROCESS_OTHER,
        date: "",
        changeType: PROCESS_OTHER,
      },
    ],
      usage: { costs: ["$1.50", "2"] },
    });
  });

  it("computes filtered counts and visible rows", () => {
    const view = prepareAuditReport(rawReport, { changeType: CHANGE_REMOVE, process: "" } as AuditFilters);
    expect(view.filtered).toBe(1);
    expect(view.total).toBe(5);
    expect(view.changeCounts).toEqual({
      add: 1,
      correction: 2,
      other: 1,
      remove: 1,
    });
    expect(view.processCounts).toEqual({
      enrichment: 0,
      other: 0,
      reprocess: 0,
      user: 1,
      verification: 0,
    });
    expect(view.gaps).toMatchObject([{ aspectLabel: "Remove" }]);
  });

  it("supports process-only filtering", () => {
    const view = prepareAuditReport(rawReport, { changeType: "", process: PROCESS_REPROCESS } as AuditFilters);
    expect(view.filtered).toBe(1);
    expect(view.gaps[0]?.aspectLabel).toBe("Correction");
  });
});
