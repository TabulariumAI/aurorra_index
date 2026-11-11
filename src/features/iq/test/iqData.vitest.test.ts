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

  it("computes gate percentages and decisions", () => {
    const mixed = prepareIqReport({
      gates: [
        { code: "pass", status: "PASS", description: "pass" },
        { code: "fail", status: "FAIL", description: "fail" },
      ],
    });
    expect(mixed.gates.data!.displayPercent).toBe(50);
    expect(mixed.gates.data!.decision).toBe("Reject");

    expect(prepareIqReport({ gates: [{ code: "pass", status: "PASS", description: "pass" }] }).gates.data!.decision).toBe("Pass");
    expect(prepareIqReport({ gates: [{ code: "warn", status: "WARNING", description: "warn" }] }).gates.data!.decision).toBe("Review");
  });

  it("filters unknown gates and formats segments", () => {
    const view = prepareIqReport({
      gates: [
        { code: "pass", status: "PASS", description: "pass" },
        { code: "other", status: "OTHER", description: "hidden" },
      ],
      segments: [
        { segment_name: "party", expected_weight: 1, actual_weight: 2, iq: 3, explanations: [1] },
      ],
    });

    expect(view.gates.data!.items).toHaveLength(1);
    expect(view.gates.data!.items[0].code).toBe("pass");
    expect(view.segments.data![0].displayId).toBe("Party");
    expect(view.segments.data![0].explanations.data).toEqual(["1"]);
  });

  it("normalizes invalid decisions", () => {
    expect(normalizeIqReport({ decision: "Unknown" }).decision).toBe("Review");
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

  it("moves all INFO descriptions into notes and excludes them from gate metrics", () => {
    const raw = {
      gates: [
        { code: "pass", status: "PASS", description: "Passed requirement" },
        { code: "info-1", status: "INFO", description: "Missing effective date" },
        { code: "fail", status: "FAIL", description: "Failed requirement" },
        { code: "info-2", status: "INFO", description: "Missing loan number" },
        { code: "unknown", status: "OTHER", description: "Unknown status" },
      ],
      explanation: ["Existing note"],
    };
    const original = structuredClone(raw);
    const view = prepareIqReport(raw);
    expect(view.gates.data!.items.map(gate => gate.code)).toEqual(["pass", "fail"]);
    expect(view.gates.data).toMatchObject({ total: 2, success: 1, ratio: 50, displayPercent: 50, bucket: "red", decision: "Reject" });
    expect(view.explanations.data).toEqual(["Existing note", "Missing effective date", "Missing loan number"]);
    expect(raw).toEqual(original);
  });

  it("prepares INFO-only reports as notes with no gates", () => {
    const view = prepareIqReport({ gates: [{ code: "info", status: "INFO", description: "Missing address" }] });
    expect(view.gates.data).toMatchObject({ items: [], total: 0, success: 0, ratio: 0, displayPercent: 0, decision: "Review" });
    expect(view.explanations.data).toEqual(["Missing address"]);
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
      { segment_name: "party", expected_weight: 6, actual_weight: 5, iq: 90, explanations: [] },
      { segment_name: "sides", expected_weight: 12, actual_weight: 12, iq: 100, explanations: [] },
      { segment_name: "legal", expected_weight: 6, actual_weight: 0, iq: 0, explanations: [] },
    ] };
    const original = structuredClone(raw);
    expect(prepareIqReport(raw).segments.data!.map(segment => segment.id)).toEqual(["sides", "party", "legal"]);
    expect(raw).toEqual(original);
  });
});

it.each(["iq_doc", "decision", "gates", "segments", "explanation"])("captures %s conversion errors before rendering and preserves independent sections", field => {
  const raw = { iq_doc: 90, decision: "Pass", gates: [], segments: [], explanation: ["Existing note"] };
  Object.defineProperty(raw, field, { get() { throw new Error(`${field} failed`); } });
  const view = prepareIqReport(raw);
  const section = (field === "iq_doc" || field === "decision" ? "iq" : field === "explanation" ? "explanations" : field) as keyof IqReportView;
  expect(view[section]).toEqual({ data: null, error: `${field} failed` });
  for (const key of ["iq", "gates", "segments", "explanations"] as const) {
    expect(Object.getOwnPropertyDescriptor(view, key)?.get).toBeUndefined();
    if (key !== section) expect(view[key].error).toBeNull();
  }
  if (field !== "explanation") expect(view.explanations.data).toEqual(["Existing note"]);
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
  const party = { segment_name: "party", expected_weight: 2, actual_weight: 1, iq: 50 };
  Object.defineProperty(party, "explanations", { get() { throw new Error("Party explanation failed"); } });
  const view = prepareIqReport({ segments: [party,
    { segment_name: "reference", expected_weight: 1, actual_weight: 1, iq: 100, explanations: ["Healthy notes"] },
  ] });
  expect(view.segments.error).toBeNull();
  expect(view.segments.data![0]).toMatchObject({ displayId: "Party", iqDisplay: "50%", explanations: { data: null, error: "Party explanation failed" } });
  expect(view.segments.data![1].explanations).toEqual({ data: ["Healthy notes"], error: null });
});
