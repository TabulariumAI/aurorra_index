import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LegalMapContent } from "../component/LegalMapContent";
import { acreageFixture, acreageValues } from "./acreageFixture";

describe("consistent map layout", () => {

  it("keeps a single map tab and untabbed data without a single-parcel heading", () => {
    render(<LegalMapContent legal={{ parcels_num: 1, summary: "One parcel.", groups: [acreageFixture.groups![0]] }} />);
    expect(screen.getByRole("tab", { name: "Lot & block" })).toBeVisible();
    expect(screen.queryByRole("heading", { name: "Parcel 1" })).toBeNull();
    expect(screen.queryByRole("tablist", { name: "Map details" })).toBeNull();
    expect(screen.getByRole("region", { name: "Details" })).toContainElement(screen.getByRole("table", { name: "Details" }));
    expect(screen.getByRole("separator")).toBeVisible();
  });

  it("renders supplied address maps without external headings or details below", () => {
    const addresses = ["123 Main St", "456 Oak St"];
    render(<LegalMapContent legal={null} addressMaps={addresses.map(address => ({ address, content: <iframe title={address} /> }))} />);
    expect(document.querySelectorAll("[data-legal-map-surface]")).toHaveLength(2);
    expect(screen.queryByRole("table")).toBeNull();
    expect(screen.queryByRole("separator")).toBeNull();
    expect(document.querySelector(".legal-map-info")).toBeNull();
    for (const address of addresses) {
      expect(screen.queryByRole("heading", { name: address })).toBeNull();
    }
    expect(screen.queryByRole("tablist", { name: "Map details" })).toBeNull();
  });

  it("keeps procedural and unpositioned values in data while preserving acreage pointers", () => {
    const procedural = "OF PART OF ORIGINAL 100 ACRE LOT NO. 370";
    render(<LegalMapContent legal={{ parcels_num: 1, groups: [{ ...acreageFixture.groups![0], elements: [
      ...acreageFixture.groups![0].elements!, { aspect: "subdivision_procedural", value: procedural },
      { aspect: "part", value: "EASTERLY 40 FEET" },
    ] }] }} />);
    expect(document.querySelectorAll("[data-legal-map-aspect]")).toHaveLength(0);
    expect(screen.getByRole("table", { name: "Details" })).toHaveTextContent(procedural);
    expect(screen.getByRole("table", { name: "Details" })).toHaveTextContent("EASTERLY 40 FEET");
    expect(document.querySelector("[data-lot-acreage]")).toHaveTextContent(acreageValues[0]);
    expect(document.querySelector("[data-lot-acreage]")!.closest("[data-legal-map-lot]")).toBeNull();
    expect(document.querySelectorAll("[data-acreage-leader]")).toHaveLength(1);
  });

  it("shows data without an empty map or splitter when no geometry can be represented", () => {
    render(<LegalMapContent legal={{ groups: [{ type: "lot_block", elements: [{ aspect: "subdivision_procedural", value: "OF PART OF ORIGINAL 100 ACRE LOT NO. 370" }] }] }} />);
    expect(screen.getByRole("tab", { name: "Lot & block" })).toBeVisible();
    expect(document.querySelectorAll("[data-map-scroll]")).toHaveLength(0);
    expect(screen.queryByRole("separator")).toBeNull();
    expect(screen.getByRole("tabpanel", { name: "Lot & block" })).toContainElement(screen.getByRole("table", { name: "Details" }));
    expect(screen.getByRole("region", { name: "Details" })).toHaveStyle({ flex: "1 1 0", height: "auto" });
  });
});
