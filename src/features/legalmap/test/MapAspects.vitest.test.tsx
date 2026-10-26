import { fireEvent, render, screen, within } from "@testing-library/react";
import { formatLabel, type LegalPayload } from "aurora-core";
import { describe, expect, it } from "vitest";
import { LegalMapContent } from "../component/LegalMapContent";
import { getMapGroups } from "../data/surveyData";
import { aspectFields, aspectFixture } from "./aspectFixture";

describe("unpositioned map data", () => {
  it.each(aspectFields)("retains %s as data without inventing geometry", aspect => {
    const value = " Tract A / B; PART OF LOT 7\n(see source) ";
    const legal = { groups: [{ type: "lot_block", elements: [{ aspect, value }] }] };
    const source = JSON.stringify(legal);
    render(<LegalMapContent legal={legal} />);
    const table = screen.getByRole("table", { name: "Details" });
    expect(within(table).getByRole("rowheader")).toHaveTextContent(formatLabel(aspect));
    expect(within(table).getByRole("cell").textContent).toBe(value);
    expect(document.querySelectorAll("[data-legal-map-aspect], [data-legal-map-lot], [data-legal-map-surface]")).toHaveLength(0);
    expect(JSON.stringify(legal)).toBe(source);
  });

  it.each([undefined, 1, 2])("preserves source group data and order for parcel count %s", parcels_num => {
    render(<LegalMapContent legal={{ parcels_num, groups: ["Tract A", "Tract B"].map(value => ({ type: "lot_block", elements: [
      { aspect: "lot", value: "7" }, { aspect: "part", value },
    ] })) }} />);
    const tables = screen.getAllByRole("table");
    expect(tables).toHaveLength(2);
    expect(tables[0]).toHaveTextContent("Tract A");
    expect(tables[0]).not.toHaveTextContent("Tract B");
    expect(tables[1]).toHaveTextContent("Tract B");
    expect(tables[1]).not.toHaveTextContent("Tract A");
    expect(document.querySelector("[data-legal-map-lot]")).toHaveTextContent("7Lot");
  });

  it("keeps repeated aspects in source order", () => {
    render(<LegalMapContent legal={{ groups: [{ type: "lot_block", elements: [
      { aspect: "part", value: "Tract B" }, { aspect: "fraction", value: "UNDIVIDED 1/2" },
      { aspect: "part", value: "Tract A" }, { aspect: "part", value: " " },
    ] }] }} />);
    expect(screen.getAllByRole("cell").map(cell => cell.textContent)).toEqual(["Tract B", "UNDIVIDED 1/2", "Tract A"]);
  });

  it("retains the existing hierarchy and right-of-way drawing", () => {
    render(<LegalMapContent legal={{ groups: [{ type: "lot_block", elements: [
      { aspect: "subdivision", value: "RIVER GLEN" }, { aspect: "unit", value: "1" },
      { aspect: "phase", value: "2" }, { aspect: "section", value: "3" },
      { aspect: "block", value: "4" }, { aspect: "lot", value: "7" },
      { aspect: "right_of_way", value: "DRAINAGE RIGHT OF WAY" }, { aspect: "part", value: "Tract A" },
    ] }] }} />);
    expect(document.querySelectorAll("[data-legal-map-subdivision], [data-legal-map-block], [data-legal-map-lot]")).toHaveLength(3);
    expect(document.querySelector("[data-legal-map-row]")).toHaveTextContent("DRAINAGE RIGHT OF WAY");
    expect(screen.getByRole("table", { name: "Details" })).toHaveTextContent("Tract A");
  });

  it.each(["groups", "legalGroups", "LegalGroups", "items"])("reads original fields from %s", key => {
    render(<LegalMapContent legal={{ [key]: aspectFixture.groups }} />);
    expect(screen.getByRole("table", { name: "Details" })).toHaveTextContent("SUBLOTS NOS. 513 AND 514");
  });

  it("updates data and source issues after view switching and metadata replacement", () => {
    const { rerender } = render(<LegalMapContent legal={aspectFixture} addressMaps={[{ address: "test", content: <iframe title="Address map" /> }]} />);
    fireEvent.click(screen.getByRole("tab", { name: "Address" }));
    expect(screen.queryByRole("table")).toBeNull();
    expect(screen.queryByRole("heading", { name: "test" })).toBeNull();
    fireEvent.keyDown(screen.getByRole("tab", { name: "Address" }), { key: "Home" });
    expect(screen.getByRole("table", { name: "Details" })).toHaveTextContent("SUBLOTS NOS. 513 AND 514");
    rerender(<LegalMapContent legal={{ groups: [{ type: "lot_block", elements: [{ aspect: "county", value: "CUYAHOGA" }] }] }} />);
    expect(screen.getByRole("alert", { name: "Parcel 1" })).toHaveTextContent("only location fields");
    expect(screen.getByRole("table", { name: "Details" })).toHaveTextContent("CUYAHOGA");
  });

  it("preserves unlabeled values and their explicit source issue", () => {
    render(<LegalMapContent legal={{ groups: [{ type: "lot_block", elements: [{ value: "UNLABELED SOURCE" }] }] }} />);
    expect(screen.getByRole("alert", { name: "Parcel 1" })).toHaveTextContent("without aspect labels");
    expect(screen.getByRole("table", { name: "Details" })).toHaveTextContent("UNLABELED SOURCE");
  });

  it.each([null, { groups: [] }, { groups: [{ type: "plat_reference", elements: [{ aspect: "plat_book", value: "7" }] }] }])("keeps reference-only input out of the map", legal => {
    render(<LegalMapContent legal={legal} />);
    expect(screen.queryByRole("tab")).toBeNull();
    expect(screen.queryByRole("alert")).toBeNull();
  });
});

describe("aspect selection", () => {
  it("selects only nonblank omitted fields, preserving source elements and labels", () => {
    const legal: LegalPayload = { groups: [{ type: "lot_block", elements: [
      { aspect: "lot", value: "7" }, { aspect: "county", value: "CUYAHOGA" },
      { aspect: "part", value: "  Tract A  ", explanation: "Source explanation" },
      { aspect: "parcel", value: " " },
    ] }] };
    const group = getMapGroups(legal)[0];
    expect(group.aspects).toEqual([legal.groups![0].elements![2]]);
    expect(group.aspects[0]).toBe(legal.groups![0].elements![2]);
    expect(group.issue).toBeUndefined();
  });
});
