import { describe, expect, it } from "vitest";
import type { LegalGroup } from "aurora-core";
import { buildBoundary, buildPlss, parseBearing, parseDistance } from "../data/surveyData";
import { incompleteFixture } from "./surveyFixture";

const boundary = (bearings: string, distances: string): LegalGroup => ({ type: "metes_bounds", elements: [
  { aspect: "bearings", value: bearings }, { aspect: "distances", value: distances },
  { aspect: "acreage", value: "Reported: 2 acres" },
] });

describe("schematic bearings and distances", () => {
  it.each([
    ["N", 0], ["East", 90], ["South", 180], ["W", 270], ["NE", 45],
    ["N 30° E", 30], ["S 30 E", 150], ["S 30 W", 210], ["N 30 W", 330],
    ["North 45 degrees East", 45], ["N 45°30′30″ E", 45.50833333333333],
    ["N 45 30 30 E", 45.50833333333333], ["Azimuth 123.5°", 123.5],
  ])("parses %s", (source, angle) => expect(parseBearing(source)).toBeCloseTo(angle));

  it.each(["", "N 91 E", "N 20°60′ E", "N 20°10′60″ E", "361", "-10", "curve right", "north along road", "N 10 E junk"])("keeps unsupported bearing %s unresolved", source => {
    expect(parseBearing(source)).toBeNull();
  });

  it.each([
    ["100 ft", 30.48], ["100 feet", 30.48], ["30.48 m", 30.48], ["10 yards", 9.144],
    ["1 chain", 20.1168], ["1 rod", 5.0292], ["1 mile", 1609.344], ["12 inches", 0.3048],
    ["1,000 feet", 304.8], ["25", 25], ["0 ft", 0],
  ])("parses distance %s", (source, value) => expect(parseDistance(source)?.length).toBeCloseTo(value));

  it.each(["", "-1 ft", "12 unknown", "about 100 feet", "100 ft extra", "1e309", `${"9".repeat(308)} miles`])("does not invent distance %s", source => {
    expect(parseDistance(source)).toBeNull();
  });
});

