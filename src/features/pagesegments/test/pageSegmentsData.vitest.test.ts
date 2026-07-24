import { describe, expect, it } from "vitest";
import {
  normalizePageSegments,
  PAGE_SEGMENT_ORDER,
} from "../data/pageSegmentsData";

describe("pageSegmentsData", () => {
  it("uses canonical schema segment identifiers", () => {
    expect(PAGE_SEGMENT_ORDER).toEqual([
      "reference",
      "property",
      "endorsement",
      "transaction",
      "party",
      "secrets",
      "monetary",
      "acknowledgment",
      "court",
      "vital",
    ]);
  });

  it("normalizes canonical values and drops non-segment identifiers", () => {
    expect(normalizePageSegments([
      "party",
      "REFERENCE",
      "reference",
      "property",
      "secrets",
      "monetary",
      "party_clause",
      "recital",
      "exhibit",
      "confidential",
      "monetaryinfo",
    ])).toEqual(["reference", "property", "party", "secrets", "monetary"]);
  });
});
