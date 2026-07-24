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

  it("renders stored gate violation descriptions", () => {
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

    expect(view.gates.items[0].description).toBe("Person or 0 >= 1 - condition not satisfied by any available values. Tested 0 combination(s).");
    expect(view.gates.items[1].description).toBe("Missing indexes: Party Address or Legal Description. Cue verification did not confirm the existence of required indexes.");
  });

  it("does not stringify missing gate descriptions", () => {
    const report = normalizeIqReport({
      gates: [{ code: "gate-1", status: "FAIL" }],
    });

    expect(report.gates[0].description).toBe("");
    expect(prepareIqReport(report).gates.items[0].description).toBe("");
  });
});
