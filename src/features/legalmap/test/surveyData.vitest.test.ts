import { describe, expect, it } from "vitest";
import { buildPlss } from "../data/surveyData";

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
