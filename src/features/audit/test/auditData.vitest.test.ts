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
import type { AuditFilters } from "../type/audit.types";

const rawReport = {
  gaps: [
    { solution: "REMOVE", explanation: "first", page: "2", owner: "user", timestamp: "2026-01-01T12:00:00Z", segment: "party" },
    { solution: "ADD", explanation: "second", page: "4", owner: "verification", timestamp: "2026-01-03T12:00:00Z", segment: "reference" },
    { solution: "UPDATE", explanation: "third", page: "1", owner: "Reprocess |", timestamp: "2026-01-02T12:00:00Z", segment: "party" },
    { solution: "CORRECTION", explanation: "raw object", page: "010", owner: "correction", timestamp: "2026-01-04T09:00:00Z", segment: null },
    { solution: "", explanation: "empty", page: "0", owner: "", timestamp: "", segment: null },
    { aspect: "ADD", changeType: "ADD", date: "2026-01-05T12:00:00Z", message: "legacy", page: 5, process: "verification" },
    null,
  ],
  usage: { costs: ["$1.50", 2] as const },
} as const;

describe("auditData", () => {
  it("normalizes GapEntry objects and sorts gaps", () => {
    expect(normalizeAuditReport(rawReport)).toEqual({
      gaps: [
        {
          solution: CHANGE_CORRECTION,
          explanation: "raw object",
          page: "010",
          owner: PROCESS_ENRICHMENT,
          timestamp: "2026-01-04T09:00:00Z",
          segment: null,
        },
        {
          solution: CHANGE_ADD,
          explanation: "second",
          page: "4",
          owner: PROCESS_VERIFICATION,
          timestamp: "2026-01-03T12:00:00Z",
          segment: "reference",
        },
        {
          solution: CHANGE_CORRECTION,
          explanation: "third",
          page: "1",
          owner: PROCESS_REPROCESS,
          timestamp: "2026-01-02T12:00:00Z",
          segment: "party",
        },
        {
          solution: CHANGE_REMOVE,
          explanation: "first",
          page: "2",
          owner: PROCESS_USER,
          timestamp: "2026-01-01T12:00:00Z",
          segment: "party",
        },
        {
          solution: PROCESS_OTHER,
          explanation: "empty",
          page: "0",
          owner: PROCESS_OTHER,
          timestamp: "",
          segment: null,
        },
      ],
      usage: { costs: ["$1.50", "2"] },
    });
  });

  it("rejects obsolete audit entry shapes", () => {
    expect(normalizeAuditReport({
      gaps: [
        ["ADD", "legacy array", "1", "verification", "2026-01-01T12:00:00Z", "ADD"],
        { aspect: "ADD", changeType: "ADD", date: "2026-01-01T12:00:00Z", message: "legacy object", page: 1, process: "verification" },
        { solution: "", explanation: "", page: "", owner: "", timestamp: "", segment: null },
      ],
    })).toEqual({ gaps: [] });
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
