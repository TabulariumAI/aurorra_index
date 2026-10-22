import { describe, expect, it } from "vitest";
import type { LegalPayload } from "aurora-core";
import { getMapGroups } from "../data/surveyData";

describe("legal map availability", () => {
  it.each(["groups", "legalGroups", "LegalGroups", "items"] as const)("reads %s without changing the extracted data", key => {
    const legal: LegalPayload = { [key]: [{ type: "lot_block", elements: [{ aspect: "lot", value: "8" }] }] };
    const source = JSON.stringify(legal);
    expect(getMapGroups(legal).map(entry => entry.view)).toEqual(["Plat"]);
    expect(JSON.stringify(legal)).toBe(source);
  });

  it.each([
    undefined, null, {}, { groups: [] },
    { groups: [{ type: "lot_block", elements: [] }] },
    { groups: [{ type: "lot_block", elements: [{ value: "   " }] }] },
    { groups: [{ type: "plat_reference", elements: [{ value: "6" }] }] },
  ])("does not enable a plat for unavailable data: %j", legal => {
    expect(getMapGroups(legal)).toEqual([]);
  });

  it("finds a nonblank group after an empty or unrelated group", () => {
    expect(getMapGroups({ groups: [
      { type: "plat_reference", elements: [{ value: "6" }] },
      { type: "lot_block" },
      { type: " lot_block ", elements: [{ value: "" }, { aspect: "block", value: "A" }] },
    ] }).map(entry => entry.view)).toEqual(["Plat"]);
  });

  it.each([["plss", "PLSS"], ["metes_bounds", "Metes & Bounds"], ["government_lot", "PLSS"], ["fractional_section", "PLSS"]])("enables %s without an address or lot/block group", (type, view) => {
    expect(getMapGroups({ groups: [{ type, elements: type === "metes_bounds" ? [{ aspect: "bearings", value: "N" }, { aspect: "distances", value: "100 ft" }] : [{ aspect: "description", value: "Section 12" }] }] }).map(entry => entry.view)).toEqual([view]);
    expect(getMapGroups({ groups: [{ type, elements: [{ value: " " }] }] })).toEqual([]);
  });
});
