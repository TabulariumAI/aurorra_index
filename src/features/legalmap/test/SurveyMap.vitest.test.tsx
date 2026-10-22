import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LegalMapContent } from "../component/LegalMapContent";
import type { LegalGroup } from "aurora-core";

const plss: LegalGroup = { type: "plss", elements: [{ aspect: "aliquots", value: "NE1/4 of Section 12" }, { aspect: "township", value: "T2N" }] };
const metes: LegalGroup = { type: "metes_bounds", elements: [
  { aspect: "bearings", value: "N; E; S" }, { aspect: "distances", value: "100 ft; 50 ft; 100 ft" },
  { aspect: "acreage", value: "2 acres" },
] };

describe("schematic map integration", () => {
  it.each(["groups", "legalGroups", "LegalGroups", "items"])("opens PLSS without an address from %s", key => {
    render(<LegalMapContent legal={{ [key]: [plss] }} />);
    expect(screen.getByRole("tab", { name: "PLSS" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("img", { name: "PLSS schematic" })).toBeVisible();
    expect(document.querySelector("[data-survey-reference]")).toBeNull();
    expect(screen.queryByText("Schematic - Not to Scale")).not.toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "Plat" })).not.toBeInTheDocument();
  });

  it("uses the approved tab order, keyboard navigation and original Plat content", () => {
    render(<LegalMapContent legal={{ groups: [metes, plss, { type: "lot_block", elements: [{ aspect: "lot", value: "8" }] }] }} addressMap={{ address: "123 Main Street", content: <div>Address map content</div> }} />);
    expect(screen.getAllByRole("tab").map(tab => tab.textContent)).toEqual(["Plat", "Metes & Bounds", "PLSS", "Address"]);
    const plat = screen.getByRole("tab", { name: "Plat" });
    expect(plat).toHaveAttribute("aria-selected", "true");
    expect(document.querySelector("[data-legal-map-lot]")).toHaveTextContent("8Lot");
    fireEvent.keyDown(plat, { key: "ArrowRight" });
    expect(screen.getByRole("tab", { name: "Metes & Bounds" })).toHaveFocus();
    expect(screen.getByRole("img", { name: "Metes & Bounds schematic" })).toBeVisible();
    fireEvent.keyDown(screen.getByRole("tab", { name: "Metes & Bounds" }), { key: "ArrowRight" });
    expect(screen.getByRole("tab", { name: "PLSS" })).toHaveFocus();
    expect(screen.getByRole("tabpanel")).toHaveAccessibleName("PLSS");
    fireEvent.keyDown(screen.getByRole("tab", { name: "PLSS" }), { key: "End" });
    expect(screen.getByText("Address map content")).toBeVisible();
    expect(screen.queryByRole("heading", { name: "Address" })).not.toBeInTheDocument();
    expect(screen.queryByText("123 Main Street")).not.toBeInTheDocument();
  });

  it.each([[plss, metes], [metes, plss]])("opens Metes & Bounds before PLSS regardless of source order %#", (...groups) => {
    render(<LegalMapContent legal={{ groups }} />);
    expect(screen.getAllByRole("tab").map(tab => tab.textContent)).toEqual(["Metes & Bounds", "PLSS"]);
    expect(screen.getByRole("tab", { name: "Metes & Bounds" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("img", { name: "Metes & Bounds schematic" })).toBeVisible();
  });

  it("renders static courses without selection or focus targets", () => {
    render(<LegalMapContent legal={{ groups: [metes] }} />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    const svg = screen.getByRole("img", { name: "Metes & Bounds schematic" });
    expect(screen.queryByRole("button", { name: "Zoom in" })).not.toBeInTheDocument();
    expect(screen.getByText("2 acres")).toBeVisible();
    expect(document.querySelectorAll("[data-survey-line]")).toHaveLength(3);
    expect(svg.querySelector('path[data-boundary-fill]')).toBeNull();
  });

  it.each([
    { bearings: "E", distances: "50 ft", pairs: ["1 → 2"], vertices: ["1", "2"], closed: false },
    { bearings: "N; E; S", distances: "100 ft; 50 ft; 100 ft", pairs: ["1 → 2", "2 → 3", "3 → 4"], vertices: ["1", "2", "3", "4"], closed: false },
    { bearings: "N; E; S; W", distances: "100 ft; 50 ft; 100 ft; 50 ft", pairs: ["1 → 2", "2 → 3", "3 → 4", "4 → 1"], vertices: ["1", "2", "3", "4"], closed: true },
  ])("maps every distance to its numbered endpoints for $bearings", ({ bearings, distances, pairs, vertices, closed }) => {
    render(<LegalMapContent legal={{ groups: [{ type: "metes_bounds", elements: [
      { aspect: "bearings", value: bearings }, { aspect: "distances", value: distances },
    ] }] }} />);
    const drawing = screen.getByRole("img", { name: "Metes & Bounds schematic" });
    expect(drawing.querySelectorAll("[data-survey-reference]")).toHaveLength(1);
    const courses = drawing.querySelectorAll("[data-survey-line]");
    expect(courses[0]).toHaveAttribute("stroke", "#2496c8");
    for (const course of Array.from(courses).slice(1)) expect(course).toHaveAttribute("stroke", "#2496c8");
    expect(Array.from(drawing.querySelectorAll("[data-survey-vertex]"), node => node.textContent)).toEqual(vertices);
    const rows = within(screen.getByRole("table", { name: "Boundary Calls" })).getAllByRole("row");
    expect(within(rows[0]).getAllByRole("columnheader").map(node => node.textContent)).toEqual(["#", "Boundary", "Bearing", "Distance"]);
    for (const [index, pair] of pairs.entries()) {
      expect(within(rows[index + 1]).getAllByRole("cell").map(node => node.textContent)).toEqual([
        String(index + 1), pair, bearings.split("; ")[index], distances.split("; ")[index],
      ]);
    }
    expect(drawing.querySelector("[data-boundary-fill]") !== null).toBe(closed);
    if (!closed) {
      const lastLine = drawing.querySelectorAll("[data-survey-line]")[pairs.length - 1];
      const lastMarker = drawing.querySelectorAll("[data-survey-vertex]")[vertices.length - 1];
      expect(lastMarker).toHaveAttribute("x", lastLine.getAttribute("x2"));
      expect(lastMarker.parentElement!.querySelector("circle")).toHaveAttribute("cy", lastLine.getAttribute("y2"));
    }
  });

  it("shows acreage once in the information column", () => {
    render(<LegalMapContent legal={{ groups: [metes] }} />);
    const acreage = screen.getByLabelText("Reported acreage");
    expect(acreage).toContainElement(screen.getByText("2 acres"));
    expect(acreage.closest("[data-legal-map-info]")).not.toBeNull();
    expect(within(acreage).getAllByRole("listitem")).toHaveLength(1);
    expect(acreage.closest("[data-legal-map-surface]")).toBeNull();
    const swatch = acreage.querySelector("[data-survey-swatch] rect")!;
    expect(swatch).toHaveAttribute("fill", "#63b5d5");
    expect(swatch).toHaveAttribute("fill-opacity", "0.25");
    expect(swatch).toHaveAttribute("stroke", "#2496c8");
  });

  it.each(["N", "E", "S", "W"])("shows a full north–south reference through point 1 for a %s course", bearing => {
    render(<LegalMapContent legal={{ groups: [{ type: "metes_bounds", elements: [
      { aspect: "bearings", value: bearing }, { aspect: "distances", value: "100 ft" },
    ] }] }} />);
    expect(screen.queryByRole("heading", { name: "Boundary Calls" })).not.toBeInTheDocument();
    expect(screen.getByRole("table", { name: "Boundary Calls" })).toBeVisible();
    expect(screen.getByRole("region", { name: "Boundary Calls" })).toHaveStyle({ overflowY: "auto" });
    const drawing = screen.getByRole("img", { name: "Metes & Bounds schematic" });
    const reference = drawing.querySelector("[data-survey-reference]")!;
    const course = drawing.querySelector("[data-survey-line]")!;
    const [, top, , height] = drawing.getAttribute("viewBox")!.split(" ").map(Number);
    expect(reference).toHaveAttribute("x1", course.getAttribute("x1"));
    expect(reference).toHaveAttribute("x2", course.getAttribute("x1"));
    expect(reference).toHaveAttribute("y1", String(top));
    expect(reference).toHaveAttribute("y2", String(top + height));
    expect(reference).toHaveAttribute("stroke-dasharray", "6 4");
    expect(within(drawing).queryByText("N", { exact: true })).toBeNull();
    expect(within(drawing).queryByText("S", { exact: true })).toBeNull();
    expect(drawing.querySelectorAll("[data-survey-line]")).toHaveLength(1);
    expect(drawing.querySelector("[data-boundary-fill]")).toBeNull();
  });

  it("does not offer an undrawable boundary view", () => {
    render(<LegalMapContent legal={{ groups: [{ type: "metes_bounds", elements: [{ aspect: "bearings", value: "curve along river" }] }] }} />);
    expect(screen.queryByRole("img", { name: "Metes & Bounds schematic" })).not.toBeInTheDocument();
    expect(screen.queryByRole("tab")).not.toBeInTheDocument();
    expect(document.querySelectorAll("[data-survey-line]")).toHaveLength(0);
  });

  it("renders independent groups without connecting their courses", () => {
    render(<LegalMapContent legal={{ groups: [metes, metes] }} />);
    expect(screen.getAllByRole("img", { name: /Metes & Bounds.*schematic/ })).toHaveLength(2);
    expect(document.querySelectorAll("[data-survey-line]")).toHaveLength(6);
    for (const drawing of screen.getAllByRole("img", { name: /Metes & Bounds.*schematic/ })) {
      expect(Array.from(drawing.querySelectorAll("[data-survey-vertex]"), node => node.textContent)).toEqual(["1", "2", "3", "4"]);
      expect(drawing.querySelectorAll("[data-survey-reference]")).toHaveLength(1);
      expect(drawing.querySelector("[data-survey-line]")).toHaveAttribute("stroke", "#2496c8");
    }
  });

  it("updates the active view when the available groups change", () => {
    const { rerender } = render(<LegalMapContent legal={{ groups: [plss] }} />);
    rerender(<LegalMapContent legal={{ groups: [metes] }} />);
    expect(screen.getByRole("tab", { name: "Metes & Bounds" })).toHaveAttribute("aria-selected", "true");
    expect(screen.queryByRole("img", { name: "PLSS schematic" })).not.toBeInTheDocument();
  });
});
