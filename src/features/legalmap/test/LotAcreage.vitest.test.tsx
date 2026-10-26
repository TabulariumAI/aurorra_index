import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LegalMapContent } from "../component/LegalMapContent";
import { displayLots, toPlatJSON } from "../data/legalData";
import { acreageFixture, acreageValues } from "./acreageFixture";

describe("lot acreage", () => {
  it.each([undefined, 1, 2])("preserves source acreage outside the lots in the appropriate maps with parcel count %s", parcels_num => {
    const legal = { ...acreageFixture, parcels_num };
    const source = JSON.stringify(legal);
    render(<LegalMapContent legal={legal} />);
    const lots = document.querySelectorAll<HTMLElement>("[data-legal-map-lot]");
    expect(lots).toHaveLength(parcels_num === 2 ? 2 : 1);
    expect(Array.from(document.querySelectorAll("[data-lot-acreage]"), node => node.textContent)).toEqual(acreageValues);
    expect(document.querySelectorAll("[data-acreage-leader]")).toHaveLength(2);
    for (const lot of lots) {
      expect(lot.querySelector("[data-lot-acreage]")).toBeNull();
      expect(lot).toHaveStyle({ aspectRatio: "1", overflow: "hidden" });
    }
    expect(document.querySelectorAll('[data-legal-map-aspect="acreage"]')).toHaveLength(0);
    for (const [index, value] of acreageValues.entries()) {
      expect(parcels_num === 1 ? screen.getAllByRole("table", { name: "Details" })[index] : screen.getByRole("table", { name: `Parcel ${index + 1} details` })).toHaveTextContent(value);
    }
    expect(document.querySelector("[data-legal-map-block-label]")).toHaveTextContent("12");
    expect(JSON.stringify(legal)).toBe(source);
  });

  it("keeps acreage with its own lot, including gaps, matching names in other blocks, and nonnumeric lots", () => {
    const groups = [
      ["1", "2", "FIRST"], ["3", "2", "THIRD"], ["1", "9", "OTHER BLOCK"], ["A", "2", "LETTER"],
    ].map(([lot, block, value]) => ({ type: "lot_block", elements: [
      { aspect: "lot", value: lot }, { aspect: "block", value: block }, { aspect: "acreage", value },
    ] }));
    render(<LegalMapContent legal={{ groups }} />);
    const lots = [...document.querySelectorAll<HTMLElement>("[data-legal-map-lot]")];
    expect([...document.querySelectorAll("[data-lot-acreage]")].map(label => label.textContent)).toEqual(["FIRST", "THIRD", "LETTER", "OTHER BLOCK"]);
    expect(document.querySelector("[data-legal-map-empty]")?.querySelector("[data-lot-acreage]")).toBeNull();
  });

  it("preserves repeated acreage values, source text and other omitted aspects", () => {
    const value = "  2 ACRES; MORE OR LESS\n(source)  ";
    render(<LegalMapContent legal={{ groups: [{ type: "lot_block", elements: [
      { aspect: "lot", value: "Lot 6" }, { aspect: "acreage", value },
      { aspect: "acreage", value }, { aspect: "acreage", value: " " }, { aspect: "part", value: "Tract A" },
    ] }] }} />);
    expect(Array.from(document.querySelectorAll("[data-lot-acreage]"), node => node.textContent)).toEqual([value, value]);
    expect(screen.getByRole("table", { name: "Details" })).toHaveTextContent("Tract A");
  });

  it("retains acreage as data when no individual lot is identified", () => {
    for (const lot of [undefined, "1, 3", "1-20"]) {
      const legal = { groups: [{ type: "lot_block", elements: [
        ...(lot ? [{ aspect: "lot", value: lot }] : []), { aspect: "acreage", value: "2 ACRES TOTAL" },
      ] }] };
      const { unmount } = render(<LegalMapContent legal={legal} />);
      expect(screen.getByRole("table", { name: "Details" })).toHaveTextContent("2 ACRES TOTAL");
      expect(document.querySelectorAll("[data-lot-acreage]")).toHaveLength(0);
      unmount();
    }
  });

  it("refreshes acreage and keeps map tabs, details and unannotated lots working", () => {
    const addressMap = { address: "test", content: <iframe title="Address map" /> };
    const { rerender } = render(<LegalMapContent legal={acreageFixture} addressMaps={[addressMap]} />);
    fireEvent.click(screen.getByRole("tab", { name: "Address" }));
    expect(screen.getByTitle("Address map")).toBeVisible();
    fireEvent.keyDown(screen.getByRole("tab", { name: "Address" }), { key: "Home" });
    expect(document.querySelectorAll("[data-lot-acreage]")).toHaveLength(2);
    rerender(<LegalMapContent legal={{ groups: [{ type: "lot_block", elements: [{ aspect: "lot", value: "6" }] }] }} addressMaps={[addressMap]} />);
    expect(document.querySelectorAll("[data-lot-acreage], [data-acreage-leader]")).toHaveLength(0);
    expect(document.querySelector("[data-legal-map-lot]")).toHaveTextContent("6Lot");
    expect(within(screen.getByRole("table", { name: "Details" })).queryByText(acreageValues[0])).toBeNull();
  });

  it("carries acreage through normalization and numeric lot display without changing existing lot shapes", () => {
    const lots = toPlatJSON(acreageFixture)[0].divisions[0].blocks[0].lots;
    expect(lots).toEqual([{ kind: "lot", name: "6", acreage: acreageValues }]);
    expect(displayLots(lots)).toEqual([{ kind: "lot", name: "6", filled: true, acreage: acreageValues }]);
    expect(displayLots([{ kind: "lot", name: "6" }])).toEqual([{ kind: "lot", name: "6", filled: true }]);
  });

  it("preserves repeated source entries when one-parcel groups merge", () => {
    const value = "  2 ACRES, MORE OR LESS  ";
    render(<LegalMapContent legal={{ parcels_num: 1, groups: ["6", "Lot 6"].map(lot => ({ type: "lot_block", elements: [
      { aspect: "lot", value: lot }, { aspect: "acreage", value }, { aspect: "acreage", value },
    ] })) }} />);
    expect(Array.from(document.querySelectorAll("[data-lot-acreage]"), node => node.textContent)).toEqual([value, value, value, value]);
  });

  it.each(["numeric", "named"])("preserves acreage when the existing %s lot display compresses its tiles", kind => {
    const groups = Array.from({ length: 13 }, (_, index) => ({ type: "lot_block", elements: [
      { aspect: "lot", value: kind === "numeric" ? String(index * 2 + 1) : `Tract ${String.fromCharCode(65 + index)}` },
      { aspect: "acreage", value: `${index + 1} ACRES` },
    ] }));
    render(<LegalMapContent legal={{ groups }} />);
    expect(document.querySelectorAll("[data-legal-map-lot]").length).toBeLessThanOrEqual(12);
    expect(Array.from(document.querySelectorAll("[data-lot-acreage]"), node => node.textContent)).toEqual(groups.map(group => group.elements[1].value));
    expect(document.querySelectorAll('[data-legal-map-aspect="acreage"]')).toHaveLength(0);
  });

  it("keeps repeated acreage entries from changing the existing parcel merge weights", () => {
    const legal = { parcels_num: 3, groups: [
      { type: "lot_block", elements: [
        { aspect: "lot", value: "1" }, ...["A", "A", "A"].map(value => ({ aspect: "acreage", value })),
      ] },
      { type: "lot_block", elements: [{ aspect: "lot", value: "2" }, { aspect: "acreage", value: "A" }] },
      ...["3", "4"].map(value => ({ type: "lot_block", elements: [
        { aspect: "lot", value }, { aspect: "block", value: "B" }, { aspect: "phase", value: "I" },
      ] })),
    ] };
    expect(toPlatJSON(legal)[0].divisions.find(division => division.phase === "I")!.blocks[0].lots).toEqual([{ kind: "lot", name: "3,4" }]);
  });
});
