import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LegalMapContent } from "../component/LegalMapContent";

describe("Lot & block borders", () => {
  it.each([undefined, "unit", "phase", "section"])("draws all sixteen cells when only %s identifies the enclosing division", aspect => {
    render(<LegalMapContent legal={{ groups: [{ type: "lot_block", elements: [
      { aspect: "lot", value: "24" }, ...(aspect ? [{ aspect, value: "2" }] : []),
    ] }] }} />);
    const grid = document.querySelector("[data-legal-map-block]")!;
    const cells = [...grid.children] as HTMLElement[];
    expect(cells).toHaveLength(16);
    expect(new Set(cells.map(cell => `${cell.style.gridRow}-${cell.style.gridColumn}`))).toEqual(new Set(
      [1, 2, 3, 4].flatMap(row => [1, 2, 3, 4].map(column => `${row}-${column}`)),
    ));
    for (const row of [2, 3]) for (const column of [2, 3]) {
      const cell = cells.find(cell => cell.style.gridRow === String(row) && cell.style.gridColumn === String(column))!;
      expect(cell).toHaveStyle({ border: "1px solid #91aebe", aspectRatio: "1" });
      expect(cell.textContent).toBe("");
      expect(cell).not.toHaveAttribute("data-legal-map-lot");
      expect(cell).not.toHaveAttribute("data-lot-slot");
      expect(cell.querySelector("[data-map-label]")).toBeNull();
    }
    expect(grid.querySelector("[data-legal-map-lot]")).toHaveTextContent("24Lot");
    expect(grid.querySelector("[data-legal-map-lot]")).toHaveStyle({ gridRow: "1", gridColumn: "1" });
    expect(document.querySelector(".legal-map-legend")).not.toHaveTextContent(/Block|Tract/);
  });

  it.each(["block", "tract"])("outlines the %s center and empty cells using the existing block border", aspect => {
    render(<LegalMapContent legal={{ groups: [{ type: "lot_block", elements: [
      { aspect, value: "4" }, { aspect: "lot", value: "1, 3" },
    ] }] }} />);
    const grid = document.querySelector("[data-legal-map-block]")!;
    expect(grid.firstElementChild).toHaveStyle({ border: "1px solid #91aebe", gridColumn: "2 / 4", gridRow: "2 / 4" });
    expect(grid.firstElementChild).toHaveTextContent(aspect === "block" ? "4Block" : "4Tract");
    const cells = [...grid.children].slice(1);
    expect(cells).toHaveLength(12);
    for (const cell of cells) {
      expect(cell).toHaveStyle({ border: cell.hasAttribute("data-legal-map-lot") ? "1px solid #cf7258" : "1px solid #91aebe", aspectRatio: "1" });
      if (!cell.hasAttribute("data-legal-map-lot")) expect(cell.textContent).toBe("");
    }
  });

  it("keeps sparse lots on their existing perimeter slots while filling the unnamed center", () => {
    render(<LegalMapContent legal={{ groups: [{ type: "lot_block", elements: [{ aspect: "lot", value: "1, 3, 5" }] }] }} />);
    const grid = document.querySelector("[data-legal-map-block]")!;
    expect(grid.children).toHaveLength(16);
    expect([...grid.querySelectorAll<HTMLElement>("[data-legal-map-lot]")].map(cell => ({
      text: cell.textContent, row: cell.style.gridRow, column: cell.style.gridColumn,
    }))).toEqual([
      { text: "1Lot", row: "1", column: "1" },
      { text: "3Lot", row: "1", column: "3" },
      { text: "5Lot", row: "2", column: "4" },
    ]);
    expect([...grid.querySelectorAll("[data-legal-map-empty]")].map(cell => cell.textContent)).toEqual(["", ""]);
  });

  it("keeps the twelve source lot ranges on the perimeter of an unnamed grid", () => {
    render(<LegalMapContent legal={{ groups: [{ type: "lot_block", elements: [{ aspect: "lot", value: "1-99" }] }] }} />);
    const grid = document.querySelector("[data-legal-map-block]")!;
    expect(grid.children).toHaveLength(16);
    expect(grid.querySelectorAll("[data-legal-map-lot]")).toHaveLength(12);
    for (const cell of grid.querySelectorAll<HTMLElement>("[data-legal-map-lot]")) {
      expect(cell.style.gridRow === "1" || cell.style.gridRow === "4" || cell.style.gridColumn === "1" || cell.style.gridColumn === "4").toBe(true);
    }
  });

  it("replaces unnamed center cells with source Block and Tract labels and restores them when cleared", () => {
    const { rerender } = render(<LegalMapContent legal={{ groups: [{ type: "lot_block", elements: [{ aspect: "lot", value: "24" }] }] }} />);
    expect(document.querySelector("[data-legal-map-block]")!.children).toHaveLength(16);
    for (const elements of [
      [{ aspect: "block", value: "4" }],
      [{ aspect: "tract", value: "A" }],
      [{ aspect: "block", value: "4" }, { aspect: "tract", value: "A" }],
      [{ aspect: "block", value: " " }, { aspect: "tract", value: " " }],
    ]) {
      rerender(<LegalMapContent legal={{ groups: [{ type: "lot_block", elements: [{ aspect: "lot", value: "24" }, ...elements] }] }} />);
      const grid = document.querySelector("[data-legal-map-block]")!;
      const named = elements.some(element => element.value.trim());
      expect(grid.children).toHaveLength(named ? 13 : 16);
      expect(grid.querySelectorAll(":scope > div")).toHaveLength(named ? 1 : 0);
      for (const element of elements.filter(element => element.value.trim())) {
        expect(grid.querySelector(`[data-legal-map-${element.aspect}-label]`)).toHaveTextContent(element.value);
      }
      expect(grid.querySelectorAll("[data-legal-map-lot]")).toHaveLength(1);
    }
  });

  it("preserves acreage and location without assigning source data to the four center cells", () => {
    render(<LegalMapContent legal={{ parcels_num: 1, groups: [{ type: "lot_block", elements: [
      { aspect: "lot", value: "24" }, { aspect: "acreage", value: "2 ACRES" },
      { aspect: "county", value: "LAKE" }, { aspect: "state", value: "IL" },
    ] }] }} />);
    const grid = document.querySelector("[data-legal-map-block]")!;
    expect(grid.children).toHaveLength(16);
    expect(grid.querySelector("[data-legal-map-lot]")).toHaveAttribute("data-lot-slot", "1-1");
    expect(document.querySelector("[data-lot-acreage]")).toHaveAttribute("data-acreage-slot", "1-1");
    expect(document.querySelector("[data-lot-acreage]")).toHaveTextContent("2 ACRES");
    expect(document.querySelectorAll("[data-acreage-leader]")).toHaveLength(1);
    expect(document.querySelector("[data-legal-map-location]")).toHaveTextContent("Illinois | Lake County");
  });

  it.each([undefined, "unit", "phase", "section"])("outlines division areas with %s available", aspect => {
    render(<LegalMapContent legal={{ groups: [{ type: "lot_block", elements: [
      { aspect: "lot", value: "24" }, ...(aspect ? [{ aspect, value: "2" }] : []),
    ] }] }} />);
    expect(document.querySelector("[data-legal-map-division]")).toHaveStyle({ border: "2px solid #c8bdaa" });
    expect(document.querySelector("[data-legal-map-subdivision]")).toHaveStyle({ border: "2px dashed #3a7c8c" });
    expect(document.querySelector("[data-legal-map-lot]")).toHaveStyle({ border: "1px solid #cf7258" });
    expect(document.querySelector(".legal-map-legend")).not.toHaveTextContent("Block");
  });
});
