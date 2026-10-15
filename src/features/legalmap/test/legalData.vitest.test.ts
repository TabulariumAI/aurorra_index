import type { LegalGroup } from "aurora-core";
import { describe, expect, it } from "vitest";
import { displayLots, normalizeLegalData, toPlatJSON } from "../data/legalData";

function plat(values: Record<string, string>): LegalGroup {
  return { type: "lot_block", elements: Object.entries(values).map(([aspect, value]) => ({ aspect, value })) };
}

const seale = { state: "TEXAS", county: "BEXAR COUNTY", subdivision: "SEALE SUBDIVISION", unit: "1" };

describe("parcel count merging", () => {
  const ironHorse = { state: "TEXAS", county: "BEXAR COUNTY", subdivision: "THE RANCH AT IRON HORSE", phase: "II", lot: "32" };
  const groups = ["1", "4482C"].map(block => plat({ ...ironHorse, block }));

  it("merges the supplied one-parcel example and preserves both block identifiers", () => {
    const legal = { groups, parcels_num: 1, summary: "One parcel.", plat: { county: "Bexar", state: "TX" } };
    const view = normalizeLegalData(legal);
    expect(view.subdivisions).toEqual([{
      state: "TEXAS", county: "BEXAR COUNTY", subdivision: "THE RANCH AT IRON HORSE", rightsOfWay: [],
      divisions: [{ unit: "", phase: "II", section: "", blocks: [{ name: "1/4482C", lots: [{ name: "32" }] }] }],
    }]);
    expect(view.summary).toBe("One parcel.");
    expect(view.locationLabel).toBe("Bexar County | Texas");
    expect(view.presentLayers).toEqual(new Set(["subdivision", "phase", "block", "lot"]));
    expect(toPlatJSON(legal)).toEqual(view.subdivisions);
  });

  it.each([undefined, 0, -1, 2, 3])("retains separate source blocks for parcels_num %s", parcels_num => {
    const legal = { groups, parcels_num };
    expect(normalizeLegalData(legal).subdivisions).toEqual(normalizeLegalData({ groups }).subdivisions);
    expect(toPlatJSON(legal)).toEqual(normalizeLegalData({ groups }).subdivisions);
  });

  it("keeps array input unchanged without a parcel count", () => {
    expect(normalizeLegalData(groups).subdivisions).toEqual(normalizeLegalData({ groups }).subdivisions);
    expect(toPlatJSON(groups)).toEqual(normalizeLegalData({ groups }).subdivisions);
  });

  it.each(["groups", "legalGroups", "LegalGroups", "items"])("retains parcel counts with the existing %s container", key => {
    const legal = { [key]: groups, parcels_num: 1 };
    expect(toPlatJSON(legal)[0].divisions[0].blocks).toEqual([{ name: "1/4482C", lots: [{ name: "32" }] }]);
  });

  it("retains the existing group-container precedence", () => {
    const legal = { parcels_num: 1, groups, legalGroups: [plat({ subdivision: "SELECTED", block: "3", lot: "7" })] };
    expect(normalizeLegalData(legal).subdivisions[0].subdivision).toBe("SELECTED");
    expect(toPlatJSON(legal)).toEqual(normalizeLegalData(legal).subdivisions);
  });

  it("selects the highest matching-element weight before an earlier pair", () => {
    const legal = { parcels_num: 2, groups: [
      plat({ subdivision: "A", phase: "I", block: "1", lot: "9" }),
      plat({ subdivision: "B", phase: "II", block: "2", lot: "32" }),
      plat({ subdivision: "B", phase: "II", block: "4482C", lot: "32" }),
    ] };
    expect(normalizeLegalData(legal).subdivisions.map(sub => sub.divisions[0].blocks)).toEqual([
      [{ name: "1", lots: [{ name: "9" }] }], [{ name: "2/4482C", lots: [{ name: "32" }] }],
    ]);
  });

  it.each([
    [["1", "2", "4482C"], ["1/2", "4482C"]],
    [["4482C", "2", "1"], ["1", "4482C/2"]],
  ])("breaks equal weights using source order %j", (blocks, expected) => {
    const legal = { parcels_num: 2, groups: blocks.map(block => plat({ ...ironHorse, block })) };
    expect(normalizeLegalData(legal).subdivisions[0].divisions[0].blocks.map(block => block.name)).toEqual(expected);
  });

  it("recalculates matching weights after each merge", () => {
    const legal = { parcels_num: 2, groups: [
      plat({ subdivision: "A", block: "1", lot: "1" }),
      plat({ subdivision: "A", block: "2", lot: "1" }),
      plat({ subdivision: "A", block: "2", lot: "2" }),
      plat({ subdivision: "B", block: "3", lot: "3" }),
    ] };
    expect(normalizeLegalData(legal).subdivisions.map(sub => sub.divisions[0].blocks)).toEqual([
      [{ name: "1/2", lots: [{ name: "1,2" }] }], [{ name: "3", lots: [{ name: "3" }] }],
    ]);
  });

  it.each([1, 2, 3, 4])("stops at the requested %i groups", parcels_num => {
    const legal = { parcels_num, groups: ["1", "2", "3", "4"].map(block => plat({ ...ironHorse, block })) };
    const blocks = normalizeLegalData(legal).subdivisions[0].divisions[0].blocks;
    expect(blocks).toHaveLength(parcels_num);
    expect(blocks.flatMap(block => block.name.split("/")).sort()).toEqual(["1", "2", "3", "4"]);
    expect(blocks.every(block => block.lots.length === 1 && block.lots[0].name === "32")).toBe(true);
  });

  it.each(["lot", "block", "unit", "phase", "section", "subdivision"])("retains differing %s values while merging upward", aspect => {
    const values = { ...ironHorse, block: "1", unit: "1", section: "A" };
    const legal = { parcels_num: 1, groups: [plat(values), plat({ ...values, [aspect]: "OTHER" })] };
    const sub = normalizeLegalData(legal).subdivisions[0];
    const division = sub.divisions[0];
    const block = division.blocks[0];
    const value = aspect === "lot" ? block.lots[0].name : aspect === "block" ? block.name :
      aspect === "subdivision" ? sub.subdivision : division[aspect as "unit" | "phase" | "section"];
    expect(value).toBe(`${values[aspect as keyof typeof values]}${aspect === "block" ? "/" : ","}OTHER`);
    expect(sub.divisions).toHaveLength(1);
    expect(division.blocks).toHaveLength(1);
  });

  it("does not count blanks as matching elements", () => {
    const legal = { parcels_num: 2, groups: [
      plat({ subdivision: "A", block: "1", lot: "", phase: "", unit: "", section: "" }),
      plat({ subdivision: "B", block: "2", lot: "7", phase: "", unit: "", section: "" }),
      plat({ subdivision: "B", block: "3", lot: "7" }),
    ] };
    expect(normalizeLegalData(legal).subdivisions.map(sub => sub.divisions[0].blocks)).toEqual([
      [{ name: "1", lots: [] }], [{ name: "2/3", lots: [{ name: "7" }] }],
    ]);
  });

  it("deduplicates matching values using existing case and whitespace conventions", () => {
    const legal = { parcels_num: 1, groups: [
      plat({ subdivision: "THE RANCH AT IRON HORSE", phase: "II", block: "4482C", lot: "32" }),
      plat({ subdivision: " the   ranch at iron horse ", phase: " ii ", block: "4482c", lot: " 32 " }),
    ] };
    expect(normalizeLegalData(legal).subdivisions[0]).toMatchObject({
      subdivision: "THE RANCH AT IRON HORSE",
      divisions: [{ phase: "II", blocks: [{ name: "4482C", lots: [{ name: "32" }] }] }],
    });
  });

  it("counts only lot_block groups and preserves non-plat summary data", () => {
    const legal = { parcels_num: 2, summary: "Two parcels.", groups: [
      ...groups,
      { type: "metes_bounds", elements: [{ aspect: "lot", value: "99" }] },
      { type: "plat_reference", elements: [{ aspect: "plat_page", value: "32" }] },
    ] };
    const view = normalizeLegalData(legal);
    expect(view.subdivisions[0].divisions[0].blocks.map(block => block.name)).toEqual(["1", "4482C"]);
    expect(view.summary).toBe("Two parcels.");
  });

  it("keeps right-of-way labels and numeric lot gaps when merging blocks", () => {
    const legal = { parcels_num: 1, groups: [
      plat({ ...ironHorse, block: "1", lot: "1, 3", right_of_way: "DRAINAGE RIGHT OF WAY" }),
      plat({ ...ironHorse, block: "4482C", lot: "5" }),
    ] };
    const sub = normalizeLegalData(legal).subdivisions[0];
    expect(sub.rightsOfWay).toEqual(["DRAINAGE RIGHT OF WAY"]);
    expect(displayLots(sub.divisions[0].blocks[0].lots)).toEqual([
      { name: "1", filled: true }, { name: "2", filled: false }, { name: "3", filled: true },
      { name: "4", filled: false }, { name: "5", filled: true },
    ]);
  });

  it("keeps distinct right-of-way corridors when their lot-block groups merge", () => {
    const labels = ["2.669 ACRE DRAINAGE RIGHT OF WAY", "5.455 ACRE DRAINAGE RIGHT OF WAY"];
    const legal = { parcels_num: 1, groups: labels.map((right_of_way, index) => plat({
      ...ironHorse, block: index === 0 ? "1" : "4482C", right_of_way,
    })) };
    const sub = normalizeLegalData(legal).subdivisions[0];
    expect(sub.rightsOfWay).toEqual(labels);
    expect(sub.divisions[0].blocks).toEqual([{ name: "1/4482C", lots: [{ name: "32" }] }]);
    expect(normalizeLegalData(legal).presentLayers).toContain("right_of_way");
  });

  it("retains prefixed numeric lots in separate filled positions after merging", () => {
    const legal = { parcels_num: 1, groups: [
      plat({ ...ironHorse, block: "Block 1", lot: "Lot 1" }),
      plat({ ...ironHorse, block: "Block 4482C", lot: "Lot 3" }),
    ] };
    expect(displayLots(normalizeLegalData(legal).subdivisions[0].divisions[0].blocks[0].lots)).toEqual([
      { name: "1", filled: true }, { name: "2", filled: false }, { name: "3", filled: true },
    ]);
  });

  it("does not mutate source groups or elements", () => {
    const legal = { groups: structuredClone(groups), parcels_num: 1 };
    const before = structuredClone(legal);
    legal.groups.forEach(group => {
      group.elements?.forEach(Object.freeze);
      Object.freeze(group.elements);
      Object.freeze(group);
    });
    Object.freeze(legal.groups);
    Object.freeze(legal);
    normalizeLegalData(legal);
    toPlatJSON(legal);
    expect(legal).toEqual(before);
  });

  it.each([{ groups: [] }, { groups: [{ type: "metes_bounds", elements: [{ aspect: "lot", value: "9" }] }] }])("keeps empty maps empty with a positive count", ({ groups }) => {
    const legal = { groups, parcels_num: 1 };
    expect(normalizeLegalData(legal).isEmptyStructure).toBe(true);
    expect(toPlatJSON(legal)).toEqual([]);
  });
});

