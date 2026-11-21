import { describe, expect, it, vi } from "vitest";
import { prepareIqReport, normalizeIqReport } from "../data/iqData";
import type { IqReportView } from "../type/iq.types";

describe("iqData", () => {
  it("normalizes IQ score buckets and bounds", () => {
    expect(prepareIqReport({ iq_doc: 90 }).iq.data).toMatchObject({ displayInt: 90, bucket: "amber" });
    expect(prepareIqReport({ iq_doc: 97 }).iq.data!.bucket).toBe("green");
    expect(prepareIqReport({ iq_doc: 81 }).iq.data!.bucket).toBe("red");
    expect(prepareIqReport({ iq_doc: -10 }).iq.data!.value).toBe(0);
    expect(prepareIqReport({ iq_doc: 110 }).iq.data!.value).toBe(100);
  });

  it("computes gate percentages", () => {
    const mixed = prepareIqReport({
      gates: [
        { code: "pass", status: "PASS", description: "pass" },
        { code: "fail", status: "FAIL", description: "fail" },
      ],
    });
    expect(mixed.gates.data!.displayPercent).toBe(50);
  });

  it("filters unknown gates and formats segments", () => {
    const view = prepareIqReport({
      gates: [
        { code: "pass", status: "PASS", description: "pass" },
        { code: "other", status: "OTHER", description: "hidden" },
      ],
      segments: [
        { cues: [], segment_name: "party", expected_weight: 1, actual_weight: 2, iq: 3, explanations: [1] },
      ],
    });

    expect(view.gates.data!.items).toHaveLength(1);
    expect(view.gates.data!.items[0].code).toBe("pass");
    expect(view.segments.data![0].displayId).toBe("Party");
    expect(view.segments.data![0].explanations.data).toEqual(["1"]);
  });

  it("omits decisions and report explanations from the normalized contract", () => {
    const report = normalizeIqReport({ iq_doc: 90, notes: [{ segment: null, message: "Existing note" }, { segment: null, message: "Missing effective date" }, { segment: null, message: "Missing loan number" }], gates: [], segments: [] });
    expect(Object.keys(report).sort()).toEqual(["gates", "iq_doc", "notes", "segments"]);
    const view = prepareIqReport(report);
    expect(view.iq.data).not.toHaveProperty("decision");
    expect(view.gates.data).not.toHaveProperty("decision");
  });

  it("uses the approved message for older reports without descriptions", () => {
    const view = prepareIqReport({
      gates: [
        {
          code: "generic-fail",
          status: "FAIL",
          kind: "Generic",
          human_expr: "coalesce(person,0) >= 1",
          bindings: [],
          combinations_tested: 0,
        },
        {
          code: "missing",
          status: "FAIL",
          kind: "MissingIndexes",
          fields: ["party_address", "legal_description"],
        },
      ],
    });

    expect(view.gates.data!.items[0].description).toBe("Detailed values are unavailable for this saved result.");
    expect(view.gates.data!.items[1].description).toBe("Detailed values are unavailable for this saved result.");
  });

  it("does not stringify missing gate descriptions", () => {
    const report = normalizeIqReport({
      gates: [{ code: "gate-1", status: "FAIL" }],
    });

    expect(report.gates[0].description).toBe("Detailed values are unavailable for this saved result.");
    expect(prepareIqReport(report).gates.data!.items[0].description).toBe("Detailed values are unavailable for this saved result.");
  });

  it("preserves service descriptions and gate identity for both report shapes", () => {
    const description = "Effective Date must be on or after Acknowledgment Date. The available dates do not satisfy this requirement. Effective Date is unavailable. One acknowledgment-date entry was found.";
    for (const extra of [{}, { kind: "Generic", human_expr: "wrong >= expression", bindings: [{ field: "acknowledgment_date", value: "1" }] }]) {
      const report = normalizeIqReport({ gates: [{ ...extra, code: "date-gate", status: "FAIL", description }] });
      expect(report.gates).toEqual([{ code: "date-gate", status: "FAIL", description }]);
      expect(prepareIqReport(report).gates.data!.items[0]).toMatchObject({ code: "date-gate", description, isFailure: true });
    }
  });

  it("does not replace an explicit empty service description", () => {
    expect(normalizeIqReport({ gates: [{ code: "empty", status: "INFO", description: "" }] }).gates[0].description).toBe("");
  });

  it("keeps service notes separate from gate metrics without mutating the report", () => {
    const raw = {
      gates: [
        { code: "pass", status: "PASS", description: "Passed requirement" },
        { code: "fail", status: "FAIL", description: "Failed requirement" },
        { code: "unknown", status: "OTHER", description: "Unknown status" },
      ],
      notes: [{ segment: null, message: "Existing note" }, { segment: null, message: "Missing effective date" }, { segment: null, message: "Missing loan number" }],
    };
    const original = structuredClone(raw);
    const view = prepareIqReport(raw);
    expect(view.gates.data!.items.map(gate => gate.code)).toEqual(["pass", "fail"]);
    expect(view.gates.data).toMatchObject({ total: 2, success: 1, ratio: 50, displayPercent: 50, bucket: "red" });
    expect(view.notes.data).toEqual(raw.notes.map(note => ({ ...note, status: "neutral" })));
    expect(raw).toEqual(original);
  });

  it("prepares notes-only reports with no gates", () => {
    const view = prepareIqReport({ gates: [], notes: [{ segment: null, message: "Missing address" }] });
    expect(view.gates.data).toMatchObject({ items: [], total: 0, success: 0, ratio: 0, displayPercent: 0 });
    expect(view.notes.data).toEqual([{ segment: null, message: "Missing address", status: "neutral" }]);
  });

  it.each([
    "Compliance gates: satisfied (1 / 1).",
    "Compliance gates: not satisfied (0 / 1).",
    "Indexing quality: complete and consistent.",
    "Indexing quality needing attention: Party.",
  ])("excludes the summary note %s from prepared data only", message => {
    const raw = { notes: [{ segment: null, message }, { segment: null, message: "Retained note" }] };
    expect(prepareIqReport(raw).notes).toEqual({ data: [{ segment: null, message: "Retained note", status: "neutral" }], error: null });
    expect(normalizeIqReport(raw).notes).toEqual([{ segment: null, message }, { segment: null, message: "Retained note" }]);
    expect(raw.notes).toEqual([{ segment: null, message }, { segment: null, message: "Retained note" }]);
  });

  it.each([
    ["Unclassified indexes: Satisfied (0/20)", "success"],
    ["Unclassified indexes: Optimal (1/20)", "success"],
    ["Unclassified indexes: Needs Attention (3/20)", "warning"],
    ["Unclassified indexes: High Risk (8/20)", "warning"],
    ["Unclassified indexes: Critical (0/0)", "warning"],
    ["Missing indexes.", "warning"],
    ["Missing indexes: Satisfied", "warning"],
    ["Missing indexes: Optimal", "warning"],
    ["Required indexes were not confirmed: Reference Instrument.", "neutral"],
    ["Required indexes were not confirmed: Person.", "neutral"],
    ["No Compliance gates defined for this document class.", "neutral"],
    ["Party clause indexing quality is acceptable.", "neutral"],
    ["Missing address", "neutral"],
    ["Report note: Unclassified indexes: Optimal (1/20)", "neutral"],
  ])("classifies %s as %s without rewriting the message", (message, status) => {
    expect(prepareIqReport({ notes: [{ segment: null, message }] }).notes).toEqual({ data: [{ segment: null, message, status }], error: null });
  });

  it("retains note order and duplicates without affecting scores, gates, segments, or source data", () => {
    const raw = {
      iq_doc: 90,
      gates: [{ code: "fail", status: "FAIL", description: "Failed requirement" }],
      segments: [{ cues: [], segment_name: "party", expected_weight: 2, actual_weight: 1, iq: 50, explanations: ["Missing indexes: Person."] }],
      notes: [{ segment: null, message: "Neutral note" }, { segment: null, message: "Compliance gates: not satisfied (0 / 1)." }, { segment: null, message: "Unclassified indexes: Optimal (1/20)" }, { segment: null, message: "Missing indexes." }, { segment: null, message: "Indexing quality needing attention: Party." }, { segment: null, message: "Neutral note" }],
    };
    const original = structuredClone(raw);
    const view = prepareIqReport(raw);
    expect(view.notes.data).toEqual([
      { segment: null, message: "Neutral note", status: "neutral" },
      { segment: null, message: "Unclassified indexes: Optimal (1/20)", status: "success" },
      { segment: null, message: "Missing indexes.", status: "warning" },
      { segment: null, message: "Neutral note", status: "neutral" },
    ]);
    const withoutNotes = prepareIqReport({ ...raw, notes: [] });
    expect(view.iq).toEqual(withoutNotes.iq);
    expect(view.gates).toEqual(withoutNotes.gates);
    expect(view.segments).toEqual(withoutNotes.segments);
    expect(raw).toEqual(original);
  });

  it("returns an empty successful notes section when every note is excluded", () => {
    expect(prepareIqReport({ notes: [{ segment: null, message: "Compliance gates: satisfied (1 / 1)." }, { segment: null, message: "Indexing quality: complete and consistent." }] }).notes).toEqual({ data: [], error: null });
  });

  it("prepares gate labels and clear eligibility without interpreting service descriptions", () => {
    const view = prepareIqReport({ gates: ["PASS", "FAIL", "WARNING"].map(status => ({ code: status, status, description: `${status} literal && text` })) });
    expect(view.gates.data!.items.map(({ label, clearable, description }) => ({ label, clearable, description }))).toEqual([
      { label: "PASS", clearable: false, description: "PASS literal && text" },
      { label: "FAIL", clearable: true, description: "FAIL literal && text" },
      { label: "WARNING", clearable: true, description: "WARNING literal && text" },
    ]);
    expect(view.gates.data).toMatchObject({ total: 3, success: 2, displayPercent: 67 });
  });

  it("sorts prepared segments by descending expected weight with stable ties without mutating JSON", () => {
    const raw = { segments: [
      { cues: [], segment_name: "party", expected_weight: 6, actual_weight: 5, iq: 90, explanations: [] },
      { cues: [], segment_name: "sides", expected_weight: 12, actual_weight: 12, iq: 100, explanations: [] },
      { cues: [], segment_name: "legal", expected_weight: 6, actual_weight: 0, iq: 0, explanations: [] },
    ] };
    const original = structuredClone(raw);
    expect(prepareIqReport(raw).segments.data!.map(segment => segment.id)).toEqual(["sides", "party", "legal"]);
    expect(raw).toEqual(original);
  });
});

