import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LegalMapContent } from "../component/LegalMapContent";
import { getMapGroups } from "../data/mapGroups";
import { quarterFixture, surveyFixture } from "./surveyFixture";

describe("abstract legal map presentation", () => {
  beforeEach(() => { document.documentElement.style.fontSize = "16px"; });
  afterEach(() => { vi.restoreAllMocks(); document.documentElement.style.fontSize = ""; });

  it("uses structured legal elements without reading a summary for section inference", () => {
    const legal = { groups: [{ type: "plss", elements: [{ aspect: "aliquots", value: "NW1/4" }] }] };
    Object.defineProperty(legal, "summary", { get() { throw new Error("Summary must not be read"); } });
    const group = getMapGroups(legal)[0];
    expect(group.view).toBe("PLSS");
    if (group.view !== "PLSS") throw new Error("Expected PLSS");
    const scene = group.scene;
    expect(scene.items.filter(item => item.role === "section").map(item => item.label)).toEqual(["Section"]);
    expect(scene.notes.some(note => note.label === "Section")).toBe(false);
  });

  it("does not add a section note absent from the source", () => {
    const groups = getMapGroups(surveyFixture);
    const notes = groups.find(entry => entry.view === "PLSS")!.scene!.notes;
    expect(notes.some(note => note.label === "Section")).toBe(false);
  });

  it("keeps the diagram static after pointer and keyboard events", () => {
    render(<LegalMapContent legal={surveyFixture} />);
    fireEvent.click(screen.getByRole("tab", { name: "PLSS" }));
    const drawing = screen.getByRole("img", { name: "Parcel 1 schematic" });
    const original = drawing.getAttribute("viewBox");
    expect(drawing).not.toHaveAttribute("tabindex");
    expect(drawing.querySelector('[role="button"], [tabindex], [aria-pressed]')).toBeNull();
    fireEvent.doubleClick(drawing);
    expect(drawing).toHaveAttribute("viewBox", original);
    fireEvent.keyDown(drawing, { key: "0" });
    expect(drawing).toHaveAttribute("viewBox", original);
    fireEvent.keyDown(drawing, { key: "+" });
    expect(drawing).toHaveAttribute("viewBox", original);
  });

  it("keeps the source township and range readable in the map footer", () => {
    const original = JSON.stringify(quarterFixture);
    render(<LegalMapContent legal={quarterFixture} />);
    const drawing = screen.getByRole("img", { name: "Parcel 1 schematic" });
    const caption = screen.getByText("Township 3 South · Range 9 East");
    expect(drawing).toHaveAccessibleDescription("Township 3 South · Range 9 East");
    expect(document.querySelector("[data-legal-map-footer]")).toContainElement(caption);
    expect(drawing).not.toContainElement(caption);
    expect(screen.getByRole("table", { name: "Details" })).toHaveTextContent("SW1/4 of Section 4");
    expect(JSON.stringify(quarterFixture)).toBe(original);
  });

  it.each(["NW1/4", "NE1/4", "SW1/4", "SE1/4", "N1/2", "NE1/4 of SW1/4", "Part", ""])("focuses the drawing on the referenced section for %s", aliquot => {
    const legal = { groups: [{ type: "plss", elements: [{ aspect: "aliquots", value: `${aliquot} of Section 10` }] }] };
    const entry = getMapGroups(legal)[0];
    if (entry.view !== "PLSS") throw new Error("Expected PLSS");
    const scene = entry.scene;
    const sourceSection = scene.items.find(item => item.role === "section" && item.highlighted)!;
    render(<LegalMapContent legal={legal} />);
    const drawing = screen.getByRole("img", { name: "Parcel 1 schematic" });
    const section = drawing.querySelector('[data-survey-section-area="10"]')!;
    expect(drawing.querySelectorAll("[data-survey-section-area]")).toHaveLength(1);
    expect(section).toHaveAttribute("x", String(sourceSection.x));
    expect(section).toHaveAttribute("y", String(sourceSection.y));
    expect(drawing.querySelector('[data-survey-section="10"]')).toHaveTextContent("Section 10");
    expect(drawing.querySelector("[data-plss-quarter-guide]")).not.toBeNull();
    for (const area of drawing.querySelectorAll("[data-survey-area]")) {
      expect(Number(area.getAttribute("x"))).toBeGreaterThanOrEqual(sourceSection.x);
      expect(Number(area.getAttribute("y"))).toBeGreaterThanOrEqual(sourceSection.y);
      expect(Number(area.getAttribute("x")) + Number(area.getAttribute("width"))).toBeLessThanOrEqual(sourceSection.x + sourceSection.width);
      expect(Number(area.getAttribute("y")) + Number(area.getAttribute("height"))).toBeLessThanOrEqual(sourceSection.y + sourceSection.height);
    }
  });

  for (const [screenWidth, screenHeight] of [[920, 920], [800, 400], [390, 240]]) {
    it.each([
      ["SE1/4 of Section 1", 1], ["NW1/4 of Section 6", 1], ["SW1/4 of Section 31", 1],
      ["NE1/4 of Section 36", 1], ["NE1/4 of SW1/4 of Section 12", 1], ["SE1/4", 1],
      ["NE1/4 of Section 12 and SW1/4 of Section 13", 2],
    ] as const)(`centers and fits the referenced sections for %s at ${screenWidth}x${screenHeight}`, (value, count) => {
      vi.spyOn(SVGElement.prototype, "getBoundingClientRect").mockImplementation(function (this: SVGElement) {
        return { width: this.tagName === "svg" ? screenWidth : 0, height: this.tagName === "svg" ? screenHeight : 0 } as DOMRect;
      });
      render(<LegalMapContent legal={{ groups: [{ type: "plss", elements: [{ aspect: "aliquots", value }] }] }} />);
      const drawing = screen.getByRole("img", { name: "Parcel 1 schematic" });
      const [x, y, width, height] = drawing.getAttribute("viewBox")!.split(" ").map(Number);
      const sections = [...drawing.querySelectorAll("[data-survey-section-area]")];
      expect(sections).toHaveLength(count);
      const left = Math.min(...sections.map(rect => Number(rect.getAttribute("x"))));
      const top = Math.min(...sections.map(rect => Number(rect.getAttribute("y"))));
      const right = Math.max(...sections.map(rect => Number(rect.getAttribute("x")) + Number(rect.getAttribute("width"))));
      const bottom = Math.max(...sections.map(rect => Number(rect.getAttribute("y")) + Number(rect.getAttribute("height"))));
      expect((left + right) / 2).toBeCloseTo(x + width / 2);
      expect((top + bottom) / 2).toBeCloseTo(y + height / 2);
      expect(left).toBeGreaterThan(x);
      expect(top).toBeGreaterThan(y);
      expect(right).toBeLessThan(x + width);
      expect(bottom).toBeLessThan(y + height);
      const sectionLabel = drawing.querySelector("[data-survey-section]")!;
      const scale = Math.min(screenWidth / width, screenHeight / height);
      expect(Number(sectionLabel.getAttribute("font-size")) * scale).toBeCloseTo(18.4);
    });
  }

  it("preserves partial-area hatching and the exact source quarter", () => {
    render(<LegalMapContent legal={{ groups: [{ type: "plss", elements: [{ aspect: "section", value: "4" }, { aspect: "aliquots", value: "PART OF THE SOUTHWEST 1/4" }] }] }} />);
    const section = document.querySelector('[data-survey-section-area="4"]')!;
    const area = document.querySelector('[data-survey-partial="true"]')!;
    expect(Number(area.getAttribute("width"))).toBe(Number(section.getAttribute("width")) / 2);
    expect(Number(area.getAttribute("height"))).toBe(Number(section.getAttribute("height")) / 2);
    expect(Number(area.getAttribute("x"))).toBe(Number(section.getAttribute("x")));
    expect(Number(area.getAttribute("y"))).toBe(Number(section.getAttribute("y")) + Number(section.getAttribute("height")) / 2);
    expect(area.getAttribute("fill")).toMatch(/^url\(#/);
    expect(screen.getByText("Partial area", { selector: "span" })).toBeVisible();
  });
});
