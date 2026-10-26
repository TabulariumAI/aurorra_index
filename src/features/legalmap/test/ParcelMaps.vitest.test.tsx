import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LegalMapContent } from "../component/LegalMapContent";
import { acreageFixture, acreageValues } from "./acreageFixture";

describe("Lot Block parcel maps", () => {
  it("draws two independent maps for two parcels even when their lot and block identifiers match", () => {
    const legal = { ...acreageFixture, parcels_num: 2 };
    const source = JSON.stringify(legal);
    render(<LegalMapContent legal={legal} />);
    const maps = document.querySelectorAll<HTMLElement>("[data-legal-map-surface]");
    expect(maps).toHaveLength(2);
    expect(document.querySelectorAll("[data-map-scroll]")).toHaveLength(1);
    expect(document.querySelector("[data-map-scroll]")).toHaveStyle({ overflow: "auto" });
    expect(document.querySelectorAll("[data-legal-map-fit]")).toHaveLength(2);
    for (const grid of document.querySelectorAll("[data-legal-map-grid]")) expect(grid).toHaveStyle({ overflow: "visible" });
    for (const [index, map] of [...maps].entries()) {
      expect(map.querySelectorAll("[data-legal-map-block]")).toHaveLength(1);
      expect(map.querySelectorAll("[data-legal-map-lot]")).toHaveLength(1);
      expect(map.querySelector("[data-lot-acreage]")).toHaveTextContent(acreageValues[index]);
      expect(map.querySelectorAll("[data-acreage-leader]")).toHaveLength(1);
      expect(screen.getByRole("table", { name: `Parcel ${index + 1} details` })).toHaveTextContent(acreageValues[index]);
    }
    expect(screen.getByRole("heading", { name: "Parcel 1" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Parcel 2" })).toBeVisible();
    expect(within(screen.getByRole("tablist", { name: "Map views" })).getAllByRole("tab")).toHaveLength(1);
    expect(screen.queryByRole("alert")).toBeNull();
    expect(JSON.stringify(legal)).toBe(source);
  });

  it("draws the available parcel and a specific error for a missing second Lot Block group", () => {
    render(<LegalMapContent legal={{ parcels_num: 2, groups: [acreageFixture.groups![0]] }} />);
    expect(document.querySelectorAll("[data-legal-map-surface]")).toHaveLength(1);
    expect(screen.getByRole("alert", { name: "Parcel 2" })).toHaveTextContent("Cannot map: Lot Block legal group is missing for this parcel.");
    expect(document.querySelectorAll("[data-legal-map-lot]")).toHaveLength(1);
    expect(screen.getByRole("table", { name: "Parcel 1 details" })).toHaveTextContent(acreageValues[0]);
    expect(screen.queryByRole("table", { name: "Parcel 2 details" })).toBeNull();
  });

  it("draws one merged map for one parcel and two Lot Block groups", () => {
    render(<LegalMapContent legal={{ parcels_num: 1, groups: ["1", "4482C"].map((block, index) => ({ type: "lot_block", elements: [
      { aspect: "block", value: block }, { aspect: "lot", value: "6" }, { aspect: "acreage", value: acreageValues[index] },
    ] })) }} />);
    expect(document.querySelectorAll("[data-legal-map-surface]")).toHaveLength(1);
    expect(document.querySelectorAll("[data-legal-map-lot]")).toHaveLength(1);
    expect(document.querySelector("[data-legal-map-block-label]")).toHaveTextContent("1/4482C");
    expect(Array.from(document.querySelectorAll("[data-lot-acreage]"), node => node.textContent)).toEqual(acreageValues);
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("uses existing weighted merging when more groups than parcels are supplied", () => {
    render(<LegalMapContent legal={{ parcels_num: 2, groups: [
      { type: "lot_block", elements: [{ aspect: "lot", value: "9" }, { aspect: "block", value: "1" }, { aspect: "subdivision", value: "A" }] },
      ...["2", "4482C"].map(value => ({ type: "lot_block", elements: [
        { aspect: "lot", value: "32" }, { aspect: "block", value }, { aspect: "subdivision", value: "B" },
      ] })),
    ] }} />);
    const maps = document.querySelectorAll("[data-legal-map-surface]");
    expect(maps).toHaveLength(2);
    expect(maps[0].querySelector("[data-legal-map-block-label]")).toHaveTextContent("1");
    expect(maps[1].querySelector("[data-legal-map-block-label]")).toHaveTextContent("2/4482C");
    expect(screen.queryByRole("table", { name: "Parcel 3 details" })).toBeNull();
    expect(screen.getAllByRole("table", { name: "Parcel 2 details" })).toHaveLength(2);
  });

  it("keeps omitted aspects and source errors in their own parcel maps", () => {
    render(<LegalMapContent legal={{ parcels_num: 2, groups: [
      { type: "lot_block", elements: [{ aspect: "part", value: "Tract A" }] },
      { type: "lot_block", elements: [{ aspect: "county", value: "CHAMBERS" }] },
    ] }} />);
    expect(screen.getByRole("table", { name: "Parcel 1 details" })).toHaveTextContent("Tract A");
    expect(screen.getByRole("alert", { name: "Parcel 2" })).toHaveTextContent("only location fields");
    expect(screen.getByRole("table", { name: "Parcel 2 details" })).toHaveTextContent("CHAMBERS");
    expect(screen.queryByText("Lot Block legal group is missing", { exact: false })).toBeNull();
  });

  it("updates parcel count, missing errors, maps and details together without affecting Address navigation", () => {
    const addressMap = { address: "test", content: <iframe title="Address map" /> };
    const { rerender } = render(<LegalMapContent legal={{ ...acreageFixture, parcels_num: 2 }} addressMaps={[addressMap]} />);
    expect(document.querySelectorAll("[data-legal-map-surface]")).toHaveLength(2);
    fireEvent.click(screen.getByRole("tab", { name: "Address" }));
    expect(screen.getByTitle("Address map")).toBeVisible();
    fireEvent.keyDown(screen.getByRole("tab", { name: "Address" }), { key: "Home" });
    expect(document.querySelectorAll("[data-legal-map-surface]")).toHaveLength(2);
    rerender(<LegalMapContent legal={{ ...acreageFixture, parcels_num: 1 }} addressMaps={[addressMap]} />);
    expect(document.querySelectorAll("[data-legal-map-surface]")).toHaveLength(1);
    rerender(<LegalMapContent legal={{ parcels_num: 2, groups: [acreageFixture.groups![0]] }} addressMaps={[addressMap]} />);
    expect(screen.getByRole("alert", { name: "Parcel 2" })).toBeVisible();
    rerender(<LegalMapContent legal={{ ...acreageFixture, parcels_num: 2 }} addressMaps={[addressMap]} />);
    expect(document.querySelectorAll("[data-legal-map-surface]")).toHaveLength(2);
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it.each([undefined, 0, -1])("preserves the existing combined map when parcel count is %s", parcels_num => {
    render(<LegalMapContent legal={{ ...acreageFixture, parcels_num }} />);
    expect(document.querySelectorAll("[data-legal-map-surface]")).toHaveLength(1);
    expect(document.querySelectorAll("[data-legal-map-lot]")).toHaveLength(1);
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it.each(["groups", "legalGroups", "LegalGroups", "items"])("supports the existing %s source container", key => {
    render(<LegalMapContent legal={{ parcels_num: 2, [key]: acreageFixture.groups }} />);
    expect(document.querySelectorAll("[data-legal-map-surface]")).toHaveLength(2);
    expect(Array.from(document.querySelectorAll("[data-lot-acreage]"), node => node.textContent)).toEqual(acreageValues);
  });
});
