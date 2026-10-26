import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LegalMapContent } from "../component/LegalMapContent";
import { buildBoundary, parseBearing, parseDistance } from "../data/surveyData";
import { metesFixture } from "./metesFixture";

const rectangle = "BEGINNING AT AN IRON PIN; THENCE NORTH 100 FEET; THENCE EAST 50 FEET; THENCE SOUTH 100 FEET; THENCE WEST 50 FEET TO THE PLACE OF BEGINNING.";
const group = { type: "metes_bounds", source: rectangle, elements: [{ aspect: "acreage", value: "0.115 ACRES" }] };

describe("replacement Metes boundaries", () => {
  it.each([["100 ft", 30.48], ["100 FEET", 30.48], ["30.48 m", 30.48], ["10 yards", 9.144], ["1 chain", 20.1168], ["1 rod", 5.0292], ["1 mile", 1609.344], ["12 inches", 0.3048], ["1,000 feet", 304.8], ["0 ft", 0]])("converts source distance %s to metres", (source, metres) => {
    expect(parseDistance(source)).toBeCloseTo(metres);
  });

  it.each(["", "100", "-1 ft", "12 unknown", "about 100 feet", "100 ft extra", "1e309 m"])("rejects an unstated or invalid distance: %s", source => {
    expect(parseDistance(source)).toBeNull();
  });

  it("does not turn a negative source distance into a positive edge", () => {
    const scene = buildBoundary({ ...group, source: "BEGINNING AT AN IRON PIN; NORTH 45 DEGREES EAST -100 FEET; SOUTH 100 FEET; WEST 50 FEET." }, "Parcel");
    expect(scene.items.every(item => item.kind === "line" && !item.confirmed)).toBe(true);
    expect(scene.items.some(item => item.kind === "line" && item.sequence === 1)).toBe(false);
    expect(scene.issue).toMatch(/distance/i);
  });

  it("does not fill a collinear traverse", () => {
    render(<LegalMapContent legal={{ parcels_num: 1, groups: [{ ...group, source: "BEGINNING AT AN IRON PIN; NORTH 100 FEET; SOUTH 100 FEET; NORTH 100 FEET; SOUTH 100 FEET." }] }} />);
    expect(document.querySelector("[data-boundary-fill]")).toBeNull();
  });
  it("draws the supplied deed with one offset, seven boundary edges and the stated area", () => {
    const input = metesFixture.groups.find(entry => entry.type === "metes_bounds")!;
    const original = JSON.stringify(input);
    const lines = buildBoundary(input, "Parcel").items.filter(item => item.kind === "line");
    expect(lines).toHaveLength(8);
    expect(lines.map(line => line.distance)).toEqual(["320.07 FEET", "276.00 FEET", "249.89 FEET", "37.41 FEET", "108.75 FEET", "79.75 FEET", "23.13 FEET", "313.73 FEET"]);
    const boundary = lines.slice(1);
    const area = Math.abs(boundary.reduce((sum, line) => sum + line.from.x * line.to.y - line.to.x * line.from.y, 0)) / 2 / 4046.8564224;
    expect(area).toBeCloseTo(1.589, 3);
    expect(JSON.stringify(input)).toBe(original);
    render(<LegalMapContent legal={metesFixture} />);
    expect(screen.getAllByRole("img", { name: /schematic/ })).toHaveLength(2);
    expect(document.querySelectorAll("[data-survey-line]")).toHaveLength(16);
    expect(document.querySelectorAll("[data-survey-line][stroke-dasharray]")).toHaveLength(2);
  });

  it.each([0.01, 1, 1000])("keeps closure and two starting ties proportional at scale %s", scale => {
    const source = `BEGINNING AT A REFERENCE POINT; EAST ${20 * scale} FEET; NORTH ${20 * scale} FEET; NORTH ${100 * scale} FEET; EAST ${50 * scale} FEET; SOUTH ${100 * scale} FEET; WEST ${50.3 * scale} FEET.`;
    render(<LegalMapContent legal={{ parcels_num: 1, groups: [{ ...group, source }] }} />);
    expect(document.querySelectorAll("[data-survey-line][stroke-dasharray]")).toHaveLength(2);
    expect(document.querySelector("[data-boundary-fill]")).not.toBeNull();
  });

  it("prefers point one when more than one starting point is within tolerance", () => {
    render(<LegalMapContent legal={{ parcels_num: 1, groups: [{ ...group, source: "BEGINNING AT A REFERENCE POINT; EAST 0.01 FEET; NORTH 100 FEET; EAST 50 FEET; SOUTH 100 FEET; WEST 50 FEET." }] }} />);
    expect(document.querySelectorAll("[data-survey-line][stroke-dasharray]")).toHaveLength(0);
  });

  it("does not infer three ties or close an open boundary", () => {
    render(<LegalMapContent legal={{ parcels_num: 1, groups: [{ ...group, source: "BEGINNING AT A REFERENCE POINT; EAST 20 FEET; NORTH 20 FEET; EAST 20 FEET; NORTH 100 FEET; EAST 50 FEET; SOUTH 100 FEET; WEST 50 FEET." }] }} />);
    expect(document.querySelector("[data-boundary-fill]")).toBeNull();
  });

  it("retains later readable courses as schematic after an unsupported curve", () => {
    const scene = buildBoundary({ ...group, source: "BEGINNING AT AN IRON PIN; NORTH 100 FEET; THENCE ALONG A CURVE TO THE RIGHT 50 FEET; THENCE SOUTH 100 FEET; THENCE WEST 50 FEET." }, "Parcel");
    expect(scene.items.filter(item => item.kind === "line").map(item => item.confirmed)).toEqual([true, false, false]);
    expect(scene.schematic).toBe(true);
    expect(scene.issue).toMatch(/curve/i);
  });

  it("does not fill a zero-length boundary", () => {
    render(<LegalMapContent legal={{ parcels_num: 1, groups: [{ ...group, source: "BEGINNING AT AN IRON PIN; NORTH 0 FEET; EAST 0 FEET; SOUTH 0 FEET; WEST 0 FEET." }] }} />);
    expect(document.querySelector("[data-boundary-fill]")).toBeNull();
    expect(document.body.innerHTML).not.toMatch(/NaN|Infinity/);
  });

  it("keeps PLSS available when switching from rebuilt Metes", () => {
    render(<LegalMapContent legal={{ parcels_num: 1, groups: [group, { type: "plss", elements: [{ aspect: "aliquots", value: "NW1/4 of Section 16" }] }] }} />);
    expect(document.querySelectorAll("[data-survey-line]")).toHaveLength(4);
    fireEvent.click(screen.getByRole("tab", { name: "PLSS" }));
    expect(document.querySelectorAll("[data-survey-section-area]")).toHaveLength(18);
    fireEvent.click(screen.getByRole("tab", { name: "Metes & Bounds" }));
    expect(document.querySelectorAll("[data-survey-line]")).toHaveLength(4);
  });
  it.each([[1, 1], [2, 2]])("draws two groups as %s parcel(s) in %s map(s)", (parcels_num, maps) => {
    render(<LegalMapContent legal={{ parcels_num, groups: [group, group] }} />);
    expect(screen.getAllByRole("img", { name: /schematic/ })).toHaveLength(maps);
    expect(document.querySelectorAll("[data-survey-line]")).toHaveLength(8);
  });

  it("reads source courses without requiring parallel lists or backend-only calls", () => {
    const scene = buildBoundary(group, "Parcel");
    expect(scene.items.filter(item => item.kind === "line")).toHaveLength(4);
    expect(JSON.stringify(group)).not.toMatch(/calls|bearings|distances/);
  });

  it("renders a source-only group and retains the source through tab changes", () => {
    const legal = { parcels_num: 1, groups: [{ type: "metes_bounds", source: rectangle }] };
    const original = JSON.stringify(legal);
    render(<LegalMapContent legal={legal} />);
    expect(document.querySelectorAll("[data-survey-line]")).toHaveLength(4);
    expect(JSON.stringify(legal)).toBe(original);
  });

  it("uses stated units consistently within one boundary", () => {
    const scene = buildBoundary({ ...group, source: "BEGINNING AT AN IRON PIN; NORTH 100 FEET; EAST 15.24 METERS; SOUTH 100 FEET; WEST 50 FEET." }, "Parcel");
    const lines = scene.items.filter(item => item.kind === "line");
    expect(lines).toHaveLength(4);
    expect(Math.hypot(lines.at(-1)!.to.x, lines.at(-1)!.to.y)).toBeLessThan(0.000001);
  });

  it("pairs fractional bearings with source distances and closes the resulting boundary", () => {
    const source = "BEGINNING AT AN IRON PIN; NORTH 45 1/2 DEGREES EAST 100 FEET; SOUTH 44 1/2 DEGREES EAST 50 FEET; SOUTH 45 1/2 DEGREES WEST 100 FEET; NORTH 44 1/2 DEGREES WEST 50 FEET.";
    render(<LegalMapContent legal={{ parcels_num: 1, groups: [{ ...group, source }] }} />);
    expect(document.querySelectorAll("[data-survey-line]")).toHaveLength(4);
    expect(document.querySelector("[data-boundary-fill]")).not.toBeNull();
  });

  it("retains later measurements as unconfirmed after an unpaired source course", () => {
    const scene = buildBoundary({ ...group, source: "BEGINNING AT AN IRON PIN; NORTH 100 FEET; NORTH 45 DEGREES EAST TO A PIN; SOUTH 100 FEET; WEST 50 FEET." }, "Parcel");
    expect(scene.items.filter(item => item.kind === "line").map(item => item.confirmed)).toEqual([true, false, false]);
    expect(scene.schematic).toBe(true);
    expect(scene.issue).toMatch(/distance/i);
    render(<LegalMapContent legal={{ parcels_num: 1, groups: [{ ...group, source: "BEGINNING AT AN IRON PIN; NORTH 100 FEET; NORTH 45 DEGREES EAST TO A PIN; SOUTH 100 FEET; WEST 50 FEET." }] }} />);
    expect(screen.getByRole("table", { name: "Boundary Calls" }).querySelectorAll("tbody tr")[2].children[2]).toHaveTextContent(/^S$/);
    expect(document.querySelector("[data-boundary-fill]")).toBeNull();
  });

  it.each(["N 45°30′30″ E", "N 45º30’30” E", "N 45 DEGREES 30 MINUTES 30 SECONDS E"])("parses existing DMS notation %s", bearing => {
    expect(parseBearing(bearing)).toBeCloseTo(45.5083333333);
  });

  it.each(["", "N 91 E", "N 20°60′ E", "N 20°10′60″ E", "N 1 1/0 E", "N 1 3/2 E", "curve right", "N 10 E junk"])("rejects invalid bearing %s", bearing => {
    expect(parseBearing(bearing)).toBeNull();
  });

  it("preserves repeated source bearings and disregards incomplete extracted lists", () => {
    const scene = buildBoundary({ ...group, source: "BEGINNING AT AN IRON PIN; THENCE NORTH 40 FEET; THENCE NORTH 60 FEET; THENCE EAST 50 FEET; THENCE SOUTH 100 FEET; THENCE WEST 50 FEET TO THE PLACE OF BEGINNING.", elements: [
      { aspect: "bearings", value: "NORTH; EAST; SOUTH; WEST" },
      { aspect: "distances", value: "40 FEET; 60 FEET; 50 FEET; 100 FEET; 50 FEET" },
    ] }, "Parcel");
    expect(scene.items.filter(item => item.kind === "line")).toHaveLength(5);
  });

  it.each([
    ["NORTH 71 3/4 DEGREES WEST", 288.25], ["NORTH 18 1/2 DEGREES EAST", 18.5],
    ["SOUTH 71 3/4 DEGREES EAST", 108.25], ["SOUTH 18 1/2 DEGREES WEST", 198.5],
    ["SOUTH 85 DEGREES 30 MINUTES EAST", 94.5], ["NORTH 11 DEGREES 21 MINUTES EAST", 11.35],
  ])("parses source bearing %s", (bearing, degrees) => expect(parseBearing(bearing)).toBeCloseTo(degrees));

  it.each([
    ["", 0], ["EAST 20 FEET; ", 1], ["EAST 20 FEET; NORTH 20 FEET; ", 2],
  ])("identifies %s starting ties by endpoint closure", (prefix, ties) => {
    render(<LegalMapContent legal={{ parcels_num: 1, groups: [{ ...group, source: `BEGINNING AT A REFERENCE POINT; ${prefix}NORTH 100 FEET; EAST 50 FEET; SOUTH 100 FEET; WEST 50 FEET TO THE PLACE OF BEGINNING.` }] }} />);
    const lines = [...document.querySelectorAll<SVGLineElement>("[data-survey-line]")];
    expect(lines).toHaveLength(4 + ties);
    expect(lines.filter(line => line.hasAttribute("stroke-dasharray"))).toHaveLength(ties);
    expect(document.querySelector("[data-boundary-fill]")).not.toBeNull();
    for (const line of lines.slice(0, ties)) {
      expect(line).toHaveAttribute("stroke-linecap", "round");
      expect(Number(line.getAttribute("stroke-opacity"))).toBeLessThanOrEqual(0.3);
    }
  });

  it.each([[50.3, true], [50.301, false]])("uses 0.1 percent of total course length for closure: %s", (last, closed) => {
    render(<LegalMapContent legal={{ parcels_num: 1, groups: [{ ...group, source: rectangle.replace("WEST 50 FEET", `WEST ${last} FEET`) }] }} />);
    expect(Boolean(document.querySelector("[data-boundary-fill]"))).toBe(closed);
    const lines = [...document.querySelectorAll<SVGLineElement>("[data-survey-line]")];
    if (closed) {
      expect(lines.at(-1)!.getAttribute("x2")).toBe(lines[0].getAttribute("x1"));
      expect(lines.at(-1)!.getAttribute("y2")).toBe(lines[0].getAttribute("y1"));
    }
  });

  it("includes tie distances in the tolerance", () => {
    render(<LegalMapContent legal={{ parcels_num: 1, groups: [{ ...group, source: "BEGINNING AT A REFERENCE POINT; EAST 1000 FEET; NORTH 100 FEET; EAST 50 FEET; SOUTH 100 FEET; WEST 51 FEET TO THE PLACE OF BEGINNING." }] }} />);
    expect(document.querySelector("[data-boundary-fill]")).not.toBeNull();
    expect(document.querySelectorAll("[data-survey-line][stroke-dasharray]")).toHaveLength(1);
    expect(screen.getByText("POC")).toBeVisible();
    expect(screen.getByText("POB")).toBeVisible();
    expect(document.querySelectorAll("[data-survey-vertex]")).toHaveLength(5);
  });

  it("does not skip cardinal courses whose distance has no stated unit", () => {
    const scene = buildBoundary({ ...group, source: "BEGINNING AT AN IRON PIN; NORTH 100; EAST 50 FEET; SOUTH 100 FEET; WEST 50 FEET." }, "Parcel");
    expect(scene.items.every(item => item.kind === "line" && !item.confirmed)).toBe(true);
    expect(scene.items.some(item => item.kind === "line" && item.sequence === 1)).toBe(false);
    expect(scene.issue).toMatch(/distance/i);
  });

  it("keeps acreage, easements and keyboard navigation without an Issue column", () => {
    render(<LegalMapContent legal={{ parcels_num: 1, groups: [{ ...group, elements: [...group.elements, { aspect: "easement", value: "SUBJECT TO LEGAL HIGHWAYS" }] }] }} />);
    expect(screen.queryByRole("columnheader", { name: "Issue" })).toBeNull();
    expect(screen.getByRole("table", { name: "Boundary Calls" })).toHaveStyle({ minWidth: "30rem" });
    expect(screen.queryByRole("heading", { name: "Parcel 1" })).toBeNull();
    fireEvent.keyDown(screen.getByRole("tab", { name: "Boundary Calls" }), { key: "ArrowRight" });
    expect(screen.getByRole("tab", { name: "Acreage" })).toHaveFocus();
    expect(screen.getByText("0.115 ACRES")).toBeVisible();
    fireEvent.keyDown(screen.getByRole("tab", { name: "Acreage" }), { key: "ArrowRight" });
    expect(screen.getByText("SUBJECT TO LEGAL HIGHWAYS")).toBeVisible();
  });

  it("constructs the supplied paired measurements when source is absent", () => {
    const scene = buildBoundary({ type: "metes_bounds", elements: [{ aspect: "bearings", value: "N; E; S; W" }, { aspect: "distances", value: "100 ft; 50 ft; 100 ft; 50 ft" }] }, "Parcel");
    expect(scene.items).toHaveLength(4);
    expect(scene.closed).toBe(true);
    expect(scene.issue).toBeUndefined();
  });
});
