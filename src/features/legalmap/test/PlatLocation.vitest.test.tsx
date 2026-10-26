import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LegalMapContent } from "../component/LegalMapContent";
import { normalizeLegalData } from "../data/legalData";

describe("Lot & block location", () => {
  it.each([
    [{ city: "GRAYSLAKE" }, "Grayslake"],
    [{ county: "LAKE COUNTY" }, "Lake County"],
    [{ state: "IL" }, "Illinois"],
    [{ city: "GRAYSLAKE", county: "LAKE" }, "Lake County | Grayslake"],
    [{ city: "GRAYSLAKE", state: "IL" }, "Illinois | Grayslake"],
    [{ county: "LAKE", state: "ILLINOIS" }, "Illinois | Lake County"],
    [{ city: "GRAYSLAKE", county: "LAKE", state: "IL" }, "Illinois | Lake County | Grayslake"],
    [{ city: " ", county: "", state: " " }, ""],
  ])("shows available group fields %j directly below the fitted diagram", (fields, label) => {
    const legal = { parcels_num: 1, groups: [{ type: "lot_block", elements: [
      { aspect: "lot", value: "24" },
      ...Object.entries(fields).map(([aspect, value]) => ({ aspect, value })),
    ] }] };
    const source = JSON.stringify(legal);
    expect(normalizeLegalData(legal).locationLabel).toBe(label);
    render(<LegalMapContent legal={legal} />);
    const location = document.querySelector<HTMLElement>("[data-legal-map-location]");
    if (label) {
      expect(location).toHaveTextContent(label);
      const grid = document.querySelector("[data-legal-map-grid]")!;
      expect(grid.lastElementChild).toBe(location);
      expect(location?.previousElementSibling).toBe(grid.firstElementChild);
      const surface = document.querySelector("[data-legal-map-surface]")!;
      expect(surface).toContainElement(location);
      expect(surface.querySelector("[data-legal-map-drawing]")).toContainElement(location);
      expect(location!.compareDocumentPosition(surface.querySelector("[data-legal-map-footer]")!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    } else expect(location).toBeNull();
    expect(document.querySelector("[data-legal-map-lot]")).toHaveTextContent("24Lot");
    expect(JSON.stringify(legal)).toBe(source);
  });

  it.each(["groups", "legalGroups", "LegalGroups", "items"])("reads group location from existing %s containers", key => {
    expect(normalizeLegalData({ [key]: [{ type: "lot_block", elements: [
      { aspect: "lot", value: "24" }, { aspect: "county", value: "LAKE" }, { aspect: "state", value: "IL" },
    ] }] }).locationLabel).toBe("Illinois | Lake County");
  });

  it("keeps parcel locations separate and updates them after tab switching and replacement", () => {
    const groups = [
      { type: "lot_block", elements: [{ aspect: "lot", value: "24" }, { aspect: "city", value: "Grayslake" }, { aspect: "county", value: "Lake" }, { aspect: "state", value: "IL" }] },
      { type: "lot_block", elements: [{ aspect: "lot", value: "7" }, { aspect: "city", value: "Austin" }, { aspect: "county", value: "Travis" }, { aspect: "state", value: "TX" }] },
    ];
    const { rerender } = render(<LegalMapContent legal={{ parcels_num: 2, groups }} addressMaps={[{ address: "test", content: <iframe title="Address map" /> }]} />);
    expect([...document.querySelectorAll("[data-legal-map-location]")].map(node => node.textContent)).toEqual(["Illinois | Lake County | Grayslake", "Texas | Travis County | Austin"]);
    for (const surface of document.querySelectorAll("[data-legal-map-surface]")) {
      expect(surface.querySelectorAll("[data-legal-map-location]")).toHaveLength(1);
      expect(surface.querySelector("[data-legal-map-grid]")!.lastElementChild).toHaveAttribute("data-legal-map-location", "true");
    }
    fireEvent.click(screen.getByRole("tab", { name: "Address" }));
    expect(document.querySelector("[data-legal-map-location]")).toBeNull();
    fireEvent.click(screen.getByRole("tab", { name: "Lot & block" }));
    expect(document.querySelectorAll("[data-legal-map-location]")).toHaveLength(2);
    rerender(<LegalMapContent legal={{ parcels_num: 1, groups: [groups[1]] }} />);
    expect(document.querySelector("[data-legal-map-location]")).toHaveTextContent("Texas | Travis County | Austin");
    expect(document.querySelectorAll("[data-legal-map-location]")).toHaveLength(1);
  });

  it("uses group values rather than unrelated top-level or other-view locations", () => {
    render(<LegalMapContent legal={{ parcels_num: 1, plat: { city: "Wrong City", county: "Wrong County", state: "TX" }, groups: [
      { type: "lot_block", elements: [{ aspect: "lot", value: "24" }, { aspect: "county", value: "LAKE" }] },
      { type: "plss", elements: [{ aspect: "section", value: "12" }, { aspect: "city", value: "Wrong City" }] },
    ] }} />);
    expect(document.querySelector("[data-legal-map-location]")).toHaveTextContent(/^Lake County$/);
  });

  it("combines available fields from source groups merged into one parcel", () => {
    render(<LegalMapContent legal={{ parcels_num: 1, groups: [
      { type: "lot_block", elements: [{ aspect: "lot", value: "24" }, { aspect: "city", value: "Grayslake" }] },
      { type: "lot_block", elements: [{ aspect: "lot", value: "24" }, { aspect: "county", value: "Lake" }, { aspect: "state", value: "IL" }] },
    ] }} />);
    expect(document.querySelectorAll("[data-legal-map-location]")).toHaveLength(1);
    expect(document.querySelector("[data-legal-map-location]")).toHaveTextContent("Illinois | Lake County | Grayslake");
    expect(document.querySelectorAll("[data-legal-map-lot]")).toHaveLength(1);
  });
});
