import { describe, expect, it } from "vitest";
import { prepareIqReport, normalizeIqReport } from "../data/iqData";

describe("iqData", () => {
  it("normalizes IQ score buckets and bounds", () => {
    expect(prepareIqReport({ iq_doc: 90 }).iq).toMatchObject({ displayInt: 90, bucket: "amber" });
    expect(prepareIqReport({ iq_doc: 97 }).iq.bucket).toBe("green");
    expect(prepareIqReport({ iq_doc: 81 }).iq.bucket).toBe("red");
    expect(prepareIqReport({ iq_doc: -10 }).iq.value).toBe(0);
    expect(prepareIqReport({ iq_doc: 110 }).iq.value).toBe(100);
  });

  it("computes gate percentages and decisions", () => {
    const mixed = prepareIqReport({
      gates: [
        { code: "pass", status: "PASS", description: "pass" },
        { code: "fail", status: "FAIL", description: "fail" },
      ],
    });
    expect(mixed.gates.displayPercent).toBe(50);
    expect(mixed.gates.decision).toBe("Reject");

    expect(prepareIqReport({ gates: [{ code: "pass", status: "PASS", description: "pass" }] }).gates.decision).toBe("Pass");
    expect(prepareIqReport({ gates: [{ code: "warn", status: "WARNING", description: "warn" }] }).gates.decision).toBe("Review");
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

    expect(view.gates.items).toHaveLength(1);
    expect(view.gates.items[0].code).toBe("pass");
    expect(view.segments[0].displayId).toBe("Party");
    expect(view.segments[0].explanations).toEqual(["1"]);
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

    expect(view.gates.items[0].description).toBe("Detailed values are unavailable for this saved result.");
    expect(view.gates.items[1].description).toBe("Detailed values are unavailable for this saved result.");
  });

  it("does not stringify missing gate descriptions", () => {
    const report = normalizeIqReport({
      gates: [{ code: "gate-1", status: "FAIL" }],
    });

    expect(report.gates[0].description).toBe("Detailed values are unavailable for this saved result.");
    expect(prepareIqReport(report).gates.items[0].description).toBe("Detailed values are unavailable for this saved result.");
  });

  it("preserves service descriptions and gate identity for both report shapes", () => {
    const description = "Effective Date must be on or after Acknowledgment Date. The available dates do not satisfy this requirement. Effective Date is unavailable. One acknowledgment-date entry was found.";
    for (const extra of [{}, { kind: "Generic", human_expr: "wrong >= expression", bindings: [{ field: "acknowledgment_date", value: "1" }] }]) {
      const report = normalizeIqReport({ gates: [{ ...extra, code: "date-gate", status: "FAIL", description }] });
      expect(report.gates).toEqual([{ code: "date-gate", status: "FAIL", description }]);
      expect(prepareIqReport(report).gates.items[0]).toMatchObject({ code: "date-gate", description, isFailure: true });
    }
  });

  it("does not replace an explicit empty service description", () => {
    expect(normalizeIqReport({ gates: [{ code: "empty", status: "INFO", description: "" }] }).gates[0].description).toBe("");
  });
});
