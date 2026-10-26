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
import { auditGap, auditPatch } from "./auditFixture";

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
  it.each(["add", "update", "remove", "confirm"])("preserves %s patch details through normalization and view mapping", (solution) => {
    const patch = { ...auditPatch, solution, code: "index-1", field: "value",
      identifier: { value: "2025-999", label: "Old label", aspect: "instrument_number" } };
    const raw = { gaps: [{ ...auditGap, solution, patch }] };
    const report = normalizeAuditReport(raw);
    expect(report.gaps[0].patch).toEqual(patch);
    const view = prepareAuditReport(report, { changeType: "", process: "", segment: "" }, ["party", "reference", "transaction"]);
    expect(view.gaps[0].patch).toEqual(patch);
    expect(view.gaps[0].segment).toBe("transaction");
    expect(view.gaps[0].page).toBe("7");
    expect(view.gaps[0].message).toBe("Index created by user.");
  });

  it("keeps entries without patch details without inventing them", () => {
    const { patch, ...gap } = auditGap;
    const view = prepareAuditReport({ gaps: [gap] }, { changeType: "", process: "", segment: "" }, ["party", "reference", "transaction"]);
    expect(view.gaps).toHaveLength(1);
    expect(view.gaps[0].patch).toBeUndefined();
    expect(view.gaps[0].message).toBe(gap.explanation);
  });

  it.each(["bad", { ...auditPatch, value: 123 }, { ...auditPatch, identifier: { value: 123 } }])("rejects invalid patch details without coercing values", (patch) => {
    expect(normalizeAuditReport({ gaps: [{ ...auditGap, patch }] }).gaps).toEqual([]);
  });
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
    const view = prepareAuditReport(rawReport, { changeType: CHANGE_REMOVE, process: "", segment: "" } as AuditFilters, ["party", "reference", "transaction"]);
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
    const view = prepareAuditReport(rawReport, { changeType: "", process: PROCESS_REPROCESS, segment: "" } as AuditFilters, ["party", "reference", "transaction"]);
    expect(view.filtered).toBe(1);
    expect(view.gaps[0]?.aspectLabel).toBe("Correction");
  });
  it("combines all three filters and counts each facet under the other filters", () => {
    const view = prepareAuditReport(rawReport, { changeType: CHANGE_CORRECTION, process: "", segment: "party" }, ["party", "reference", "transaction"]);
    expect(view.gaps.map(gap => gap.message)).toEqual(["third"]);
    expect(view.total).toBe(5);
    expect(view.filtered).toBe(1);
    expect(view.changeCounts).toEqual({ add: 0, correction: 1, other: 0, remove: 1 });
    expect(view.processCounts).toEqual({ enrichment: 0, other: 0, reprocess: 1, user: 0, verification: 0 });
    expect(view.segmentCounts).toEqual({ party: 1, reference: 0, transaction: 0 });
    expect(view.segmentTotal).toBe(2);
    const combined = prepareAuditReport(rawReport, { changeType: CHANGE_CORRECTION, process: PROCESS_ENRICHMENT, segment: "party" }, ["party", "reference"]);
    expect(combined.gaps).toEqual([]);
    expect(combined.segmentTotal).toBe(1);
    expect(combined.segmentCounts).toEqual({ party: 0, reference: 0 });
  });

  it("keeps records without segments under All and never invents catalog options", () => {
    const all = prepareAuditReport(rawReport, { changeType: "", process: "", segment: "" }, ["party", "reference", "transaction"]);
    expect(all.filtered).toBe(5);
    expect(all.segmentTotal).toBe(5);
    expect(all.segmentCounts).toEqual({ party: 2, reference: 1, transaction: 0 });
    const empty = prepareAuditReport({ gaps: [] }, { changeType: "", process: "", segment: "" }, ["transaction"]);
    expect(empty.segmentCounts).toEqual({ transaction: 0 });
    expect(empty.segmentTotal).toBe(0);
  });

});

const service = { name: "extraction", code: "38584236-3b7b-425e-a1b7-e28e1382b326", cost: 2.75, time: 1.25, page_num: 3, timestamp: "2026-10-08T23:45:12Z" };
it.each([{ services: [service] }, { costs: null, services: [service] }, { costs: ["$2.7500"], services: [service] }])("preserves audit usage services without requiring costs", usage => {
  const report = normalizeAuditReport({ gaps: [auditGap], usage });
  expect(report.usage).toEqual({ services: [service] });
  expect(report.usage?.services).toEqual([service]);
  expect(normalizeAuditReport(report)).toEqual(report);
  expect(prepareAuditReport(report, { changeType: "", process: "", segment: "" }, ["transaction"]).gaps[0].patch).toEqual(auditPatch);
});