describe("legal data normalization", () => {
  it("sorts blocks naturally within each subdivision and division", () => {
    const view = normalizeLegalData({ groups: [
      ...["Block 31", "Block 30", "Block 32", "Block 34"].map(block => plat({ ...seale, block, lot: "1" })),
      plat({ ...seale, unit: "2", block: "Block 2", lot: "1" }),
      plat({ ...seale, unit: "2", block: "Block 10", lot: "1" }),
    ] });
    expect(view.subdivisions[0].divisions[0].blocks.map(block => block.name)).toEqual(["Block 30", "Block 31", "Block 32", "Block 34"]);
    expect(view.subdivisions[0].divisions[1].blocks.map(block => block.name)).toEqual(["Block 2", "Block 10"]);
  });
  it("places short lists in separate cubes and leaves missing lot numbers empty", () => {
    expect(displayLots([{ name: "2, 3, & 4" }])).toEqual([
      { name: "2", filled: true }, { name: "3", filled: true }, { name: "4", filled: true },
    ]);
    expect(displayLots([{ name: "1, 3, 5" }])).toEqual([
      { name: "1", filled: true }, { name: "2", filled: false }, { name: "3", filled: true },
      { name: "4", filled: false }, { name: "5", filled: true },
    ]);
  });

  it("fits long numeric sequences into twelve ranges without losing endpoints", () => {
    const display = displayLots([{ name: "48, 56, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67 & 68" }]);
    expect(display).toHaveLength(12);
    expect(display[0]).toEqual({ name: "48", filled: true });
    expect(display.at(-1)).toMatchObject({ filled: true });
    expect(display.some(lot => !lot.filled)).toBe(true);
    const fourHundred = displayLots(Array.from({ length: 400 }, (_, index) => ({ name: String(index + 1) })));
    expect(fourHundred).toHaveLength(12);
    expect(fourHundred[0].name).toMatch(/^1–/);
    expect(fourHundred.at(-1)?.name).toMatch(/–400$/);
  });

  it("keeps ambiguous alphanumeric ranges intact", () => {
    expect(displayLots([{ name: "4A-4C" }])).toEqual([{ name: "4A-4C", filled: true }]);
  });
  it("groups the two Seale plats into one subdivision and unit with two distinct blocks", () => {
    const view = normalizeLegalData({ groups: [
      plat({ ...seale, block: "4", lot: "4" }),
      plat({ ...seale, block: "4335A", lot: "4" }),
    ] });
    expect(view.subdivisions).toEqual([{
      state: "TEXAS", county: "BEXAR COUNTY", subdivision: "SEALE SUBDIVISION",
      rightsOfWay: [],
      divisions: [{ unit: "1", phase: "", section: "", blocks: [
        { name: "4", lots: [{ name: "4" }] },
        { name: "4335A", lots: [{ name: "4" }] },
      ] }],
    }]);
    expect(view.presentLayers).toEqual(new Set(["subdivision", "unit", "block", "lot"]));
    expect(view.isEmptyStructure).toBe(false);
  });

  it("merges repeated ancestors and lots only within their own parent", () => {
    const view = normalizeLegalData({ groups: [
      plat({ ...seale, block: "4", lot: "4" }),
      plat({ ...seale, block: "4", lot: "4" }),
      plat({ ...seale, block: "4", lot: "5" }),
      plat({ ...seale, unit: "2", block: "4", lot: "4" }),
      plat({ ...seale, subdivision: "OTHER", block: "4", lot: "4" }),
      plat({ ...seale, county: "TRAVIS COUNTY", block: "4", lot: "4" }),
      plat({ ...seale, state: "OTHER STATE", block: "4", lot: "4" }),
    ] });
    expect(view.subdivisions).toHaveLength(4);
    expect(view.subdivisions[0].divisions).toHaveLength(2);
    expect(view.subdivisions[0].divisions[0].blocks).toEqual([{ name: "4", lots: [{ name: "4" }, { name: "5" }] }]);
    expect(view.subdivisions[0].divisions[1].blocks).toEqual([{ name: "4", lots: [{ name: "4" }] }]);
    expect(view.subdivisions.slice(1).every(sub => sub.divisions[0].blocks[0].lots.length === 1)).toBe(true);
  });

  it.each(["unit", "phase", "section"])("groups matching %s values above blocks", (aspect) => {
    const view = normalizeLegalData({ groups: [
      plat({ subdivision: "WILLOW CREEK", [aspect]: "1A", block: "12", lot: "7" }),
      plat({ subdivision: "WILLOW CREEK", [aspect]: "1A", block: "13", lot: "8" }),
      plat({ subdivision: "WILLOW CREEK", [aspect]: "2", block: "12", lot: "7" }),
    ] });
    expect(view.subdivisions[0].divisions).toHaveLength(2);
    expect(view.subdivisions[0].divisions[0]).toMatchObject({ [aspect]: "1A" });
    expect(view.subdivisions[0].divisions[0].blocks.map(block => block.name)).toEqual(["12", "13"]);
    expect(view.presentLayers.has(aspect)).toBe(true);
  });

  it("keeps distinct unit, phase and section designations at the same hierarchy tier", () => {
    const view = normalizeLegalData({ groups: [
      plat({ ...seale, phase: "2", section: "A", block: "4", lot: "4" }),
      plat({ ...seale, phase: "3", section: "A", block: "4", lot: "4" }),
      plat({ ...seale, phase: "2", section: "B", block: "4", lot: "4" }),
    ] });
    expect(view.subdivisions[0].divisions).toHaveLength(3);
    expect(view.subdivisions[0].divisions[0]).toMatchObject({ unit: "1", phase: "2", section: "A" });
  });

  it("does not turn part or condominium fields into hierarchy layers or overwrite lots", () => {
    const view = normalizeLegalData({ groups: [
      plat({ ...seale, block: "4", lot: "4A-4C", part: "Tract A", condominium_unit: "21" }),
      plat({ ...seale, block: "4", lot: "4A-4C", part: "Tract B", condominium_unit: "22" }),
    ] });
    expect(view.subdivisions[0].divisions).toEqual([{ unit: "1", phase: "", section: "", blocks: [
      { name: "4", lots: [{ name: "4A-4C" }] },
    ] }]);
    expect(view.presentLayers).toEqual(new Set(["subdivision", "unit", "block", "lot"]));
  });

  it.each([null, { groups: [] }, { groups: [plat({ part: "Tract A", condominium_unit: "1", county: "Bexar" })] },
    { groups: [{ type: "metes_bounds", elements: [{ aspect: "lot", value: "9" }] }] },
  ])("shows no hierarchy for data without a plat element", (legal) => {
    const view = normalizeLegalData(legal);
    expect(view.isEmptyStructure).toBe(true);
    expect(view.subdivisions).toEqual([]);
  });

  it("retains partial plats without inventing ancestor names or lots", () => {
    const view = normalizeLegalData({ groups: [plat({ block: "A" }), plat({ lot: "7" })] });
    expect(view.subdivisions[0].divisions[0].blocks).toEqual([
      { name: "A", lots: [] }, { name: "", lots: [{ name: "7" }] },
    ]);
    expect(view.presentLayers).toEqual(new Set(["block", "lot"]));
  });

  it("preserves the summary, location and subdivision matching contract", () => {
    const view = normalizeLegalData({
      groups: [plat({ subdivision: "WILLOW CREEK", phase: "Phase 1", block: "Block 12", lot: "Lot 7" })],
      plat: { city: "austin", county: "travis county", state: "TX" }, summary: " Property is described. ",
    });
    expect(view.location).toEqual({ city: "Austin", county: "Travis", state: "Texas" });
    expect(view.locationLabel).toBe("Austin | Travis County | Texas");
    expect(view.summary).toBe("Property is described.");
    expect(view.matchPlatSubdivision).toBe(true);
    expect(view.platName).toBe("Willow Creek");
  });
});

