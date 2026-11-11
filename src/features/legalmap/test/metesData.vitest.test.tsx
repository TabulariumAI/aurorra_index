import type { LegalGroup } from "aurora-core";
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { matrixFixture } from "./matrixFixture";
import { LegalMapContent } from "../component/LegalMapContent";
import { buildMatrix, parseBearing, parseDistance, reconstructBoundary } from "../data/metesData";

const source = "BEGINNING at a pin; NORTH 100 FEET; EAST 50 FEET; SOUTH 100 FEET; WEST 50 FEET to the point of beginning.";

describe("Metes input coverage", () => {
  it.each(["bearings", "distances"])("reads inline pairs and repeated entries from %s", aspect => {
    const group: LegalGroup = { type: "metes_bounds", elements: [{ aspect, value: "NORTH 40 FEET; 60 FEET NORTH; EAST 50 FEET; SOUTH 100 FEET; WEST 50 FEET" }] };
    const original = JSON.stringify(group);
    const scene = buildMatrix(group, "Parcel");
    expect(scene.closed).toBe(true);
    expect(scene.courses.map(course => course.distance)).toEqual(["40 FEET", "60 FEET", "50 FEET", "100 FEET", "50 FEET"]);
    expect(scene.courses.every(course => !course.confirmed)).toBe(true);
    expect(JSON.stringify(group)).toBe(original);
  });

  it.each([false, true])("pairs separate fields by sequence with swapped fields=%s", swapped => {
    const scene = buildMatrix({ type: "metes_bounds", elements: [
      { aspect: swapped ? "distances" : "bearings", value: "NORTH; EAST; SOUTH; WEST" },
      { aspect: swapped ? "bearings" : "distances", value: "100 FEET; 50 FEET; 100 FEET; 50 FEET" },
    ] }, "Parcel");
    expect(scene.closed).toBe(true);
    expect(scene.courses.map(course => course.bearing)).toEqual(["NORTH", "EAST", "SOUTH", "WEST"]);
    expect(scene.courses.map(course => course.distance)).toEqual(["100 FEET", "50 FEET", "100 FEET", "50 FEET"]);
  });

  it.each(["", "UNREADABLE"])("retains the unreadable %s entry without shifting distances", value => {
    const scene = buildMatrix({ type: "metes_bounds", elements: [
      { aspect: "bearings", value: JSON.stringify(["NORTH", value, "SOUTH", "WEST"]) },
      { aspect: "distances", value: "100 FEET; 50 FEET; 100 FEET; 50 FEET" },
    ] }, "Parcel", { allowSchematic: false });
    expect(scene.closed).toBe(false);
    expect(scene.courses.map(course => course.distance)).toEqual(["100 FEET", "50 FEET", "100 FEET", "50 FEET"]);
    expect(scene.courses[1].confirmed).toBe(false);
  });

  it.each(["0 FEET", "-10 FEET", "12 UNKNOWN"])("retains invalid distance %s for review", value => {
    const scene = buildMatrix({ type: "metes_bounds", elements: [
      { aspect: "bearings", value: "NORTH; EAST; SOUTH; WEST" },
      { aspect: "distances", value: `100 FEET; ${value}; 100 FEET; 50 FEET` },
    ] }, "Parcel", { allowSchematic: false });
    expect(scene.closed).toBe(false);
    expect(scene.courses[1]).toMatchObject({ distance: value, confirmed: false });
    expect(scene.courses).toHaveLength(4);
  });

  it("retains partial source calls in their original positions in strict mode", () => {
    const scene = buildMatrix({ type: "metes_bounds", source: source.replace("EAST 50 FEET", "EAST to a pin") }, "Parcel", { allowSchematic: false });
    expect(scene.closed).toBe(false);
    expect(scene.courses.map(course => course.bearing)).toEqual(["NORTH", "EAST", "SOUTH", "WEST"]);
    expect(scene.courses[1]).toMatchObject({ confirmed: false, issue: "Distance is missing or unreadable." });
    expect(scene.items.map(line => line.sequence)).toEqual([1, 3, 4]);
  });

  it("does not treat equivalent feet and inches as a source conflict", () => {
    const scene = buildMatrix({ type: "metes_bounds", source: source.replaceAll("100 FEET", "1 FOOT").replaceAll("50 FEET", "1 FOOT"),
      elements: [{ aspect: "bearings", value: "NORTH 12 INCHES; EAST 12 INCHES; SOUTH 12 INCHES; WEST 12 INCHES" }],
    }, "Parcel");
    expect(scene.closed).toBe(true);
    expect(scene.issue).toBeUndefined();
    expect(scene.courses.every(course => course.confirmed)).toBe(true);
  });

  it("merges equivalent units across fields without duplicating measurements", () => {
    const scene = buildMatrix({ type: "metes_bounds", elements: [
      { aspect: "bearings", value: "NORTH 1 FOOT; EAST 1 FOOT; SOUTH 1 FOOT; WEST 1 FOOT" },
      { aspect: "distances", value: "12 INCHES; 12 INCHES; 12 INCHES; 12 INCHES" },
    ] }, "Parcel");
    expect(scene.closed).toBe(true);
    expect(scene.courses).toHaveLength(4);
  });

  it("reads boundary calls after witness-corner endpoint text", () => {
    const scene = buildMatrix({ type: "metes_bounds", source: source.replace("NORTH 100 FEET", "NORTH 100 FEET TO A WITNESS CORNER") }, "Parcel");
    expect(scene.closed).toBe(true);
    expect(scene.courses.map(course => course.bearing)).toEqual(["NORTH", "EAST", "SOUTH", "WEST"]);
  });

  it("excludes accessory monument bearings from the parcel", () => {
    const scene = buildMatrix({ type: "metes_bounds", source: source.replace("EAST 50 FEET", "from which a pin BEARS NORTH 45 DEGREES EAST 10 FEET; EAST 50 FEET") }, "Parcel");
    expect(scene.closed).toBe(true);
    expect(scene.courses).toHaveLength(4);
  });

  it("prefers complete source measurements over contradictory extracted pairs", () => {
    const scene = buildMatrix({ type: "metes_bounds", source, elements: [{ aspect: "bearings", value: "NORTH 200 FEET; EAST 50 FEET; SOUTH 200 FEET; WEST 50 FEET" }] }, "Parcel");
    expect(scene.courses.map(course => course.distance)).toEqual(["100 FEET", "50 FEET", "100 FEET", "50 FEET"]);
    expect(scene.issue).toMatch(/contradict.*source/i);
  });

  it("inherits an explicit unit while retaining blank entries", () => {
    const scene = buildMatrix({ type: "metes_bounds", elements: [
      { aspect: "bearings", value: '["NORTH","EAST","SOUTH","WEST"]' },
      { aspect: "distances", value: '[100,"",100,"50 FEET"]' },
    ] }, "Parcel", { allowSchematic: false });
    expect(parseDistance(scene.courses[0].distance!)).toBeCloseTo(30.48);
    expect(scene.courses[1].confirmed).toBe(false);
    expect(scene.courses[2].distance).toBe("100 FEET");
  });

  it.each(["POINT", "PLACE"])("retains the explicit %s OF BEGINNING after a tie", marker => {
    const scene = buildMatrix({ type: "metes_bounds", source: `COMMENCING at a monument; EAST 20 FEET to the ${marker} OF BEGINNING; ` + source }, "Parcel");
    expect(scene).toMatchObject({ closed: true, beginning: 1, ending: 5 });
    expect(scene.courses.every(course => course.confirmed)).toBe(true);
  });

  it("keeps full numeric precision and measured misclosure in the drawing", () => {
    const scene = buildMatrix({ type: "metes_bounds", source: source.replace("WEST 50 FEET", "WEST 49.999 FEET") }, "Parcel");
    expect(scene.closed).toBe(true);
    expect(scene.closureMetres).toBeCloseTo(0.0003048, 10);
    render(<LegalMapContent legal={{ parcels_num: 1, groups: [{ type: "metes_bounds", source: source.replace("WEST 50 FEET", "WEST 49.999 FEET") }] }} />);
    expect(document.querySelectorAll("[data-survey-line]")[3]).toHaveAttribute("x2", String(scene.items[3].to.x));
    expect(scene.items[3].to.x).not.toBe(0);
  });

  it("keeps one unsupported closing side visibly unconfirmed", () => {
    const group = { type: "metes_bounds", source: source.slice(0, source.indexOf("WEST 50 FEET")) };
    render(<LegalMapContent legal={{ parcels_num: 1, groups: [group] }} />);
    expect(screen.getByRole("table", { name: "Boundary Calls" })).toBeVisible();
    const table = screen.getByRole("table", { name: "Boundary Calls" });
    expect(within(table).getAllByRole("button", { name: "Unconfirmed" })).toHaveLength(1);
    expect(document.querySelectorAll('[data-survey-line][data-unconfirmed="true"]')).toHaveLength(1);
    expect(document.querySelector("[data-boundary-fill]")).toHaveAttribute("fill-opacity", "0.12");
  });

  it.each([
    "THENCE SOUTH 45 DEGREES EAST 14.142135623731 METERS; THENCE WEST 10 METERS; THENCE NORTH 45 DEGREES EAST 14.142135623731 METERS; THENCE WEST 10 METERS.",
    "THENCE NORTH 100 FEET; THENCE SOUTH 100 FEET; THENCE WEST 50 FEET; THENCE EAST 50 FEET.",
    "THENCE NORTH 100 FEET; THENCE EAST 50 FEET; THENCE SOUTH 50 FEET; THENCE WEST 25 FEET; THENCE NORTH 25 FEET; THENCE WEST 25 FEET; THENCE SOUTH 75 FEET.",
  ])("does not fill crossing, degenerate or touching source geometry: %s", source => {
    const result = reconstructBoundary({ source, bearings: [], distances: [], allowSchematic: false });
    expect(result.closed).toBe(false);
    expect(result.courses.some(course => course.synthetic)).toBe(false);
  });

  it("retains source-supported field associations and leaves the unknown 400-foot bearing unassigned", () => {
    const scene = buildMatrix(matrixFixture, "Parcel");
    expect(scene.closed).toBe(true);
    expect(scene.courses.filter(course => !course.unassigned && !/synthetic closing/i.test(course.issue ?? "")).map(course => course.distance)).toEqual(["225 FEET", "54 FEET", "350 FEET"]);
    expect(scene.courses.filter(course => course.distance === "400 FEET")).toEqual([expect.objectContaining({ unassigned: true, confirmed: false })]);
  });

  it("uses only a single distance swap while preserving bearing order", () => {
    const result = reconstructBoundary({ bearings: ["NORTH; EAST; SOUTH 53.13010235415598 DEGREES WEST"], distances: ["50 FEET; 40 FEET; 30 FEET"] });
    expect(result.closed).toBe(true);
    expect(result.completion).toBe("measured");
    expect(result.courses.map(course => course.distance)).toEqual(["30 FEET", "40 FEET", "50 FEET"]);
    expect(result.courses.map(course => parseBearing(course.bearing))).toEqual([0, 90, 233.13010235415598]);
  });
});
