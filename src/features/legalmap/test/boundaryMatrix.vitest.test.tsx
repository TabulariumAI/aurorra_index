import type { LegalGroup } from "aurora-core";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LegalMapContent } from "../component/LegalMapContent";
import { buildBoundary, buildMatrix, parseBearing, parseDistance } from "../data/surveyData";
import { matrixAmbiguous, matrixFixture, matrixOffset, matrixRetry } from "./matrixFixture";
import { curveFixture, sectionFixture } from "./caseFixture";
import { metesFixture } from "./metesFixture";
import { incompleteFixture } from "./surveyFixture";

const rectangle: LegalGroup = { type: "metes_bounds", elements: [
  { aspect: "bearings", value: "NORTH; EAST; SOUTH; WEST" },
  { aspect: "distances", value: "100 FEET; 50 FEET; 100 FEET; 50 FEET" },
] };

describe("boundary matrix", () => {
  it.each(["bearings", "distances"])("preserves embedded pairs and repeated entries in %s", aspect => {
    const scene = buildMatrix({ type: "metes_bounds", elements: [{ aspect, value: JSON.stringify([
      "NORTH 40 FEET", "60 FEET NORTH", "EAST 50 FEET", "100 FEET SOUTH", "WEST 50 FEET",
    ]) }] }, "Parcel");
    expect(scene.courses?.map(course => course.distance)).toEqual(["40 FEET", "60 FEET", "50 FEET", "100 FEET", "50 FEET"]);
    expect(scene.courses?.every(course => course.confirmed)).toBe(true);
    expect(scene.closed).toBe(true);
  });

  it("collects different complete pairs from both fields without replacing or duplicating them", () => {
    const scene = buildMatrix({ type: "metes_bounds", elements: [
      { aspect: "bearings", value: "NORTH 100 FEET; EAST 50 FEET" },
      { aspect: "distances", value: "SOUTH 100 FEET; WEST 50 FEET" },
    ] }, "Parcel");
    expect(scene.courses?.map(course => course.bearing)).toEqual(["NORTH", "EAST", "SOUTH", "WEST"]);
    expect(scene.courses).toHaveLength(4);
    expect(scene.closed).toBe(true);
  });

  it.each([false, true])("pairs separate fields by sequence, including swapped field contents: %s", swapped => {
    const elements = rectangle.elements!.map((element, index) => ({ ...element, aspect: swapped ? ["distances", "bearings"][index] : element.aspect }));
    const scene = buildMatrix({ ...rectangle, elements }, "Parcel");
    expect(scene.courses?.map(course => course.distance)).toEqual(["100 FEET", "50 FEET", "100 FEET", "50 FEET"]);
    expect(scene.courses?.every(course => course.confirmed)).toBe(true);
    expect(scene.closed).toBe(true);
  });

  it("merges complementary and repeated representations at the same entry once", () => {
    const scene = buildMatrix({ type: "metes_bounds", elements: [
      { aspect: "bearings", value: "NORTH 100 FEET; EAST 50 FEET; SOUTH; WEST" },
      { aspect: "distances", value: "100 FEET; 50 FEET; 100 FEET SOUTH; 50 FEET WEST" },
    ] }, "Parcel");
    expect(scene.courses).toHaveLength(4);
    expect(scene.courses?.every(course => course.confirmed)).toBe(true);
    expect(scene.closed).toBe(true);
  });

  it.each(["bearings", "distances"])("preserves DMS punctuation, compound lengths and thousands separators in %s", aspect => {
    const scene = buildMatrix({ type: "metes_bounds", elements: [{ aspect, value: 'NORTH 12°34\'56", EAST 1,000 FEET; 5 FEET 6 INCHES WEST' }] }, "Parcel");
    expect(scene.courses?.map(course => course.distance)).toEqual(["1,000 FEET", "5 FEET 6 INCHES"]);
    expect(scene.courses?.every(course => course.confirmed)).toBe(true);
  });

  it("calculates an interior missing bearing from the next known section without tainting its measurements", () => {
    const scene = buildMatrix({ type: "metes_bounds", elements: [
      { aspect: "bearings", value: "NORTH 100 FEET; 50 FEET; SOUTH 100 FEET; WEST 50 FEET" },
    ] }, "Parcel");
    expect(scene.courses?.map(course => course.confirmed)).toEqual([true, false, true, true]);
    expect(scene.courses?.[1].issue).toMatch(/calculated/i);
    const lines = scene.items.filter(item => item.kind === "line");
    expect(lines).toHaveLength(4);
    expect(lines[1].to).toEqual(lines[2].from);
    expect(scene.closed).toBe(true);
  });

  it("calculates a missing distance on a stated direction and retains its unconfirmed status", () => {
    const scene = buildMatrix({ type: "metes_bounds", elements: [
      { aspect: "bearings", value: "NORTH 100 FEET; EAST; SOUTH 100 FEET; WEST 50 FEET" },
    ] }, "Parcel");
    expect(scene.courses?.map(course => course.confirmed)).toEqual([true, false, true, true]);
    expect(parseDistance(scene.courses![1].distance!)).toBeCloseTo(15.24);
    expect(scene.courses![1].issue).toMatch(/calculated/i);
    expect(scene.closed).toBe(true);
  });

  it.each(["", "UNREADABLE"])("retains an explicit %j bearing entry without shifting subsequent distances", value => {
    const scene = buildMatrix({ type: "metes_bounds", elements: [
      { aspect: "bearings", value: JSON.stringify(["NORTH", value, "SOUTH", "WEST"]) },
      rectangle.elements![1],
    ] }, "Parcel");
    expect(scene.courses?.map(course => course.distance)).toEqual(["100 FEET", "50 FEET", "100 FEET", "50 FEET"]);
    expect(scene.courses?.[0]).toMatchObject({ bearing: "NORTH", confirmed: true });
    expect(scene.courses?.slice(2).map(course => course.bearing)).toEqual(["SOUTH", "WEST"]);
    if (value === "") expect(scene.courses?.map(course => course.confirmed)).toEqual([true, false, true, true]);
    expect(scene.courses?.[1].confirmed).toBe(false);
    expect(scene.closed).toBe(value === "" ? true : undefined);
  });

  it.each(["bearings", "distances"])("treats an invalid numeric distance consistently in either %s field", aspect => {
    const scene = buildMatrix({ type: "metes_bounds", elements: [{ aspect, value: "NORTH 100 FEET; 12 UNKNOWN; SOUTH 100 FEET; WEST 50 FEET" }] }, "Parcel");
    expect(scene.courses).toHaveLength(4);
    expect(scene.courses?.[1].distance).toBe("12 UNKNOWN");
    expect(scene.courses?.[1].confirmed).toBe(false);
    expect(scene.closed).not.toBe(true);
  });

  it("keeps complete metadata pairs when source text contains different measurements", () => {
    const scene = buildMatrix({ type: "metes_bounds", source: "NORTH 100 FEET; EAST 50 FEET; SOUTH 100 FEET; WEST 50 FEET.", elements: [
      { aspect: "bearings", value: "NORTH 200 FEET; EAST 50 FEET; SOUTH 200 FEET; WEST 50 FEET" },
    ] }, "Parcel");
    expect(scene.courses?.map(course => course.distance)).toEqual(["200 FEET", "50 FEET", "200 FEET", "50 FEET"]);
    expect(scene.closed).toBe(true);
  });

  it("applies border ordering while preserving an explicit commencement offset", () => {
    const scene = buildMatrix(matrixOffset, "Parcel");
    expect(scene.closed).toBe(true);
    expect(scene.beginning).toBe(1);
    expect(scene.ending).toBe(5);
    expect(scene.courses?.[0]).toMatchObject({ distance: "10 feet", confirmed: false, issue: "Commencement offset; not a boundary course." });
    expect(scene.courses?.slice(1).map(course => course.bearing)).toEqual(["NORTH", "EAST", "SOUTH", "WEST"]);
    expect(scene.courses?.slice(1).every(course => course.confirmed)).toBe(true);
    expect(scene.courses?.at(-1)?.target).toBe(2);
    expect(buildBoundary(matrixOffset, "Parcel").closed).not.toBe(true);
  });

  it("validates a closed straight boundary even when source curves follow it", () => {
    const scene = buildMatrix(matrixAmbiguous, "Parcel");
    expect(buildBoundary(matrixAmbiguous, "Previous").closed).toBe(true);
    expect(scene.closed).toBe(false);
    expect(scene.issue).toMatch(/multiple.*shape/i);
    expect(scene.courses).toHaveLength(7);
    expect(scene.courses?.at(-1)?.distance).toBe("25 FEET");
    expect(scene.courses?.every(course => !course.confirmed)).toBe(true);
  });

  it("does not calculate an unsupported endpoint with two unresolved courses", () => {
    const scene = buildMatrix({ type: "metes_bounds", elements: [
      { aspect: "bearings", value: "NORTH 100 FEET; EAST; SOUTH; WEST 50 FEET" },
    ] }, "Parcel");
    expect(scene.closed).not.toBe(true);
    expect(scene.courses?.filter(course => course.issue?.includes("Calculated"))).toHaveLength(0);
  });

  it("does not calculate a connector from a supplied zero distance", () => {
    const scene = buildMatrix({ type: "metes_bounds", elements: [
      { aspect: "bearings", value: "NORTH 100 FEET; 0 FEET; SOUTH 100 FEET; WEST 50 FEET" },
    ] }, "Parcel");
    expect(scene.closed).not.toBe(true);
    expect(scene.courses?.[1].issue).not.toMatch(/calculated/i);
    expect(scene.items.filter(item => item.kind === "line").map(item => item.sequence)).not.toContain(2);
  });

  it.each(["WEST", "NORTH"])("does not calculate a missing distance against the stated %s direction", bearing => {
    const scene = buildMatrix({ type: "metes_bounds", elements: [
      { aspect: "bearings", value: `NORTH 100 FEET; ${bearing}; SOUTH 100 FEET; WEST 50 FEET` },
    ] }, "Parcel");
    expect(scene.closed).not.toBe(true);
    expect(scene.courses?.[1].distance).toBeUndefined();
    expect(scene.courses?.[1].confirmed).toBe(false);
  });

  it("re-pairs supplied measurements only after border ordering fails and marks changed associations unconfirmed", () => {
    const scene = buildMatrix({ type: "metes_bounds", elements: [
      { aspect: "bearings", value: "NORTH 40 FEET; EAST 30 FEET; SOUTH 53.13010235415598 DEGREES WEST 50 FEET" },
    ] }, "Parcel");
    expect(scene.closed).toBe(true);
    expect(scene.courses?.map(course => course.distance)).toEqual(["30 FEET", "40 FEET", "50 FEET"]);
    expect(scene.courses?.map(course => course.confirmed)).toEqual([false, false, true]);
    expect(scene.courses?.[0].issue).toMatch(/rearranged.*40 FEET/i);
    expect(scene.courses?.[1].issue).toMatch(/rearranged.*30 FEET/i);
    expect(scene.issue).toMatch(/rearranged/i);
  });

  it("retries combined pairs from both fields using the original bearing angles and compass directions", () => {
    const original = JSON.stringify(matrixRetry);
    const scene = buildMatrix(matrixRetry, "Parcel");
    expect(scene.closed).toBe(true);
    expect(scene.courses?.map(course => course.bearing)).toEqual(["NORTH", "EAST", "SOUTH 53.13010235415598 DEGREES WEST"]);
    expect(scene.courses?.map(course => course.distance)).toEqual(["30 FEET", "40 FEET", "50 FEET"]);
    expect(JSON.stringify(matrixRetry)).toBe(original);
  });

  it("recalculates the missing connector after alternative distance assignments", () => {
    const scene = buildMatrix({ type: "metes_bounds", elements: [
      { aspect: "bearings", value: "NORTH 100 FEET; EAST; SOUTH 50 FEET; WEST 100 FEET" },
    ] }, "Parcel");
    expect(scene.closed).toBe(true);
    expect(scene.courses?.map(course => course.bearing)).toEqual(["NORTH", "EAST", "SOUTH", "WEST"]);
    expect(scene.courses?.map(course => course.confirmed)).toEqual([true, false, false, false]);
    expect(scene.courses?.[1].issue).toMatch(/calculated/i);
    expect(parseDistance(scene.courses![1].distance!)).toBeCloseTo(15.24);
    expect(scene.courses?.[2].distance).toBe("100 FEET");
    expect(scene.courses?.[3].distance).toBe("50 FEET");
  });

  it.each([[0.28, true], [0.31, false]])("applies full perimeter tolerance to a calculated connector with %s feet of residual", (residual, closed) => {
    const scene = buildMatrix({ type: "metes_bounds", elements: [
      { aspect: "bearings", value: `NORTH 100 FEET; EAST; SOUTH ${100 + Number(residual)} FEET; WEST 50 FEET` },
    ] }, "Parcel");
    expect(scene.closed === true).toBe(closed);
    expect(scene.courses?.[1].confirmed).toBe(false);
    if (closed) expect(scene.courses?.[1].issue).toMatch(/calculated/i);
    else expect(scene.courses?.[1].distance).toBeUndefined();
  });

  it("includes commencement distance in calculated-connector tolerance", () => {
    const scene = buildMatrix({ type: "metes_bounds",
      source: "BEGINNING at a point 1000 feet easterly from a monument; NORTH 100 FEET; EAST; SOUTH 101 FEET; WEST 50 FEET.",
      elements: [{ aspect: "bearings", value: "NORTH 100 FEET; EAST; SOUTH 101 FEET; WEST 50 FEET" }],
    }, "Parcel");
    expect(scene.closed).toBe(true);
    expect(scene.beginning).toBe(1);
    expect(scene.ending).toBe(5);
    expect(scene.courses?.map(course => course.confirmed)).toEqual([false, true, false, true, true]);
    expect(scene.courses?.[2].issue).toMatch(/calculated/i);
    expect(scene.courses?.at(-1)?.target).toBe(2);
  });

  it("keeps alternative closed shapes unconfirmed when supplied pairs are rearranged", () => {
    const scene = buildMatrix({ type: "metes_bounds", elements: [
      { aspect: "bearings", value: "NORTH 100 FEET; EAST 100 FEET; SOUTH 50 FEET; WEST 50 FEET" },
    ] }, "Parcel");
    expect(scene.closed).not.toBe(true);
    expect(scene.issue).toMatch(/multiple.*shape/i);
    expect(scene.courses?.every(course => !course.confirmed)).toBe(true);
    expect(scene.courses?.map(course => course.distance)).toEqual(["100 FEET", "100 FEET", "50 FEET", "50 FEET"]);
  });

  it("retains every measurement when unequal lists leave more than one unresolved row", () => {
    const scene = buildMatrix({ type: "metes_bounds", elements: [
      { aspect: "bearings", value: "NORTH; EAST; SOUTH; WEST" },
      { aspect: "distances", value: "100 FEET; 50 FEET" },
    ] }, "Parcel");
    expect(scene.courses).toHaveLength(4);
    expect(scene.courses?.map(course => course.distance)).toEqual(["100 FEET", "50 FEET", undefined, undefined]);
    expect(scene.courses?.slice(0, 2).every(course => course.confirmed)).toBe(true);
    expect(scene.courses?.slice(2).every(course => !course.confirmed)).toBe(true);
    expect(scene.closed).not.toBe(true);
  });

  it("keeps a collinear traverse unfilled after all matching stages", () => {
    const scene = buildMatrix({ type: "metes_bounds", elements: [
      { aspect: "bearings", value: "NORTH 100 FEET; SOUTH 100 FEET; NORTH 50 FEET; SOUTH 50 FEET" },
    ] }, "Parcel");
    expect(scene.closed).not.toBe(true);
    expect(scene.courses).toHaveLength(4);
  });

  it("retains three confirmed supplied pairs and one calculated border for the reported session", () => {
    const original = JSON.stringify(matrixFixture);
    const scene = buildMatrix(matrixFixture, "Parcel");
    expect(scene.courses).toHaveLength(4);
    expect(scene.courses?.filter(course => course.confirmed).map(course => course.distance)).toEqual(["225 FEET", "54 FEET", "350 FEET"]);
    expect(scene.courses?.filter(course => !course.confirmed)).toHaveLength(1);
    expect(scene.courses?.map(course => course.confirmed)).toEqual([true, true, false, true]);
    expect(scene.courses?.find(course => !course.confirmed)?.distance).toBe("400 FEET");
    expect(scene.courses?.find(course => !course.confirmed)?.issue).toMatch(/calculated.*400/i);
    expect(scene.courses?.find(course => !course.confirmed)?.bearing).toMatch(/^S \d+°\d+′\d+\.\d{2}″ E \(calculated\)$/);
    expect(parseBearing(scene.courses!.find(course => !course.confirmed)!.bearing.replace(" (calculated)", ""))).toBeCloseTo(147.69394735, 5);
    expect(scene.closed).toBe(true);
    expect(scene.items.filter(item => item.kind === "line")).toHaveLength(4);
    expect(JSON.stringify(matrixFixture)).toBe(original);
    expect(buildMatrix(matrixFixture, "Parcel")).toEqual(scene);
    expect(buildBoundary(matrixFixture, "Parcel").courses?.map(course => [course.bearing, course.distance, course.confirmed])).toEqual([
      ["North", '72" 45\'', false], ["South 17º 15' West", undefined, false],
    ]);
  });

  it("reorders crossing borders before changing any supplied bearing-distance pair", () => {
    const scene = buildMatrix({ type: "metes_bounds", elements: [{ aspect: "bearings", value: "NORTH 100 FEET; SOUTH 100 FEET; EAST 50 FEET; WEST 50 FEET" }] }, "Parcel");
    expect(scene.closed).toBe(true);
    expect(scene.courses?.map(course => [course.bearing, course.distance])).toEqual([
      ["NORTH", "100 FEET"], ["EAST", "50 FEET"], ["SOUTH", "100 FEET"], ["WEST", "50 FEET"],
    ]);
    expect(scene.courses?.every(course => course.confirmed)).toBe(true);
  });

  it("retries sequence pairs only after the original pairs cannot close in any order", () => {
    const scene = buildMatrix({ type: "metes_bounds", elements: [
      { aspect: "bearings", value: "NORTH; EAST; SOUTH 53.13010235415598 DEGREES WEST" },
      { aspect: "distances", value: "40 FEET; 30 FEET; 50 FEET" },
    ] }, "Parcel");
    expect(scene.closed).toBe(true);
    expect(scene.courses?.map(course => course.distance)).toEqual(["30 FEET", "40 FEET", "50 FEET"]);
    expect(scene.items[0].detail).toBe("NORTH · 30 FEET");
    expect(scene.courses?.every(course => course.confirmed)).toBe(true);
  });

  it.each([
    [30, 40, 50], [30, 50, 40], [40, 30, 50], [40, 50, 30], [50, 30, 40], [50, 40, 30],
  ])("resolves the unique 30-40-50 triangle from distances %s, %s, %s", (first, second, third) => {
    const scene = buildMatrix({ type: "metes_bounds", elements: [
      { aspect: "bearings", value: "NORTH; EAST; SOUTH 53.13010235415598 DEGREES WEST" },
      { aspect: "distances", value: `${first} FEET; ${second} FEET; ${third} FEET` },
    ] }, "Parcel");
    expect(scene.closed).toBe(true);
    expect(scene.courses?.map(course => course.distance)).toEqual(["30 FEET", "40 FEET", "50 FEET"]);
    expect(scene.courses?.every(course => course.confirmed)).toBe(true);
  });

  it("does not select between different valid shapes from alternative pairings", () => {
    const scene = buildMatrix({ type: "metes_bounds", elements: [
      { aspect: "bearings", value: "NORTH; EAST; SOUTH; WEST" },
      { aspect: "distances", value: "100 FEET; 100 FEET; 50 FEET; 50 FEET" },
    ] }, "Parcel");
    expect(scene.closed).not.toBe(true);
    expect(scene.issue).toMatch(/multiple.*shape/i);
    expect(scene.courses?.every(course => !course.confirmed)).toBe(true);
  });

  it("exhausts unmatched assignments for the existing nine-course case without inventing closure", () => {
    const group = incompleteFixture.groups![1];
    const distances = group.elements!.find(element => element.aspect === "distances")!.value!.split(";").map(value => value.trim());
    const rotated = [...distances.slice(1), distances[0]];
    const input = { ...group, source: undefined, elements: group.elements!.map(element => element.aspect === "distances" ? { ...element, value: rotated.join("; ") } : element) };
    const original = JSON.stringify(input);
    const scene = buildMatrix(input, "Parcel");
    expect(scene.closed).not.toBe(true);
    expect(scene.courses?.map(course => course.distance)).toEqual(rotated);
    expect(JSON.stringify(input)).toBe(original);
  });

  it("does not select between different simple outlines when reordering complete pairs", () => {
    const scene = buildMatrix({ type: "metes_bounds", elements: [{ aspect: "bearings", value: "NORTH 100 FEET; SOUTH 50 FEET; EAST 100 FEET; WEST 50 FEET; SOUTH 50 FEET; WEST 50 FEET" }] }, "Parcel");
    expect(scene.closed).not.toBe(true);
    expect(scene.issue).toMatch(/multiple.*shape/i);
    expect(scene.courses?.every(course => !course.confirmed)).toBe(true);
  });

  it("keeps an already valid supplied outline before trying alternative orders", () => {
    const values = ["NORTH 100 FEET", "EAST 100 FEET", "SOUTH 50 FEET", "WEST 50 FEET", "SOUTH 50 FEET", "WEST 50 FEET"];
    const scene = buildMatrix({ type: "metes_bounds", elements: [{ aspect: "bearings", value: values.join("; ") }] }, "Parcel");
    expect(scene.closed).toBe(true);
    expect(scene.issue).toBeUndefined();
    expect(scene.courses?.map(course => `${course.bearing} ${course.distance}`)).toEqual(values);
  });

  it.each([0.01, 1, 1000])("keeps matching and closure proportional at scale %s", scale => {
    const scene = buildMatrix({ type: "metes_bounds", elements: [
      rectangle.elements![0], { aspect: "distances", value: `${100 * scale} FEET; ${50 * scale} FEET; ${100 * scale} FEET; ${50 * scale} FEET` },
    ] }, "Parcel");
    expect(scene.closed).toBe(true);
    expect(scene.courses?.every(course => course.confirmed)).toBe(true);
  });

  it.each(["0 FEET", "-10 FEET", "12 UNKNOWN"])("keeps invalid measurements unconfirmed without repairing %s", distance => {
    const scene = buildMatrix({ type: "metes_bounds", elements: [
      { aspect: "bearings", value: "NORTH; EAST; SOUTH; WEST" },
      { aspect: "distances", value: `100 FEET; ${distance}; 100 FEET; 50 FEET` },
    ] }, "Parcel");
    expect(scene.courses?.[1].confirmed).toBe(false);
    expect(scene.closed).not.toBe(true);
  });

  it("does not turn malformed angle units into a distance or repair invalid DMS", () => {
    const scene = buildMatrix({ type: "metes_bounds", elements: [
      { aspect: "bearings", value: 'NORTH 72" 45\' WEST; SOUTH 17° 75\' WEST' },
      { aspect: "distances", value: "225 FEET; 54 FEET" },
    ] }, "Parcel");
    expect(scene.courses?.map(course => course.distance)).toEqual(["225 FEET", "54 FEET"]);
    expect(scene.courses?.every(course => !course.confirmed)).toBe(true);
  });

  it.each([metesFixture, { groups: [curveFixture.groups.find(group => group.type === "metes_bounds")!] }, { groups: [sectionFixture.groups.find(group => group.type === "metes_bounds")!] }])("preserves source curves, ties and explicit source course sequences", legal => {
    const group = legal.groups.find(group => group.type === "metes_bounds")!;
    const sourceOnly = { ...group, elements: group.elements?.filter(element => element.aspect !== "bearings" && element.aspect !== "distances") };
    expect(buildMatrix(sourceOnly, "Parcel")).toEqual(buildBoundary(sourceOnly, "Parcel"));
  });

  it("renders the new session path with three confirmed rows, a calculated tooltip, and one dashed border", async () => {
    render(<LegalMapContent legal={{ parcels_num: 1, groups: [matrixFixture] }} />);
    const table = screen.getByRole("table", { name: "Boundary Calls" });
    expect(within(table).getAllByText("Confirmed")).toHaveLength(3);
    expect(within(table).getAllByRole("button", { name: "Unconfirmed" })).toHaveLength(1);
    expect(document.querySelectorAll("[data-survey-line]")).toHaveLength(4);
    expect(document.querySelectorAll('[data-survey-line][data-unconfirmed="true"]')).toHaveLength(1);
    fireEvent.focus(within(table).getByRole("button", { name: "Unconfirmed" }));
    expect(await screen.findByRole("tooltip")).toHaveTextContent(/calculated/i);
  });
});
