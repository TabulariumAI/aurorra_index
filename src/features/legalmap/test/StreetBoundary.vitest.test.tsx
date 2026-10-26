import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LegalMapContent } from "../component/LegalMapContent";
import { buildBoundary, getMapGroups, parseDistance, parseMetesAndBounds, parseStreetRelativeBoundary } from "../data/surveyData";
import { streetFixture } from "./streetFixture";

const group = streetFixture.groups[0];
const bearings = group.elements[0].value;
const distances = group.elements[1].value;
const failure = "Sorry, this parcel’s boundary couldn’t be drawn from the available details.";

describe("street-relative boundary fallback", () => {
  it("returns no Metes courses and a street-relative result for the Ruby Street description", () => {
    expect(parseMetesAndBounds(group)).toEqual([]);
    const result = parseStreetRelativeBoundary(group);
    expect(result).not.toBeNull();
    expect(result!.map(course => course.distance)).toEqual(["16 ft", "59 ft 8 in", "16 ft", "59 ft 8 in"]);
  });

  it("draws only frontage and depth as an unconfirmed rectangle without mutating input", () => {
    const original = JSON.stringify(group);
    const scene = buildBoundary(group, "Parcel");
    const lines = scene.items.filter(item => item.kind === "line");
    expect(lines).toHaveLength(4);
    expect(lines.map(line => line.sequence)).toEqual([1, 2, 3, 4]);
    expect(lines.map(line => Math.hypot(line.to.x - line.from.x, line.to.y - line.from.y))).toEqual([
      expect.closeTo(16 * 0.3048), expect.closeTo((59 + 8 / 12) * 0.3048),
      expect.closeTo(16 * 0.3048), expect.closeTo((59 + 8 / 12) * 0.3048),
    ]);
    expect(lines[1].to.x).toBeGreaterThan(lines[1].from.x);
    expect(lines.at(-1)!.to.x).toBeCloseTo(0);
    expect(lines.at(-1)!.to.y).toBeCloseTo(0);
    expect(lines.every(line => !line.confirmed)).toBe(true);
    expect(scene.courses!.every(course => !course.confirmed && Boolean(course.issue))).toBe(true);
    expect(scene.schematic).toBe(true);
    expect(scene.closed).not.toBe(true);
    expect(scene.beginning).toBeUndefined();
    expect(scene.ending).toBe(4);
    expect(scene.courses!.at(-1)!.target).toBe(1);
    expect(scene.issue).toMatch(/schematic/i);
    expect(scene.notes.map(note => note.value)).toEqual([bearings, distances]);
    expect(JSON.stringify(group)).toBe(original);
    expect(getMapGroups(streetFixture)[0].scene).toEqual(buildBoundary(group, "Metes & Bounds"));
  });

  it("reads the same supplied description from source and tolerates matching extracted fields", () => {
    const source = `${bearings}; ${distances}`;
    expect(parseStreetRelativeBoundary({ type: "metes_bounds", source })).toEqual(parseStreetRelativeBoundary(group));
    expect(parseStreetRelativeBoundary({ ...group, source })).toEqual(parseStreetRelativeBoundary(group));
  });

  it("matches source and extracted bearings independently of case and whitespace", () => {
    const source = `${bearings.toLowerCase().replaceAll(" ", "  ")}; ${distances}`;
    expect(parseStreetRelativeBoundary({ ...group, source })).not.toBeNull();
  });

  it("compares repeated source and extracted dimensions by their measured length", () => {
    const source = `${bearings}; 16 FEET FRONTAGE; 59 FEET 8 INCHES DEPTH`;
    expect(parseStreetRelativeBoundary({ ...group, source })).not.toBeNull();
  });

  it("rejects conflicting street sides instead of selecting the matching side", () => {
    expect(parseStreetRelativeBoundary({ ...group, source: "W SIDE OF RUBY STREET" })).toBeNull();
  });

  it("preserves complete primary-parser results when street-relative details coexist", () => {
    const source = "NORTH 100 FEET; EAST 50 FEET; SOUTH 100 FEET; WEST 50 FEET.";
    const scene = buildBoundary({ ...group, source }, "Parcel");
    const original = buildBoundary({ type: "metes_bounds", source }, "Parcel");
    expect(scene.items).toEqual(original.items);
    expect(scene.courses).toEqual(original.courses);
    expect(scene.courses!.map(course => course.distance)).toEqual(["100 FEET", "50 FEET", "100 FEET", "50 FEET"]);
    expect(scene.courses!.every(course => course.confirmed)).toBe(true);
    expect(scene.closed).toBe(true);
    expect(scene.schematic).not.toBe(true);
  });

  it("preserves partial primary-parser results instead of replacing them with a rectangle", () => {
    const scene = buildBoundary({ ...group, source: "NORTH 100 FEET; EAST TO A PIN." }, "Parcel");
    expect(scene.courses).toHaveLength(1);
    expect(scene.courses![0].distance).toBe("100 FEET");
    expect(scene.items).toHaveLength(1);
    expect(scene.closed).not.toBe(true);
  });

  it.each([
    { type: "metes_bounds" },
    { type: "metes_bounds", source: "NORTH 100 FEET; EAST 50 FEET." },
    { type: "metes_bounds", elements: [{ aspect: "bearings", value: "E SIDE OF RUBY STREET" }, { aspect: "distances", value: distances }] },
    { type: "metes_bounds", elements: [{ aspect: "bearings", value: bearings.replace("TO RUBY", "TO ARCH") }, { aspect: "distances", value: distances }] },
    ...["16 ft FRONTAGE", "59 ft 8 in DEPTH"].map(value => ({ ...group, elements: [{ aspect: "bearings", value: bearings }, { aspect: "distances", value }] })),
    ...["0 ft FRONTAGE", "-16 ft FRONTAGE", "about 16 ft FRONTAGE", "16 FRONTAGE", "16 ft FRONTAGE; 17 ft FRONTAGE"].map(value => ({ ...group, elements: [{ aspect: "bearings", value: bearings }, { aspect: "distances", value: `${value}; 59 ft 8 in DEPTH` }] })),
  ])("returns null for unsupported or ambiguous street-relative input: %j", input => {
    expect(parseStreetRelativeBoundary(input)).toBeNull();
  });

  it("rejects conflicting source and extracted dimensions", () => {
    expect(parseStreetRelativeBoundary({ ...group, source: `${bearings}; 17 ft FRONTAGE; 59 ft 8 in DEPTH` })).toBeNull();
  });

  it("does not hide an invalid source dimension behind a valid extracted dimension", () => {
    expect(parseStreetRelativeBoundary({ ...group, source: `${bearings}; -16 ft FRONTAGE; 59 ft 8 in DEPTH` })).toBeNull();
  });

  it.each(["0 ft DEPTH", "-59 ft 8 in DEPTH", "59 ft -8 in DEPTH"])("rejects nonpositive or malformed depth: %s", value => {
    expect(parseStreetRelativeBoundary({ ...group, elements: [group.elements[0],
      { aspect: "distances", value: `16 ft FRONTAGE; ${value}` },
    ] })).toBeNull();
  });

  it.each([
    ["N", "NORTHWARD", 0, -1], ["E", "EASTWARD", 1, 0],
    ["S", "SOUTHWARD", 0, 1], ["W", "WESTWARD", -1, 0],
  ] as const)("draws the stated %s street-side depth direction without confirming orientation", (side, direction, x, y) => {
    const scene = buildBoundary({ type: "metes_bounds", elements: [
      { aspect: "bearings", value: `${side} SIDE OF RUBY STREET; ${direction} AT RIGHT ANGLES TO RUBY STREET` },
      group.elements[1],
    ] }, "Parcel");
    const lines = scene.items.filter(item => item.kind === "line");
    expect(lines).toHaveLength(4);
    expect(lines[1].to.x - lines[1].from.x).toBeCloseTo(x * (59 + 8 / 12) * 0.3048);
    expect(lines[1].to.y - lines[1].from.y).toBeCloseTo(y * (59 + 8 / 12) * 0.3048);
    expect(lines.every(line => !line.confirmed)).toBe(true);
  });

  it("requires the depth direction to agree with the stated street side", () => {
    expect(parseStreetRelativeBoundary({ ...group, elements: [
      { aspect: "bearings", value: bearings.replace("EASTWARD", "WESTWARD") }, group.elements[1],
    ] })).toBeNull();
  });

  it("uses the existing front/deep measurement vocabulary", () => {
    const result = parseStreetRelativeBoundary({ ...group, elements: [group.elements[0],
      { aspect: "distances", value: "16 ft FRONT; 59 ft 8 in DEEP" },
    ] });
    expect(result!.map(course => course.distance)).toEqual(["16 ft", "59 ft 8 in", "16 ft", "59 ft 8 in"]);
  });

  it.each(["bearings", "distances"])("preserves compound lengths in embedded %s and paired extracted lists", aspect => {
    const calls = "NORTH 16 ft; EAST 59 ft 8 in; SOUTH 16 ft; WEST 59 ft 8 in";
    const embedded = buildBoundary({ type: "metes_bounds", elements: [{ aspect, value: calls }] }, "Parcel");
    const paired = buildBoundary({ type: "metes_bounds", elements: [
      { aspect: "bearings", value: "N; E; S; W" }, { aspect: "distances", value: "16 ft; 59 ft 8 in; 16 ft; 59 ft 8 in" },
    ] }, "Parcel");
    expect(embedded.items).toHaveLength(4);
    expect(embedded.closed).toBe(true);
    expect(paired.closed).toBe(true);
    expect(paired.courses!.map(course => course.distance)).toEqual(embedded.courses!.map(course => course.distance));
  });

  it("uses the predefined message after both parsers find nothing", () => {
    const input = { type: "metes_bounds", elements: [{ aspect: "bearings", value: "E SIDE OF RUBY STREET" }, { aspect: "distances", value: distances }] };
    const scene = buildBoundary(input, "Parcel");
    expect(scene.items).toEqual([]);
    expect(scene.courses).toEqual([]);
    expect(scene.issue).toBe(failure);
    render(<LegalMapContent legal={{ parcels_num: 1, groups: [input] }} />);
    expect(screen.getByRole("alert")).toHaveTextContent(failure);
    expect(screen.getByText(distances)).toBeVisible();
    expect(document.querySelector("[data-survey-line]")).toBeNull();
  });

  it("renders four unconfirmed rows and keeps the compound depth visible without a confirmed fill", async () => {
    render(<LegalMapContent legal={streetFixture} />);
    const table = screen.getByRole("table", { name: "Boundary Calls" });
    expect(within(table).getAllByRole("row")).toHaveLength(5);
    expect(within(table).getAllByText("59 ft 8 in")).toHaveLength(2);
    expect(within(table).getAllByRole("button", { name: "Unconfirmed" })).toHaveLength(4);
    expect(within(table).queryByText(/48 ft|3 ft|2 ft 6 in/)).toBeNull();
    expect(document.querySelectorAll('[data-survey-line][data-unconfirmed="true"][stroke-dasharray="6 4"]')).toHaveLength(4);
    expect(document.querySelector("[data-boundary-fill]")).toBeNull();
    expect(screen.queryByText(failure)).toBeNull();
    expect(screen.getByRole("note")).toHaveTextContent(/schematic/i);
    expect(screen.getByRole("note")).not.toHaveTextContent("after the incomplete call");
    expect(document.querySelectorAll("[data-survey-point]")).toHaveLength(4);
    expect(within(table).getAllByRole("row").at(-1)).toHaveTextContent("4 → 1");
    fireEvent.focus(within(table).getAllByRole("button", { name: "Unconfirmed" })[0]);
    expect(await screen.findByRole("tooltip")).toHaveTextContent(/schematic/i);
  });
});