it.each(["iq_doc", "gates", "segments", "notes"])("captures %s conversion errors before rendering and preserves independent sections", field => {
  const raw = { iq_doc: 90, gates: [], segments: [], notes: [{ segment: null, message: "Existing note" }] };
  Object.defineProperty(raw, field, { get() { throw new Error(`${field} failed`); } });
  const view = prepareIqReport(raw);
  const section = (field === "iq_doc" ? "iq" : field) as keyof IqReportView;
  expect(view[section]).toEqual({ data: null, error: `${field} failed` });
  for (const key of ["iq", "gates", "segments", "notes"] as const) {
    expect(Object.getOwnPropertyDescriptor(view, key)?.get).toBeUndefined();
    if (key !== section) expect(view[key].error).toBeNull();
  }
  if (field !== "notes") expect(view.notes.data).toEqual([{ segment: null, message: "Existing note", status: "neutral" }]);
});

it("finishes conversion once before the prepared report is consumed", () => {
  const read = vi.fn(() => 90);
  const view = prepareIqReport(Object.defineProperty({}, "iq_doc", { get: read }));
  expect(read).toHaveBeenCalledTimes(1);
  expect(view.iq.data!.displayInt).toBe(90);
  expect(view.iq.data!.displayInt).toBe(90);
  expect(read).toHaveBeenCalledTimes(1);
});

it("captures a segment explanation error while preserving its row and other segments", () => {
  const party = { cues: [], segment_name: "party", expected_weight: 2, actual_weight: 1, iq: 50 };
  Object.defineProperty(party, "explanations", { get() { throw new Error("Party explanation failed"); } });
  const view = prepareIqReport({ segments: [party,
    { cues: [], segment_name: "reference", expected_weight: 1, actual_weight: 1, iq: 100, explanations: ["Healthy notes"] },
  ] });
  expect(view.segments.error).toBeNull();
  expect(view.segments.data![0]).toMatchObject({ displayId: "Party", iqDisplay: "50%", explanations: { data: null, error: "Party explanation failed" } });
  expect(view.segments.data![1].explanations).toEqual({ data: ["Healthy notes"], error: null });
});
