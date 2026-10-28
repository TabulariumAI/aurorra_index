import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LegalMapContent } from "../component/LegalMapContent";
import { displayLots, normalizeLegalData } from "../data/legalData";
import { getMapGroups } from "../data/surveyData";
import { parcelFixture } from "./parcelFixture";

describe("Parcel at Lot level", () => {
  it("normalizes the supplied case into the Tract's leaf tier without changing source data", () => {
    const source = JSON.stringify(parcelFixture);
    const view = normalizeLegalData(parcelFixture);
    expect(view.subdivisions[0]).toMatchObject({
      subdivision: "M. AND E. DENNERLE",
      divisions: [{ blocks: [{ tract: "ELY TRACT", lots: [{ kind: "parcel", name: "13" }] }] }],
    });
    expect(view.presentLayers).toEqual(new Set(["subdivision", "tract", "parcel"]));
    expect(getMapGroups(parcelFixture)[0].aspects.map(element => element.aspect)).toEqual(["part", "subdivision_procedural"]);
    expect(JSON.stringify(parcelFixture)).toBe(source);
  });

  it("renders Parcel 13 in the existing leaf tile with its own caption and legend, retaining Details", () => {
    render(<LegalMapContent legal={parcelFixture} />);
    const tile = document.querySelector("[data-legal-map-lot]")!;
    expect(tile).toHaveTextContent("13Parcel");
    expect(tile.parentElement).toHaveAttribute("data-legal-map-block", "true");
    expect(tile).toHaveAttribute("data-lot-slot", "1-1");
    expect(document.querySelector("[data-legal-map-tract-label]")).toHaveTextContent("ELY TRACT");
    expect(document.querySelector(".legal-map-legend")).toHaveTextContent("Parcel");
    expect(document.querySelector(".legal-map-legend")).not.toHaveTextContent("Lot");
    expect(document.querySelector("[data-legal-map-location]")).toHaveTextContent("Ohio | Cuyahoga County | Parma");
    const table = screen.getByRole("table", { name: "Details" });
    for (const element of parcelFixture.groups[0].elements) expect(table).toHaveTextContent(element.value);
    expect(within(table).getByRole("rowheader", { name: "Parcel" }).nextElementSibling).toHaveTextContent("13");
    expect(screen.queryByRole("heading", { name: "Parcel 1" })).toBeNull();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it.each(["groups", "legalGroups", "LegalGroups", "items"])("uses the existing %s source container", key => {
    render(<LegalMapContent legal={{ [key]: parcelFixture.groups, parcels_num: 1 }} />);
    expect(document.querySelector("[data-legal-map-lot]")).toHaveTextContent("13Parcel");
    expect(screen.getByRole("table", { name: "Details" })).toHaveTextContent("13");
  });

  it.each(["13", "Parcel No. 13", "A-13"])("draws a parcel-only partial hierarchy for %s", value => {
    const legal = { groups: [{ type: "lot_block", elements: [{ aspect: "parcel", value }] }] };
    render(<LegalMapContent legal={legal} />);
    expect(document.querySelector("[data-legal-map-lot]")).toHaveTextContent(`${value === "Parcel No. 13" ? "13" : value}Parcel`);
    expect(document.querySelectorAll("[data-legal-map-lot]")).toHaveLength(1);
    expect(normalizeLegalData(legal).presentLayers).toEqual(new Set(["parcel"]));
    expect(screen.getByRole("table", { name: "Details" })).toHaveTextContent(value);
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it.each(["", "   "])("does not invent a leaf for a blank Parcel %j", value => {
    const legal = { groups: [{ type: "lot_block", elements: [{ aspect: "parcel", value }] }] };
    render(<LegalMapContent legal={legal} />);
    expect(normalizeLegalData(legal).isEmptyStructure).toBe(true);
    expect(document.querySelector("[data-legal-map-lot], .legal-map-legend")).toBeNull();
  });

  it("keeps identical Lot, Condo Unit and Parcel identifiers distinct and acreage attached to Lot", () => {
    render(<LegalMapContent legal={{ groups: [{ type: "lot_block", elements: [
      { aspect: "lot", value: "7" }, { aspect: "condominium_unit", value: "7" },
      { aspect: "parcel", value: "7" }, { aspect: "acreage", value: "2 ACRES" },
    ] }] }} />);
    const tiles = [...document.querySelectorAll("[data-legal-map-lot]")];
    expect(tiles.map(node => node.textContent)).toEqual(["7Lot", "7Condo Unit", "7Parcel"]);
    for (const tile of tiles) expect(tile.parentElement).toBe(tiles[0].parentElement);
    expect(document.querySelectorAll("[data-lot-acreage]")).toHaveLength(1);
    expect(document.querySelector("[data-lot-acreage]")).toHaveAttribute("data-acreage-slot", "1-1");
    expect(document.querySelectorAll("[data-acreage-leader]")).toHaveLength(1);
  });

  it("preserves Parcel identifiers verbatim alongside existing numeric Lot gaps", () => {
    expect(displayLots([
      { kind: "lot", name: "1, 3" }, { kind: "parcel", name: "1, 3" },
      { kind: "condominium_unit", name: "2-3" },
    ])).toEqual([
      { kind: "lot", name: "1", filled: true }, { kind: "lot", name: "2", filled: false },
      { kind: "lot", name: "3", filled: true }, { kind: "parcel", name: "1, 3", filled: true },
      { kind: "condominium_unit", name: "2-3", filled: true },
    ]);
  });

  it("retains all leaf kinds and source identifiers when the existing twelve-tile limit requires summaries", () => {
    const parcels = Array.from({ length: 13 }, (_, index) => ({ kind: "parcel" as const, name: String(index + 1) }));
    const displayed = displayLots([{ kind: "lot", name: "24" }, { kind: "condominium_unit", name: "7" }, ...parcels]);
    expect(displayed).toEqual([
      { kind: "lot", name: "24", filled: true }, { kind: "condominium_unit", name: "7", filled: true },
      { kind: "parcel", name: "13 parcels", filled: true, detail: parcels.map(parcel => parcel.name).join(", ") },
    ]);
  });

  it.each([1, 2])("uses the existing grouping and Details when the declared parcel count is %s", parcels_num => {
    const legal = { parcels_num, groups: ["13", "14"].map(value => ({ type: "lot_block", elements: [
      { aspect: "parcel", value }, { aspect: "tract", value: "ELY TRACT" },
    ] })) };
    const source = JSON.stringify(legal);
    render(<LegalMapContent legal={legal} />);
    expect(document.querySelectorAll("[data-legal-map-surface]")).toHaveLength(parcels_num);
    expect([...document.querySelectorAll("[data-legal-map-lot]")].map(node => node.textContent)).toEqual(
      parcels_num === 1 ? ["13,14Parcel"] : ["13Parcel", "14Parcel"],
    );
    const tables = screen.getAllByRole("table");
    expect(tables).toHaveLength(2);
    expect(tables[0]).toHaveTextContent("13");
    expect(tables[1]).toHaveTextContent("14");
    expect(screen.queryByRole("alert")).toBeNull();
    expect(JSON.stringify(legal)).toBe(source);
  });

  it("keeps a missing declared parcel as an error rather than using its heading number as an identifier", () => {
    render(<LegalMapContent legal={{ ...parcelFixture, parcels_num: 2 }} />);
    expect(document.querySelectorAll("[data-legal-map-lot]")).toHaveLength(1);
    expect(document.querySelector("[data-legal-map-lot]")).toHaveTextContent("13Parcel");
    expect(screen.getByRole("alert", { name: "Parcel 2" })).toHaveTextContent("Lot Block legal group is missing");
  });

  it("leaves parcel_scope in Details and excludes parcels from non-Lot Block hierarchies", () => {
    const legal = { groups: [
      { type: "lot_block", elements: [{ aspect: "lot", value: "7" }, { aspect: "parcel_scope", value: "EASTERLY 75 FEET" }] },
      { type: "metes_bounds", elements: [{ aspect: "parcel", value: "99" }] },
    ] };
    expect(normalizeLegalData(legal).presentLayers).toEqual(new Set(["lot"]));
    expect(getMapGroups(legal)[0].aspects).toEqual([legal.groups[0].elements[1]]);
    render(<LegalMapContent legal={legal} />);
    expect(document.querySelector("[data-legal-map-lot]")).toHaveTextContent("7Lot");
    expect(document.querySelector(".legal-map-legend")).not.toHaveTextContent("Parcel");
    expect(screen.getByRole("table", { name: "Details" })).toHaveTextContent("EASTERLY 75 FEET");
  });

  it("updates Parcel tiles, legends and Details together after navigation and metadata replacement", () => {
    const addressMap = { address: "test", content: <iframe title="Address map" /> };
    const { rerender } = render(<LegalMapContent legal={parcelFixture} addressMaps={[addressMap]} />);
    fireEvent.click(screen.getByRole("tab", { name: "Address" }));
    expect(screen.getByTitle("Address map")).toBeVisible();
    fireEvent.keyDown(screen.getByRole("tab", { name: "Address" }), { key: "Home" });
    expect(document.querySelector("[data-legal-map-lot]")).toHaveTextContent("13Parcel");
    rerender(<LegalMapContent legal={{ groups: [{ type: "lot_block", elements: [{ aspect: "lot", value: "24" }] }] }} addressMaps={[addressMap]} />);
    expect(document.querySelector("[data-legal-map-lot]")).toHaveTextContent("24Lot");
    expect(document.querySelector(".legal-map-legend")).not.toHaveTextContent("Parcel");
    expect(screen.getByRole("table", { name: "Details" })).not.toHaveTextContent("13");
    rerender(<LegalMapContent legal={parcelFixture} addressMaps={[addressMap]} />);
    expect(document.querySelector("[data-legal-map-lot]")).toHaveTextContent("13Parcel");
    expect(document.querySelector(".legal-map-legend")).toHaveTextContent("Parcel");
  });
});