describe("right of way normalization", () => {
  const inwood = { state: "TEXAS", county: "BEXAR COUNTY", subdivision: "INWOOD PLACE SUBDIVISION", unit: "1" };
  const labels = ["2.669 ACRE DRAINAGE RIGHT OF WAY", "5.455 ACRE DRAINAGE RIGHT OF WAY"];

  it("retains both extracted labels under one subdivision without inventing blocks or lots", () => {
    const view = normalizeLegalData({ groups: labels.map(right_of_way => plat({ ...inwood, right_of_way })) });
    expect(view.subdivisions).toEqual([{
      state: "TEXAS", county: "BEXAR COUNTY", subdivision: "INWOOD PLACE SUBDIVISION",
      rightsOfWay: labels,
      divisions: [{ unit: "1", phase: "", section: "", blocks: [] }],
    }]);
    expect(view.presentLayers).toEqual(new Set(["subdivision", "right_of_way", "unit"]));
    expect(view.isEmptyStructure).toBe(false);
  });

  it("merges repeated labels only within their subdivision and keeps source order", () => {
    const view = normalizeLegalData({ groups: [
      plat({ ...inwood, right_of_way: labels[1] }),
      plat({ ...inwood, right_of_way: labels[0] }),
      plat({ ...inwood, unit: "2", right_of_way: labels[1].toLowerCase() }),
      plat({ ...inwood, subdivision: "OTHER", right_of_way: labels[0] }),
      plat({ ...inwood, county: "TRAVIS COUNTY", right_of_way: labels[0] }),
      plat({ ...inwood, state: "OKLAHOMA", right_of_way: labels[0] }),
    ] });
    expect(view.subdivisions.map(sub => sub.rightsOfWay)).toEqual([
      [labels[1], labels[0]], [labels[0]], [labels[0]], [labels[0]],
    ]);
    expect(view.subdivisions[0].divisions.map(division => division.unit)).toEqual(["1", "2"]);
  });

  it("preserves ordinary hierarchy, summary and location alongside ROWs", () => {
    const view = normalizeLegalData({
      groups: [plat({ ...inwood, right_of_way: labels[0] }), plat({ ...inwood, block: "4", lot: "1, 3" })],
      summary: "Two drainage rights of way.", plat: { city: "San Antonio", county: "Bexar", state: "TX" },
    });
    expect(view.subdivisions[0].divisions[0].blocks).toEqual([{ name: "4", lots: [{ name: "1, 3" }] }]);
    expect(view.presentLayers).toEqual(new Set(["subdivision", "right_of_way", "unit", "block", "lot"]));
    expect(view.summary).toBe("Two drainage rights of way.");
    expect(view.locationLabel).toBe("San Antonio | Bexar County | Texas");
  });

  it("ignores blank ROWs and ROWs outside lot_block groups", () => {
    const view = normalizeLegalData({ groups: [
      plat({ ...inwood, right_of_way: "   " }),
      { type: "metes_bounds", elements: [{ aspect: "right_of_way", value: labels[0] }] },
    ] });
    expect(view.subdivisions[0].rightsOfWay).toEqual([]);
    expect(view.presentLayers).toEqual(new Set(["subdivision", "unit"]));
  });
});
