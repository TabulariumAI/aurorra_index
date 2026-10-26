import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LegalMapContent } from "../component/LegalMapContent";
import { getMapGroups } from "../data/surveyData";
import { legalMapColors } from "../style/legalMapStyles";
import { quarterFixture, surveyFixture } from "./surveyFixture";

describe("abstract legal map presentation", () => {
  afterEach(() => vi.restoreAllMocks());

  it("does not invent a numbered section when the summary has multiple candidates", () => {
    const groups = getMapGroups({ ...surveyFixture, summary: "Sections 12 and 32." });
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

  it("centers the township label below the grid on one line without changing extracted values", () => {
    const original = JSON.stringify(quarterFixture);
    render(<LegalMapContent legal={quarterFixture} />);
    const drawing = screen.getByRole("img", { name: "Parcel 1 schematic" });
    const caption = screen.getByText("Township 3 South · Range 9 East");
    expect(drawing).toContainElement(caption);
    expect(drawing).toHaveAccessibleDescription("Township 3 South · Range 9 East");
    expect(caption.tagName).toBe("text");
    expect(caption).toHaveAttribute("text-anchor", "middle");
    expect(caption).toHaveAttribute("dominant-baseline", "central");
    const sections = [...drawing.querySelectorAll("[data-survey-section-area]")];
    const left = Math.min(...sections.map(section => Number(section.getAttribute("x"))));
    const right = Math.max(...sections.map(section => Number(section.getAttribute("x")) + Number(section.getAttribute("width"))));
    const bottom = Math.max(...sections.map(section => Number(section.getAttribute("y")) + Number(section.getAttribute("height"))));
    expect(Number(caption.getAttribute("x"))).toBe((left + right) / 2);
    expect(Number(caption.getAttribute("y"))).toBeGreaterThan(bottom);
    expect(document.querySelector("[data-legal-map-footer]")).not.toContainElement(caption);
    expect(caption.querySelector("tspan")).toBeNull();
    expect(screen.queryByText(/Township TOWN|Range RANGE/)).not.toBeInTheDocument();
    expect(JSON.stringify(quarterFixture)).toBe(original);
    expect(drawing.querySelector('[data-survey-section="4"]')).toBeTruthy();
  });

  it("uses Lot & Block pixel sizes for square labels without label backgrounds", () => {
    vi.spyOn(SVGElement.prototype, "getBoundingClientRect").mockImplementation(function (this: SVGElement) {
      return { width: this.tagName === "svg" ? 1840 : 0, height: this.tagName === "svg" ? 1840 : 0 } as DOMRect;
    });
    render(<LegalMapContent legal={quarterFixture} />);
    const drawing = screen.getByRole("img", { name: "Parcel 1 schematic" });
    const section = drawing.querySelector('[data-survey-section="4"]')!;
    const scale = 1840 / Number(drawing.getAttribute("viewBox")!.split(" ")[2]);
    expect(Number(section.getAttribute("font-size")) * scale).toBeCloseTo(18.4);
    expect(section.parentElement!.querySelector("rect")).toBeNull();
    const subject = drawing.querySelector("[data-survey-area]")!.parentElement!.querySelector("text")!;
    expect(Number(subject.getAttribute("font-size")) * scale).toBeCloseTo(18.4);
    expect(Number(subject.querySelector("tspan:last-child")!.getAttribute("font-size")) * scale).toBeCloseTo(16);
  });

  it.each(["NW1/4", "NE1/4", "SW1/4", "SE1/4", "N1/2", "NE1/4 of SW1/4", "Part", ""])("aligns every section number at top center for %s", aliquot => {
    const legal = { groups: [{ type: "plss", elements: [{ aspect: "aliquots", value: `${aliquot} of Section 10` }] }] };
    const scene = getMapGroups(legal)[0].scene!;
    render(<LegalMapContent legal={legal} />);
    const drawing = screen.getByRole("img", { name: "Parcel 1 schematic" });
    const numbers = drawing.querySelectorAll("[data-survey-section]");
    expect(numbers).toHaveLength(18);
    for (const number of numbers) {
      const section = scene.items.find(item => item.kind === "rect" && item.role === "section" && item.label === number.textContent)!;
      if (section.kind !== "rect") throw new Error("Expected section rectangle");
      expect(number).toHaveAttribute("x", String(section.x + section.width / 2));
      expect(Number(number.getAttribute("y"))).toBeGreaterThan(section.y);
      expect(Number(number.getAttribute("y"))).toBeLessThan(section.y + section.height / 2);
      expect(number).toHaveAttribute("text-anchor", "middle");
      expect(number).toHaveAttribute("dominant-baseline", "hanging");
    }
  });

  it("shrinks section numbers in narrow drawings and omits unreadable aliquot labels", () => {
    vi.spyOn(SVGElement.prototype, "getBoundingClientRect").mockImplementation(function (this: SVGElement) {
      return { width: this.tagName === "svg" ? 230 : 0, height: this.tagName === "svg" ? 230 : 0 } as DOMRect;
    });
    render(<LegalMapContent legal={quarterFixture} />);
    const drawing = screen.getByRole("img", { name: "Parcel 1 schematic" });
    const scale = 230 / Number(drawing.getAttribute("viewBox")!.split(" ")[2]);
    expect(within(drawing).queryByText("SW1/4", { exact: true })).toBeNull();
    expect(Number(drawing.querySelector('[data-survey-section="4"]')!.getAttribute("font-size")) * scale).toBeLessThan(18.4);
    expect(within(drawing).queryByText("Subject", { exact: true })).toBeNull();
    expect(drawing.querySelector("[data-survey-area]")).not.toBeNull();
  });

  for (const [screenWidth, screenHeight] of [[920, 920], [800, 400], [390, 240]]) {
    it.each([
      ["SE1/4 of Section 1", 12], ["NW1/4 of Section 6", 12], ["SW1/4 of Section 31", 12],
      ["NE1/4 of Section 36", 12], ["NE1/4 of SW1/4 of Section 12", 18], ["SE1/4", 1],
      ["NE1/4 of Section 12 and SW1/4 of Section 13", 24],
    ] as const)(`renders complete sections 10% smaller at the upper center for %s at ${screenWidth}x${screenHeight}`, (value, count) => {
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
      const extent = Math.max(right - left, bottom - top);
      const scale = Math.min(screenWidth / width, screenHeight / height);
      const previousScale = Math.min(screenWidth / (right - left + extent * 0.24), screenHeight / (bottom - top + extent * 0.24));
      const screenLeft = (screenWidth - width * scale) / 2;
      const screenTop = (screenHeight - height * scale) / 2;
      expect(scale / previousScale).toBeCloseTo(0.9);
      expect(screenLeft + ((left + right) / 2 - x) * scale).toBeCloseTo(screenWidth / 2);
      expect(screenTop + ((top + bottom) / 2 - y) * scale).toBeCloseTo(screenHeight * 0.4);
      expect(screenLeft + (left - x) * scale).toBeGreaterThan(0);
      expect(screenTop + (top - y) * scale).toBeGreaterThan(0);
      expect(screenLeft + (right - x) * scale).toBeLessThan(screenWidth);
      expect(screenTop + (bottom - y) * scale).toBeLessThan(screenHeight);
      expect(drawing.querySelector('rect[width="600"][height="600"]')).toBeNull();
    });
  }

  it("distinguishes the subject section from subtle surrounding cells", () => {
    render(<LegalMapContent legal={{ groups: [{ type: "plss", elements: [{ aspect: "aliquots", value: "NW1/4 of Section 10" }] }] }} />);
    const drawing = screen.getByRole("img", { name: "Parcel 1 schematic" });
    const subject = drawing.querySelector('[data-survey-section-area="10"]')!;
    const neighbor = drawing.querySelector('[data-survey-section-area="9"]')!;
    expect(subject).toHaveAttribute("fill", "#f3edcf");
    expect(neighbor).toHaveAttribute("fill", legalMapColors.blockBg);
    for (const section of drawing.querySelectorAll("[data-survey-section-area]")) {
      expect(section).toHaveAttribute("stroke", "#62727d");
      expect(section).toHaveAttribute("stroke-width", "2");
      expect(section).not.toHaveAttribute("stroke-dasharray");
      expect(section).toHaveAttribute("vector-effect", "non-scaling-stroke");
    }
    const parcel = drawing.querySelector("[data-survey-area]")!;
    expect(parcel).toHaveAttribute("stroke", legalMapColors.parcelLine);
    expect(parcel).toHaveAttribute("stroke-width", "3");
    expect(parcel).not.toHaveAttribute("stroke-dasharray");
    expect(neighbor).toHaveAttribute("fill-opacity", "0.35");
    expect(drawing.querySelector('[data-survey-section="9"]')).toHaveAttribute("fill", legalMapColors.secondaryText);
  });
});
