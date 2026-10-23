import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LegalMapContent } from "../component/LegalMapContent";
import { getMapGroups } from "../data/surveyData";
import { surveyFixture, tieFixture } from "./surveyFixture";

describe("schematic boundary closure", () => {
  it.each([
    { name: "closed at point 1", bearings: "N; E; S; W", distances: "100 ft; 50 ft; 100 ft; 50 ft", beginning: 1 },
    { name: "closed at point 2", bearings: "E; N; E; S; W", distances: "10 ft; 100 ft; 50 ft; 100 ft; 50 ft", beginning: 2 },
    { name: "open at both points", bearings: "N; E; S", distances: "100 ft; 50 ft; 100 ft", beginning: null },
    { name: "within point 1 tolerance", bearings: "N; E; S; W", distances: "100 ft; 50 ft; 100 ft; 50.299 ft", beginning: 1 },
    { name: "outside point 1 tolerance", bearings: "N; E; S; W", distances: "100 ft; 50 ft; 100 ft; 50.301 ft", beginning: null },
    { name: "within point 2 tolerance", bearings: "E; N; E; S; W", distances: "10 ft; 100 ft; 50 ft; 100 ft; 50.299 ft", beginning: 2 },
    { name: "outside point 2 tolerance", bearings: "E; N; E; S; W", distances: "10 ft; 100 ft; 50 ft; 100 ft; 50.301 ft", beginning: null },
    { name: "long tie does not increase parcel tolerance", bearings: "E; N; E; S; W", distances: "10000 ft; 100 ft; 50 ft; 100 ft; 51 ft", beginning: null },
    { name: "point 1 wins when both match", bearings: "E; N; E; S; W", distances: "0.00001 ft; 100 ft; 50 ft; 100 ft; 50.00001 ft", beginning: 1 },
    { name: "does not infer two commencement courses", bearings: "E; E; N; E; S; W", distances: "10 ft; 20 ft; 100 ft; 50 ft; 100 ft; 50 ft", beginning: null },
    { name: "single open course", bearings: "E", distances: "50 ft", beginning: null },
  ])("renders $name without altering the extracted courses", ({ bearings, distances, beginning }) => {
    const legal = { groups: [{ type: "metes_bounds", elements: [
      { aspect: "bearings", value: bearings }, { aspect: "distances", value: distances }, { aspect: "acreage", value: "2.005 ACRES OF LAND, MORE OR LESS" },
    ] }] };
    const original = JSON.stringify(legal);
    const lines = getMapGroups(legal)[0].scene!.items.filter(item => item.kind === "line");
    render(<LegalMapContent legal={legal} />);
    const drawing = screen.getByRole("img", { name: "Metes & Bounds schematic" });
    const legend = screen.getByLabelText("Map legend");
    expect(within(legend).getByText("Parcel boundary")).toBeVisible();
    expect(within(legend).queryByText("Tie line (Commencement)") !== null).toBe(beginning === 2);
    expect(legend.closest("[data-legal-map-footer]")).not.toBeNull();
    expect(legend).toHaveStyle({ marginLeft: "auto" });
    const courses = drawing.querySelectorAll("[data-survey-line]");
    const [x, y, width, height] = drawing.getAttribute("viewBox")!.split(" ").map(Number);
    const points = lines.flatMap(line => [line.from, line.to]);
    expect(x + width / 2).toBeCloseTo((Math.min(...points.map(point => point.x)) + Math.max(...points.map(point => point.x))) / 2);
    expect(y + height / 2).toBeCloseTo((Math.min(...points.map(point => point.y)) + Math.max(...points.map(point => point.y))) / 2);
    expect(courses).toHaveLength(lines.length);
    for (const [index, line] of lines.entries()) {
      expect(courses[index]).toHaveAttribute("x1", String(line.from.x));
      expect(courses[index]).toHaveAttribute("y1", String(line.from.y));
      expect(courses[index]).toHaveAttribute("x2", String(line.to.x));
      expect(courses[index]).toHaveAttribute("y2", String(line.to.y));
      expect(courses[index]).toHaveAttribute("stroke", beginning === 2 && index === 0 ? "#d5dee2" : "#2496c8");
      if (beginning === 2 && index === 0) expect(courses[index]).toHaveAttribute("stroke-dasharray", "6 4");
      else expect(courses[index]).not.toHaveAttribute("stroke-dasharray");
    }
    const fill = drawing.querySelector("[data-boundary-fill]");
    if (beginning !== null) {
      const start = lines[beginning - 1].from;
      expect(fill!.getAttribute("d")!.startsWith(`M ${start.x} ${start.y} `)).toBe(true);
      expect(fill!.getAttribute("d")!.match(/L /g)).toHaveLength(lines.length - beginning + 1);
      const label = within(drawing).getByText("POB", { exact: true });
      expect(label.parentElement!.querySelector("[data-survey-vertex]")).toHaveTextContent(String(beginning));
    } else {
      expect(fill).toBeNull();
      expect(within(drawing).queryByText("POB", { exact: true })).not.toBeInTheDocument();
    }
    if (beginning === 2) {
      expect(within(drawing).getByText("POC", { exact: true }).parentElement!.querySelector("[data-survey-vertex]")).toHaveTextContent("1");
      const annotation = drawing.closest("[data-legal-map-surface]")!.querySelector("[data-survey-tie-label]")!;
      expect(annotation).toHaveTextContent(bearings.split("; ")[0]);
      expect(annotation).toHaveTextContent(distances.split("; ")[0]);
    } else expect(within(drawing).queryByText("POC", { exact: true })).not.toBeInTheDocument();
    const rows = within(screen.getByRole("table", { name: "Boundary Calls" })).getAllByRole("row").slice(1);
    for (const [index, row] of rows.entries()) {
      expect(within(row).getAllByRole("cell").map(node => node.textContent)).toEqual([
        String(index + 1), `${index + 1} → ${index === rows.length - 1 && beginning !== null ? beginning : index + 2}`,
        bearings.split("; ")[index], distances.split("; ")[index],
      ]);
    }
    fireEvent.click(screen.getByRole("tab", { name: "Acreage" }));
    expect(screen.getByText("2.005 ACRES OF LAND, MORE OR LESS")).toBeVisible();
    expect(JSON.stringify(legal)).toBe(original);
  });

  it("recognizes the rounded seven-course sample and excludes its tie from the fill", () => {
    const legal = { ...surveyFixture, groups: surveyFixture.groups!.filter(group => group.type === "metes_bounds") };
    render(<LegalMapContent legal={legal} />);
    const drawing = screen.getByRole("img", { name: "Metes & Bounds schematic" });
    expect(within(drawing).getByText("POC", { exact: true })).toBeVisible();
    expect(within(drawing).getByText("POB", { exact: true })).toBeVisible();
    expect(drawing.querySelectorAll("[data-survey-line]")).toHaveLength(7);
    expect(drawing.querySelector("[data-boundary-fill]")!.getAttribute("d")!.match(/L /g)).toHaveLength(6);
    expect(within(screen.getByRole("table", { name: "Boundary Calls" })).getAllByRole("row").at(-1)).toHaveTextContent("7 → 2");
  });

  it("classifies independent tracts separately", () => {
    render(<LegalMapContent legal={{ groups: [
      { type: "metes_bounds", elements: [{ aspect: "bearings", value: "N; E; S; W" }, { aspect: "distances", value: "100 ft; 50 ft; 100 ft; 50 ft" }] },
      { type: "metes_bounds", elements: [{ aspect: "bearings", value: "E; N; E; S; W" }, { aspect: "distances", value: "10 ft; 100 ft; 50 ft; 100 ft; 50 ft" }] },
    ] }} />);
    const [parcel, tract] = screen.getAllByRole("img", { name: /Parcel .*schematic/ });
    expect(within(parcel).queryByText("POC", { exact: true })).not.toBeInTheDocument();
    expect(within(parcel).getByText("POB", { exact: true }).parentElement!.querySelector("[data-survey-vertex]")).toHaveTextContent("1");
    expect(within(tract).getByText("POC", { exact: true })).toBeVisible();
    expect(within(tract).getByText("POB", { exact: true }).parentElement!.querySelector("[data-survey-vertex]")).toHaveTextContent("2");
    expect(parcel.querySelectorAll("[data-survey-line]")).toHaveLength(4);
    expect(tract.querySelectorAll("[data-survey-line]")).toHaveLength(5);
  });

  it.each([0.1, 1, 100])("uses total course length at scale %s", scale => {
    const { rerender } = render(<LegalMapContent legal={{ groups: [{ type: "metes_bounds", elements: [
      { aspect: "bearings", value: "N; E; S; W" },
      { aspect: "distances", value: [100, 50, 100, 50.299].map(length => `${length * scale} ft`).join("; ") },
    ] }] }} />);
    expect(document.querySelector("[data-boundary-fill]")).not.toBeNull();
    rerender(<LegalMapContent legal={{ groups: [{ type: "metes_bounds", elements: [
      { aspect: "bearings", value: "N; E; S; W" },
      { aspect: "distances", value: [100, 50, 100, 50.301].map(length => `${length * scale} ft`).join("; ") },
    ] }] }} />);
    expect(document.querySelector("[data-boundary-fill]")).toBeNull();
  });

  it.each([
    { distances: "100 m; 50 m; 100 m; 50.2 m", closed: true },
    { distances: "100; 50; 100; 50.2", closed: true },
    { distances: "100 ft; 50 ft; 100 ft; 51 ft", closed: false },
    { distances: "100 m; 50 m; 100 m; 164.6981627296588 ft", closed: true },
  ])("keeps closure geometry without a diagnostic row for $distances", ({ distances, closed }) => {
    const legal = { groups: [{ type: "metes_bounds", elements: [
      { aspect: "bearings", value: "N; E; S; W" }, { aspect: "distances", value: distances },
    ] }] };
    const lines = getMapGroups(legal)[0].scene!.items.filter(item => item.kind === "line");
    render(<LegalMapContent legal={legal} />);
    expect(screen.queryByLabelText("Closure details")).toBeNull();
    expect(document.body.textContent).not.toMatch(/Closure:|Gap:|Tolerance:/);
    expect(Boolean(document.querySelector("[data-boundary-fill]"))).toBe(closed);
    const gapLine = document.querySelector("[data-survey-gap]")!;
    expect(gapLine).toHaveAttribute("x1", String(lines.at(-1)!.to.x));
    expect(gapLine).toHaveAttribute("y1", String(lines.at(-1)!.to.y));
    expect(gapLine).toHaveAttribute("x2", String(lines[0].from.x));
    expect(gapLine).toHaveAttribute("y2", String(lines[0].from.y));
    expect(gapLine).toHaveAttribute("stroke-dasharray", "3 3");
    expect(gapLine).toHaveAttribute("stroke", "#62727d");
  });

  it("recognizes the nine-course sample without moving the endpoint to POB", () => {
    const lines = getMapGroups(tieFixture)[0].scene!.items.filter(item => item.kind === "line");
    render(<LegalMapContent legal={tieFixture} />);
    expect(screen.queryByLabelText("Closure details")).toBeNull();
    expect(screen.getByText("POB", { exact: true }).parentElement!.querySelector("[data-survey-vertex]")).toHaveTextContent("2");
    expect(document.querySelector("[data-survey-gap]")).toHaveAttribute("x2", String(lines[1].from.x));
    expect(document.querySelector("[data-survey-gap]")).toHaveAttribute("x1", String(lines.at(-1)!.to.x));
    expect(document.querySelectorAll("[data-survey-line]")).toHaveLength(9);
    expect(within(screen.getByRole("table", { name: "Boundary Calls" })).getAllByRole("row").at(-1)).toHaveTextContent("9 → 2");
  });

  it("does not invent closure percentages for zero-length courses or PLSS", () => {
    const { rerender } = render(<LegalMapContent legal={{ groups: [{ type: "metes_bounds", elements: [
      { aspect: "bearings", value: "N; E" }, { aspect: "distances", value: "0; 0" },
    ] }] }} />);
    expect(screen.queryByLabelText("Closure details")).not.toBeInTheDocument();
    expect(document.querySelector("[data-boundary-fill]")).toBeNull();
    expect(document.body.textContent).not.toMatch(/NaN|Infinity/);
    rerender(<LegalMapContent legal={{ groups: [{ type: "plss", elements: [{ aspect: "aliquots", value: "NE1/4 of Section 12" }] }] }} />);
    expect(screen.queryByLabelText("Closure details")).not.toBeInTheDocument();
    expect(document.querySelector("[data-survey-gap]")).toBeNull();
  });
});