describe("metes and bounds schematics", () => {
  it("reports mismatched counts without creating courses or individual success states", () => {
    const group = incompleteFixture.groups![0];
    const original = JSON.stringify(group);
    const scene = buildBoundary(group, "Parcel 1");
    expect(scene.issue).toBe("Cannot map: 5 bearings and 8 distances cannot be paired.");
    expect(scene.items).toEqual([]);
    expect(JSON.stringify(group)).toBe(original);
  });

  it("keeps bearing component punctuation and reports unreadable minutes without correcting them", () => {
    const scene = buildBoundary(boundary("SOUTH 0 DEGREES, 14 MINUTES EAST; NORTH 89 DEGREES, 57 MINUTES EAST; NORTH 89 DEGREES 67 MINUTES EAST", "788.0 FEET; 420.0 FEET; 239.4 FEET"), "Parcel 1");
    expect(scene.issue).toBe('Cannot map: bearing 3 could not be read ("NORTH 89 DEGREES 67 MINUTES EAST").');
    expect(scene.items).toEqual([]);
    expect(parseBearing("NORTH 89 DEGREES, 57 MINUTES EAST")).toBeCloseTo(89.95);
  });

  it.each([
    ["N; curve along river; E", "100 ft; 20 ft; 50 ft", 'Cannot map: bearing 2 could not be read ("curve along river").'],
    ["N; E", "100 ft; invalid", 'Cannot map: distance 2 could not be read ("invalid").'],
    ['["N",]', "100", 'Cannot map: bearing 1 could not be read ("[\"N\",]").'],
    ["[]", "[]", "Cannot map: no bearing and distance pairs were provided."],
    ["N; E", "100 ft; 20", "Cannot map: some distances have units and others do not."],
  ])("reports why courses cannot be mapped: %s / %s", (bearings, distances, issue) => {
    const group = boundary(bearings, distances);
    const original = JSON.stringify(group);
    const scene = buildBoundary(group, "Parcel 1");
    expect(scene.issue).toBe(issue);
    expect(scene.items).toEqual([]);
    expect(scene.notes).toContainEqual({ label: "Bearings", value: bearings });
    expect(scene.notes).toContainEqual({ label: "Distances", value: distances });
    expect(JSON.stringify(group)).toBe(original);
  });

  it("uses converted bearings for complete pairs and preserves their geometry", () => {
    const scene = buildBoundary(boundary("NORTH 45 DEGREES EAST; SOUTH 45 DEGREES EAST", "100 ft; 100 ft"), "Parcel 2");
    const lines = scene.items.filter(item => item.kind === "line");
    expect(lines.map(line => line.bearing)).toEqual(["N 45°E", "S 45°E"]);
    expect(lines[0].to.x).toBeCloseTo(Math.SQRT1_2);
    expect(lines[0].to.y).toBeCloseTo(-Math.SQRT1_2);
    expect(scene.issue).toBeUndefined();
  });

  it("pairs complete lists by position, preserves repeats, and leaves the outline open", () => {
    const group = boundary("N; E; S; E", "100 ft; 50 ft; 100 ft; 50 ft");
    const original = JSON.stringify(group);
    const scene = buildBoundary(group, "Metes & Bounds");
    const lines = scene.items.filter(item => item.kind === "line");
    expect(lines).toHaveLength(4);
    expect(lines.map(item => item.detail)).toEqual(["N · 100 ft", "E · 50 ft", "S · 100 ft", "E · 50 ft"]);
    expect(lines[1].from).toEqual(lines[0].to);
    expect(lines[3].to.x).toBeCloseTo(1);
    expect(lines[3].to.y).toBeCloseTo(0);
    expect(lines[3].to).not.toEqual(lines[0].from);
    expect(scene.notes).toContainEqual({ label: "Acreage", value: "Reported: 2 acres" });
    expect(JSON.stringify(group)).toBe(original);
    expect(buildBoundary(group, "Metes & Bounds")).toEqual(scene);
  });

  it.each([
    ["[\"N\",\"E\"]", "[100,50]"], ["N, E", "100, 50"], ["N\nE", "100\n50"],
  ])("reads existing text list formats without reordering", (bearings, distances) => {
    expect(buildBoundary(boundary(bearings, distances), "Boundary").items.filter(item => item.kind === "line")).toHaveLength(2);
  });

  it("retains repeated aspect entries in source order", () => {
    const scene = buildBoundary({ elements: [
      { aspect: "bearings", value: "N" }, { aspect: "distances", value: "10" },
      { aspect: "bearings", value: "N" }, { aspect: "distances", value: "10" },
    ] }, "Boundary");
    expect(scene.items.filter(item => item.kind === "line")).toHaveLength(2);
  });

  it.each([
    ["N; E", "100"], ["N; unsupported; E", "100; 50; 100"], ["N; E", "100; invalid"],
    ["[]", "[]"], ["[\"N\",]", "100"], ["N; E", "100 feet; 50"],
  ])("shows available data without invented pairs: %s / %s", (bearings, distances) => {
    const scene = buildBoundary(boundary(bearings, distances), "Boundary");
    expect(scene.items.filter(item => item.kind === "line")).toHaveLength(0);
    expect(scene.notes).toContainEqual({ label: "Bearings", value: bearings });
    expect(scene.notes).toContainEqual({ label: "Distances", value: distances });
    expect(scene.items).toEqual([]);
  });

  it("retains curve source data without a placeholder or substituted line", () => {
    const scene = buildBoundary(boundary("N; curve right radius 50 feet; E", "100 ft; 20 ft; 100 ft"), "Boundary");
    expect(scene.notes.find(note => note.label === "Bearings")?.value).toContain("curve");
    expect(scene.items).toEqual([]);
    expect(scene.items.some(item => item.kind === "line")).toBe(false);
  });

  it("uses a common scale for explicitly mixed units", () => {
    const scene = buildBoundary(boundary("N; E", "100 feet; 30.48 meters"), "Boundary");
    const lines = scene.items.filter(item => item.kind === "line");
    expect(Math.abs(lines[0].to.y)).toBeCloseTo(lines[1].to.x);
  });

  it("supports arbitrary course counts and all-zero data without nonfinite geometry", () => {
    for (const count of [1, 7, 57]) {
      const scene = buildBoundary(boundary(Array(count).fill("NE").join(";"), Array(count).fill("0").join(";")), "Boundary");
      expect(scene.items.filter(item => item.kind === "line")).toHaveLength(count);
      expect(JSON.stringify(scene)).not.toMatch(/NaN|Infinity/);
    }
  });

  it("normalizes large finite lengths before constructing proportional geometry", () => {
    const scene = buildBoundary(boundary("E; E; W", Array(3).fill(`${"9".repeat(307)} m`).join(";")), "Boundary");
    const lines = scene.items.filter(item => item.kind === "line");
    expect(lines[2].to.x).toBeCloseTo(1);
    expect(lines.every(item => Number.isFinite(item.to.x) && Number.isFinite(item.to.y))).toBe(true);
  });
});

