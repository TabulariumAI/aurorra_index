import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LegalMapContent } from "../component/LegalMapContent";
import { getMapGroups, parseBearing } from "../data/surveyData";
import { acreageText, boundaryFixture, clusterFixture, quarterFixture, surveyFixture } from "./surveyFixture";
import { legalMapColors, legalMapStyles } from "../style/legalMapStyles";

describe("abstract legal map presentation", () => {
  afterEach(() => vi.restoreAllMocks());
  it.each(["S 0° 01' 30'' E", "S 0º 01’ 30” E", "S 0° 01′ 30″ E", 'S 0° 01\' 30" E'])("parses displayed survey notation %s", value => {
    expect(parseBearing(value)).toBeCloseTo(179.975);
  });

  it("uses the existing summary to identify a section without changing extraction", () => {
    const original = JSON.stringify(surveyFixture);
    const groups = getMapGroups(surveyFixture);
    const plss = groups.find(entry => entry.view === "PLSS")!.scene!;
    expect(plss.notes).toContainEqual({ label: "Section", value: "32" });
    expect(plss.items.some(item => item.kind === "rect" && item.role === "area" && item.partial)).toBe(true);
    expect(plss.items.filter(item => item.kind === "rect" && item.role === "section" && item.highlighted).map(item => item.label)).toEqual(["32"]);
    expect(JSON.stringify(surveyFixture)).toBe(original);
    expect(groups.find(entry => entry.view === "Metes & Bounds")!.scene!.items.filter(item => item.kind === "line")).toHaveLength(7);
  });

  it("retains references beside the drawing without duplicated legal data or layer controls", () => {
    render(<LegalMapContent legal={{ ...surveyFixture, groups: [...surveyFixture.groups!, { type: "plat_reference", elements: [{ aspect: "plat_book", value: "42" }] }] }} />);
    fireEvent.click(screen.getByRole("tab", { name: "PLSS" }));
    expect(screen.getByRole("img", { name: "PLSS schematic" })).toBeVisible();
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    expect(screen.queryByText("Schematic - Not to Scale")).not.toBeInTheDocument();
    const info = document.querySelector("[data-legal-map-info]") as HTMLElement;
    expect(within(info).getAllByRole("heading").map(node => node.textContent)).toEqual(["Summary", "Reference"]);
    expect(within(info).getByRole("cell", { name: "42" })).toBeVisible();
    fireEvent.click(screen.getByRole("tab", { name: "Metes & Bounds" }));
    expect(within(info).getByRole("table", { name: "Reference" })).toBeVisible();
    expect(within(info).queryByText(/Legal Description/)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Zoom in" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Fit drawing" })).not.toBeInTheDocument();
    expect(screen.queryByText(/Section not identified|Unresolved|Select or hover/)).not.toBeInTheDocument();

  });

  it("renders the seven-course abstract boundary with a static calls table", () => {
    render(<LegalMapContent legal={surveyFixture} />);
    fireEvent.click(screen.getByRole("tab", { name: "Metes & Bounds" }));
    expect(document.querySelectorAll("[data-survey-line]")).toHaveLength(7);
    const calls = screen.getByRole("table", { name: "Boundary Calls" });
    expect(within(calls).getAllByRole("row")).toHaveLength(8);
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    expect(screen.queryByText(/Unresolved|could not be paired/)).not.toBeInTheDocument();
    fireEvent.click(within(calls).getAllByRole("row")[1]);
    expect(within(calls).getAllByRole("row")[1]).not.toHaveAttribute("aria-selected");
    expect(screen.getByRole("img", { name: "Metes & Bounds schematic" }).querySelector('[aria-pressed]')).toBeNull();
    expect(calls).toHaveStyle({ fontSize: "1rem" });
  });

  it("does not invent a numbered section when the summary has multiple candidates", () => {
    const groups = getMapGroups({ ...surveyFixture, summary: "Sections 12 and 32." });
    const notes = groups.find(entry => entry.view === "PLSS")!.scene!.notes;
    expect(notes.some(note => note.label === "Section")).toBe(false);
  });

  it("keeps the diagram static after pointer and keyboard events", () => {
    render(<LegalMapContent legal={surveyFixture} />);
    fireEvent.click(screen.getByRole("tab", { name: "PLSS" }));
    const drawing = screen.getByRole("img", { name: "PLSS schematic" });
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

  it.each([
    { legal: clusterFixture, bearing: "SOUTH 79 DEGREES 46 MINUTES 35 SECONDS WEST", distance: "375.07 ft" },
    { legal: surveyFixture, bearing: "S 0° 01' 30'' E", distance: "323.26 FEET" },
  ])("keeps the $bearing commencement annotation readable without covering the drawing", ({ legal, bearing, distance }) => {
    render(<LegalMapContent legal={legal} />);
    fireEvent.click(screen.getByRole("tab", { name: "Metes & Bounds" }));
    const annotation = screen.getByRole("note", { name: "Commencement line" });
    expect(annotation).toHaveTextContent(bearing);
    expect(annotation).toHaveTextContent(distance);
    expect(annotation).toHaveStyle({ fontSize: "16px", overflowWrap: "anywhere", whiteSpace: "pre-wrap" });
    expect(annotation.closest("[data-legal-map-surface]")).not.toBeNull();
    expect(screen.getByRole("img", { name: "Metes & Bounds schematic" })).not.toContainElement(annotation);
  });

  it("centers the township label below the grid on one line without changing extracted values", () => {
    const original = JSON.stringify(quarterFixture);
    render(<LegalMapContent legal={quarterFixture} />);
    const drawing = screen.getByRole("img", { name: "PLSS schematic" });
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
      return { width: this.tagName === "svg" ? 920 : 0, height: this.tagName === "svg" ? 920 : 0 } as DOMRect;
    });
    render(<LegalMapContent legal={quarterFixture} />);
    const drawing = screen.getByRole("img", { name: "PLSS schematic" });
    const section = drawing.querySelector('[data-survey-section="4"]')!;
    const scale = 920 / Number(drawing.getAttribute("viewBox")!.split(" ")[2]);
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
    const drawing = screen.getByRole("img", { name: "PLSS schematic" });
    const numbers = drawing.querySelectorAll("[data-survey-section]");
    expect(numbers).toHaveLength(9);
    for (const number of numbers) {
      const section = scene.items.find(item => item.kind === "rect" && item.role === "section" && item.label === number.textContent)!;
      if (section.kind !== "rect") throw new Error("Expected section rectangle");
      expect(number).toHaveAttribute("x", String(section.x + section.width / 2));
      expect(number).toHaveAttribute("y", String(section.y + section.height * 0.12));
      expect(number).toHaveAttribute("text-anchor", "middle");
    }
  });

  it("omits unreadable labels in small aliquots while keeping section numbers at Lot & Block size", () => {
    vi.spyOn(SVGElement.prototype, "getBoundingClientRect").mockImplementation(function (this: SVGElement) {
      return { width: this.tagName === "svg" ? 230 : 0, height: this.tagName === "svg" ? 230 : 0 } as DOMRect;
    });
    render(<LegalMapContent legal={quarterFixture} />);
    const drawing = screen.getByRole("img", { name: "PLSS schematic" });
    const scale = 230 / Number(drawing.getAttribute("viewBox")!.split(" ")[2]);
    expect(within(drawing).queryByText("SW1/4", { exact: true })).toBeNull();
    expect(Number(drawing.querySelector('[data-survey-section="4"]')!.getAttribute("font-size")) * scale).toBeCloseTo(18.4);
    expect(within(drawing).queryByText("Subject", { exact: true })).toBeNull();
    expect(drawing.querySelector("[data-survey-area]")).not.toBeNull();
  });

  for (const [screenWidth, screenHeight] of [[920, 920], [800, 400], [390, 240]]) {
    it.each([
      ["SE1/4 of Section 1", 4], ["NW1/4 of Section 6", 4], ["SW1/4 of Section 31", 4],
      ["NE1/4 of Section 36", 4], ["NE1/4 of SW1/4 of Section 12", 6], ["SE1/4", 1],
      ["NE1/4 of Section 12 and SW1/4 of Section 13", 8],
    ] as const)(`renders complete sections 10% smaller at the upper center for %s at ${screenWidth}x${screenHeight}`, (value, count) => {
      vi.spyOn(SVGElement.prototype, "getBoundingClientRect").mockImplementation(function (this: SVGElement) {
        return { width: this.tagName === "svg" ? screenWidth : 0, height: this.tagName === "svg" ? screenHeight : 0 } as DOMRect;
      });
      render(<LegalMapContent legal={{ groups: [{ type: "plss", elements: [{ aspect: "aliquots", value }] }] }} />);
      const drawing = screen.getByRole("img", { name: "PLSS schematic" });
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

  it("shares Lot & Block surface, north marker and legend presentation", () => {
    render(<LegalMapContent legal={quarterFixture} />);
    const viewport = document.querySelector("[data-legal-map-surface]")!;
    expect(viewport).toHaveStyle({
      backgroundColor: legalMapStyles.mapSurface.backgroundColor,
      backgroundImage: legalMapStyles.mapSurface.backgroundImage,
      borderRadius: legalMapStyles.mapSurface.borderRadius,
    });
    const north = viewport.querySelector("[data-legal-map-north]")!;
    expect(north).toHaveStyle(legalMapStyles.northMarker);
    expect(north.querySelector("svg path")).toHaveAttribute("d", "M12 1 3 24l9-5 9 5z");
    const legend = viewport.querySelector(".legal-map-legend")!;
    expect(legend).toHaveStyle(legalMapStyles.legendItems);
    expect(within(legend as HTMLElement).getByText("Subject")).toHaveStyle(legalMapStyles.legendLabel);
    expect(within(legend as HTMLElement).getByText("Section")).toHaveStyle(legalMapStyles.legendLabel);
  });

  it("distinguishes the subject section from subtle surrounding cells", () => {
    render(<LegalMapContent legal={{ groups: [{ type: "plss", elements: [{ aspect: "aliquots", value: "NW1/4 of Section 10" }] }] }} />);
    const drawing = screen.getByRole("img", { name: "PLSS schematic" });
    const subject = drawing.querySelector('[data-survey-section-area="10"]')!;
    const neighbor = drawing.querySelector('[data-survey-section-area="9"]')!;
    expect(subject).toHaveAttribute("fill", "#f3edcf");
    expect(neighbor).toHaveAttribute("fill", legalMapColors.blockBg);
    expect(neighbor).toHaveAttribute("stroke", legalMapColors.gridLine);
    expect(neighbor).toHaveAttribute("fill-opacity", "0.35");
    expect(drawing.querySelector('[data-survey-section="9"]')).toHaveAttribute("fill", legalMapColors.secondaryText);
  });

  it("wraps full acreage outside the drawing and scrolls only the calls table", () => {
    render(<LegalMapContent legal={boundaryFixture} />);
    const drawing = screen.getByRole("img", { name: "Metes & Bounds schematic" });
    const acreage = screen.getByLabelText("Reported acreage");
    expect(drawing).not.toContainElement(acreage);
    expect(within(acreage).getAllByRole("listitem").map(item => item.textContent)).toEqual(acreageText.split(";").map(entry => entry.trim()));
    expect(acreage.closest("[data-legal-map-info]")).not.toBeNull();
    expect(document.querySelector("[data-legal-map-surface]")).not.toContainElement(acreage);
    expect(within(acreage).getByRole("list")).toHaveStyle({ textAlign: "left" });
    expect(within(acreage).getAllByRole("listitem")[0].querySelector("strong")).toHaveTextContent("30.210 ACRES, MORE OR LESS");
    expect(acreage).not.toHaveTextContent("Total");
    const region = screen.getByRole("region", { name: "Boundary Calls" });
    expect(region).toHaveStyle({ overflowY: "auto", minHeight: 0 });
    expect(region).toContainElement(screen.getByRole("table", { name: "Boundary Calls" }));
    expect(screen.getByRole("table", { name: "Boundary Calls" })).toHaveStyle({ background: legalMapStyles.infoCard.background });
  });

  it("centers boundary geometry 10% smaller at 67.5% of its fitted size with unchanged label sizes", () => {
    vi.spyOn(SVGElement.prototype, "getBoundingClientRect").mockReturnValue({ width: 800, height: 400 } as DOMRect);
    render(<LegalMapContent legal={{ groups: [{ type: "metes_bounds", elements: [
      { aspect: "bearings", value: "N; E; S" }, { aspect: "distances", value: "100 ft; 50 ft; 100 ft" },
    ] }] }} />);
    const drawing = screen.getByRole("img", { name: "Metes & Bounds schematic" });
    const [x, y, width, height] = drawing.getAttribute("viewBox")!.split(" ").map(Number);
    const scale = Math.min(800 / width, 400 / height);
    const lines = drawing.querySelectorAll("[data-survey-line]");
    const top = Math.min(...Array.from(lines, line => Math.min(Number(line.getAttribute("y1")), Number(line.getAttribute("y2")))));
    expect(height * scale - (top - y) * scale * 2).toBeCloseTo((400 - 64) * 0.675);
    const point = drawing.querySelector("[data-survey-point]")!;
    expect((Number(point.getAttribute("cx")) - x) * scale).toBeGreaterThanOrEqual(32);
    expect(Number(drawing.querySelector("[data-survey-vertex]")!.getAttribute("font-size")) * scale).toBeCloseTo(16);
  });

  it("moves acreage with the active view and preserves independent groups", () => {
    const legal = { ...surveyFixture, groups: [...surveyFixture.groups!, boundaryFixture.groups![0]] };
    render(<LegalMapContent legal={legal} />);
    const info = document.querySelector("[data-legal-map-info]") as HTMLElement;
    expect(within(info).getAllByRole("heading").map(node => node.textContent)).toEqual(["Summary", "Acreage", "Metes & Bounds 1", "Metes & Bounds 2", "Easement", "Metes & Bounds 1", "Metes & Bounds 2"]);
    expect(within(info).getAllByRole("list")).toHaveLength(2);
    expect(document.querySelectorAll("[data-legal-map-surface]")).toHaveLength(2);
    expect(screen.getAllByRole("tablist")).toHaveLength(1);
    fireEvent.click(screen.getByRole("tab", { name: "PLSS" }));
    expect(within(info).queryByRole("heading", { name: /^Acreage$/ })).toBeNull();
  });

  it("keeps closure diagnostics small, centered and unbolded", () => {
    render(<LegalMapContent legal={boundaryFixture} />);
    const details = screen.getByLabelText("Closure details");
    expect(details).toHaveStyle({ fontSize: "10px", fontWeight: 400, justifyContent: "center", textAlign: "center" });
    expect(details.querySelector("strong")).toBeNull();
    expect(details).toHaveTextContent("Closure: Within tolerance");
    expect(details).toHaveTextContent("Gap:");
    expect(details).toHaveTextContent("Tolerance:");
    expect(document.querySelector("[data-legal-map-surface]")).not.toContainElement(details);
  });

  it("removes a boundary view when no boundary can be drawn instead of showing a placeholder", () => {
    const legal = { groups: [{ type: "metes_bounds", elements: [{ aspect: "bearings", value: "unknown curve" }] }] };
    expect(getMapGroups(legal)).toEqual([]);
    render(<LegalMapContent legal={legal} />);
    expect(screen.queryByRole("tab", { name: "Metes & Bounds" })).not.toBeInTheDocument();
    expect(document.querySelector("[data-survey-placeholder]")).not.toBeInTheDocument();
  });
});