describe("compound boundary distances", () => {
  it.each(["59 ft 8 in", "59 FEET 8 INCHES", "59' 8\"", "59ft8in"])("retains both units in %s", value => {
    expect(parseDistance(value)).toBeCloseTo((59 + 8 / 12) * 0.3048);
    const scene = buildBoundary({ type: "metes_bounds", source: `EAST ${value}; NORTH 16 ft; WEST ${value}; SOUTH 16 ft.` }, "Parcel");
    expect(scene.courses!.map(course => course.distance)).toEqual([value, "16 ft", value, "16 ft."]);
    expect(scene.closed).toBe(true);
    expect(scene.courses!.every(course => course.confirmed)).toBe(true);
  });

  it.each(["59 ft -8 in", "-59 ft 8 in", "59 ft 8", "59 ft 8 in extra", "59 ft 8 m"])("rejects incomplete or invalid compound distance %s", value => {
    expect(parseDistance(value)).toBeNull();
  });

  it.each(["source", "bearings", "distances"] as const)("does not truncate an invalid compound length into a confirmed course in %s", field => {
    const calls = "EAST 59 ft -8 in; NORTH 16 ft; WEST 59 ft 8 in; SOUTH 16 ft";
    const input = field === "source" ? { type: "metes_bounds", source: calls }
      : { type: "metes_bounds", elements: [{ aspect: field, value: calls }] };
    const scene = buildBoundary(input, "Parcel");
    expect(scene.courses![0].distance).toBe("59 ft -8 in");
    expect(scene.courses![0].confirmed).toBe(false);
    expect(scene.closed).not.toBe(true);
  });
});