describe("PLSS schematics", () => {
  it("shows complete six-column rows around Section 16, including sections 11 through 14", () => {
    const scene = buildPlss({ elements: [{ aspect: "aliquots", value: "NW1/4 of Section 16" }] }, "PLSS");
    expect(scene.items.filter(item => item.kind === "rect" && item.role === "section").map(item => item.label)).toEqual([
      "7", "8", "9", "10", "11", "12",
      "18", "17", "16", "15", "14", "13",
      "19", "20", "21", "22", "23", "24",
    ]);
  });
  it.each(Array.from({ length: 36 }, (_, index) => index + 1))("preserves the township position of Section %s", number => {
    const scene = buildPlss({ elements: [{ aspect: "aliquots", value: `Section ${number}` }] }, "PLSS");
    const row = Math.floor((number - 1) / 6);
    const column = row % 2 === 0 ? 5 - (number - 1) % 6 : (number - 1) % 6;
    const sections = scene.items.filter(item => item.kind === "rect" && item.role === "section");
    expect(sections).toHaveLength((row === 0 || row === 5 ? 2 : 3) * 6);
    expect(sections.find(item => item.label === String(number))).toMatchObject({ x: column * 100, y: row * 100, width: 100, height: 100, highlighted: true });
  });

  it.each([
    "SE1/4 of Section 1", "NW1/4 of Section 6", "SW1/4 of Section 31", "NE1/4 of Section 36",
    "NE1/4 of SW1/4 of Section 12", "Part of NE1/4 of Section 8", "SE1/4", "NW1/4",
    "NE1/4 of Section 12 and SW1/4 of Section 13",
  ])("retains complete surrounding sections without moving aliquots for %s", value => {
    const group = { type: "plss", elements: [{ aspect: "aliquots", value }] };
    const original = JSON.stringify(group);
    const scene = buildPlss(group, "PLSS");
    const areas = scene.items.filter((item): item is Extract<typeof item, { kind: "rect" }> => item.kind === "rect" && item.role === "area");
    const sections = scene.items.filter((item): item is Extract<typeof item, { kind: "rect" }> => item.kind === "rect" && item.role === "section");
    expect(sections.filter(section => section.highlighted)).toHaveLength(new Set(areas.map(area => area.label)).size);
    for (const section of sections) {
      expect(section.highlighted).toBe(areas.some(area => area.label === section.detail));
      expect(section).toMatchObject({ width: 100, height: 100 });
      expect(section.x).toBeGreaterThanOrEqual(0);
      expect(section.y).toBeGreaterThanOrEqual(0);
      expect(section.x + section.width).toBeLessThanOrEqual(600);
      expect(section.y + section.height).toBeLessThanOrEqual(600);
    }
    const left = Math.min(...sections.map(section => section.x));
    const top = Math.min(...sections.map(section => section.y));
    const right = Math.max(...sections.map(section => section.x + section.width));
    const bottom = Math.max(...sections.map(section => section.y + section.height));
    expect(sections.length * 10000).toBe((right - left) * (bottom - top));
    for (const area of areas) {
      const section = sections.find(section => section.detail === area.label)!;
      expect(area.x).toBeGreaterThanOrEqual(section.x);
      expect(area.y).toBeGreaterThanOrEqual(section.y);
      expect(area.x + area.width).toBeLessThanOrEqual(section.x + section.width);
      expect(area.y + area.height).toBeLessThanOrEqual(section.y + section.height);
    }
    expect(JSON.stringify(group)).toBe(original);
    expect(buildPlss(group, "PLSS")).toEqual(scene);
  });

  it("keeps the southeast subject in the southeast of the complete Section 1", () => {
    const scene = buildPlss({ elements: [{ aspect: "aliquots", value: "SE1/4 of Section 1" }] }, "PLSS");
    expect(scene.items.find(item => item.kind === "rect" && item.role === "section" && item.label === "1")).toMatchObject({ x: 500, y: 0, width: 100, height: 100 });
    expect(scene.items.find(item => item.kind === "rect" && item.role === "area")).toMatchObject({ x: 550, y: 50, width: 50, height: 50 });
    expect(scene.items.filter(item => item.kind === "rect" && item.role === "section").map(item => item.label)).toEqual(["6", "5", "4", "3", "2", "1", "7", "8", "9", "10", "11", "12"]);
  });

  it("builds a standard numbered township and nested aliquots from existing text", () => {
    const group = { type: "plss", elements: [
      { aspect: "township", value: "T2N" }, { aspect: "range", value: "R3E" },
      { aspect: "aliquots", value: "NE1/4 of SW1/4 of Section 12" },
      { aspect: "county", value: "Example County" }, { aspect: "state", value: "Colorado" },
    ] };
    const original = JSON.stringify(group);
    const scene = buildPlss(group, "PLSS");
    const sections = scene.items.filter(item => item.kind === "rect" && item.role === "section");
    expect(sections).toHaveLength(18);
    expect(sections.find(item => item.label === "12")).toMatchObject({ x: 500, y: 100, width: 100, height: 100 });
    const area = scene.items.find(item => item.kind === "rect" && item.role === "area");
    expect(area).toMatchObject({ x: 525, y: 150, width: 25, height: 25, highlighted: true });
    expect(scene.notes).toContainEqual({ label: "Township", value: "T2N" });
    expect(JSON.stringify(group)).toBe(original);
    expect(buildPlss(group, "PLSS")).toEqual(scene);
  });

  it("supports separate sections and combined aliquots", () => {
    const scene = buildPlss({ elements: [{ aspect: "aliquots", value: "NE¼ and NW¼ of Section 1; S½ of Section 2; Sections 7, 8 and 9" }] }, "PLSS");
    const areas = scene.items.filter(item => item.kind === "rect" && item.role === "area");
    expect(areas).toHaveLength(6);
    expect(areas.filter(item => item.label.includes("Section 1"))).toHaveLength(2);
  });

  it("patterns partial areas without inventing a precise partial boundary", () => {
    const scene = buildPlss({ elements: [{ aspect: "aliquots", value: "Part of NE1/4 of Section 8" }] }, "PLSS");
    expect(scene.items.find(item => item.kind === "rect" && item.role === "area")).toMatchObject({ partial: true });
  });

  it("binds each aliquot to its explicit section without adding a whole-section highlight", () => {
    const scene = buildPlss({ elements: [{ aspect: "aliquots", value: "NE1/4 of Section 12 and SW1/4 of Section 13" }] }, "PLSS");
    const areas = scene.items.filter(item => item.kind === "rect" && item.role === "area");
    expect(areas).toEqual([
      expect.objectContaining({ label: "Section 12", width: 50 }),
      expect.objectContaining({ label: "Section 13", width: 50 }),
    ]);
  });

  it.each(["W1/4 of Section 12", "NE1/3 of Section 12", "NE1/4 except SW1/4 of Section 12"])("keeps unsupported subdivision extents schematic: %s", value => {
    const scene = buildPlss({ elements: [{ aspect: "aliquots", value }] }, "PLSS");
    expect(scene.items.find(item => item.kind === "rect" && item.role === "area")).toMatchObject({ partial: true, width: 100, height: 100 });
  });

  it.each(["Section 0", "Section 37", "a government lot without a section"])("does not highlight an unidentified section: %s", value => {
    const scene = buildPlss({ elements: [{ aspect: "aliquots", value }] }, "PLSS");
    expect(scene.items.some(item => item.kind === "rect" && item.highlighted)).toBe(false);
    expect(scene.issue).toBe("Cannot map: no section or aliquot could be resolved.");
    expect(scene.notes.some(note => note.value === value)).toBe(true);
  });

  it("keeps government lots and fractional descriptions symbolic", () => {
    for (const type of ["government_lot", "fractional_section"]) {
      const scene = buildPlss({ type, elements: [{ aspect: "description", value: "Lot 4, Section 6" }] }, "PLSS");
      expect(scene.items.some(item => item.kind === "rect" && item.role === "area" && item.partial)).toBe(true);
      expect(scene.notes).toContainEqual({ label: "Description", value: "Lot 4, Section 6" });
    }
  });
});
