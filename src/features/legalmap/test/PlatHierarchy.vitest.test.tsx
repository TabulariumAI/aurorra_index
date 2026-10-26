import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LegalMapContent } from "../component/LegalMapContent";
import { displayLots, normalizeLegalData } from "../data/legalData";
import { getMapGroups } from "../data/surveyData";
import { hierarchyFields, hierarchyFixture } from "./hierarchyFixture";

describe("five-level plat hierarchy", () => {
  it("preserves all source fields in their approved tiers without mutating the payload", () => {
    const source = JSON.stringify(hierarchyFixture);
    const view = normalizeLegalData(hierarchyFixture);
    expect(view.locationLabel).toBe("Illinois | Lake County | Libertyville Township | Grayslake");
    expect(view.subdivisions[0]).toMatchObject({
      condominium: "GLEN CONDOMINIUM", jurisdiction: "LIBERTYVILLE TOWNSHIP", city: "GRAYSLAKE",
      divisions: [{ phase: "1", unit: "2", section: "A", blocks: [{ name: "4", tract: "B", building: "C", lots: [
        { kind: "lot", name: "24" }, { name: "2-3", kind: "condominium_unit" },
      ] }] }],
    });
    expect(view.presentLayers).toEqual(new Set(["subdivision", "condominium", "phase", "unit", "section", "block", "tract", "building", "lot", "condominium_unit"]));
    expect(getMapGroups(hierarchyFixture)[0].aspects).toEqual([]);
    expect(JSON.stringify(hierarchyFixture)).toBe(source);
  });

  it.each(["city", "jurisdiction", "condominium", "building"])("keeps differing %s ancestors separate", aspect => {
    const groups = [hierarchyFields, { ...hierarchyFields, [aspect]: "OTHER" }].map(fields => ({
      type: "lot_block", elements: Object.entries(fields).map(([aspect, value]) => ({ aspect, value })),
    }));
    const view = normalizeLegalData({ groups });
    expect(aspect === "building" ? view.subdivisions[0].divisions[0].blocks : view.subdivisions).toHaveLength(2);
  });

  it("renders top, left, center, leaf and bottom labels using the existing hierarchy surfaces", () => {
    render(<LegalMapContent legal={hierarchyFixture} />);
    const surface = document.querySelector("[data-legal-map-surface]")!;
    const top = surface.querySelector("[data-legal-map-subdivision]")!.parentElement!;
    expect(top.querySelector('[data-legal-map-heading="subdivision"]')).toHaveTextContent("WOODED GLEN GARDENS");
    expect(top.querySelector('[data-legal-map-heading="condominium"]')).toHaveTextContent("GLEN CONDOMINIUM");
    const left = surface.querySelector("[data-legal-map-division]")!.firstElementChild!;
    expect([...left.children].map(node => node.textContent)).toEqual(["Phase 1", "Unit 2", "Section A"]);
    const center = surface.querySelector("[data-legal-map-block]")!.firstElementChild!;
    expect(center).toHaveTextContent("4BlockBTractCBuilding");
    expect(center).toHaveStyle({ gridColumn: "2 / 4", gridRow: "2 / 4" });
    expect([...surface.querySelectorAll("[data-legal-map-lot]")].map(node => node.textContent)).toEqual(["24Lot", "2-3Condo Unit"]);
    expect(surface.querySelector(".legal-map-legend")).toHaveTextContent("Condominium");
    expect(surface.querySelector(".legal-map-legend")).toHaveTextContent("Building");
    expect(surface.querySelector(".legal-map-legend")).toHaveTextContent("Condo Unit");
    expect(document.querySelector("[data-legal-map-location]")).toHaveTextContent("Illinois | Lake County | Libertyville Township | Grayslake");
    expect(screen.getByRole("table", { name: "Details" })).toHaveTextContent("Jurisdiction");
  });

  it.each(["condominium", "building", "condominium_unit"])("draws a partial hierarchy containing only %s", aspect => {
    const legal = { groups: [{ type: "lot_block", elements: [{ aspect, value: "7" }] }] };
    render(<LegalMapContent legal={legal} />);
    expect(document.querySelector("[data-legal-map-surface]")).not.toBeNull();
    expect(screen.queryByRole("alert")).toBeNull();
    expect(normalizeLegalData(legal).presentLayers).toEqual(new Set([aspect]));
    if (aspect === "building") expect(document.querySelector("[data-legal-map-building-label]")).toHaveTextContent("7");
    if (aspect === "condominium_unit") {
      expect(document.querySelector("[data-legal-map-lot]")).toHaveTextContent("7Condo Unit");
      expect(document.querySelector("[data-legal-map-block]")!.children).toHaveLength(16);
    }
  });

  it("keeps jurisdiction-only groups as location data rather than inventing a drawable layer", () => {
    const group = getMapGroups({ groups: [{ type: "lot_block", elements: [{ aspect: "jurisdiction", value: "LIBERTYVILLE TOWNSHIP" }] }] })[0];
    expect(group.aspects).toEqual([]);
    expect(group.issue).toContain("only location fields");
  });

  it("keeps matching Lot and Condo Unit identifiers distinct and preserves condo ranges verbatim", () => {
    render(<LegalMapContent legal={{ groups: [{ type: "lot_block", elements: [
      { aspect: "lot", value: "7" }, { aspect: "condominium_unit", value: "7" },
      { aspect: "acreage", value: "2 ACRES" },
    ] }] }} />);
    expect([...document.querySelectorAll("[data-legal-map-lot]")].map(node => node.textContent)).toEqual(["7Lot", "7Condo Unit"]);
    expect(document.querySelectorAll("[data-lot-acreage]")).toHaveLength(1);
    expect(document.querySelector("[data-lot-acreage]")).toHaveAttribute("data-acreage-slot", "1-1");
    expect(displayLots([{ name: "2-3", kind: "condominium_unit" }])).toEqual([{ name: "2-3", kind: "condominium_unit", filled: true }]);
  });

  it("retains both leaf types when more than twelve identifiers require summaries", () => {
    const units = Array.from({ length: 13 }, (_, index) => ({ name: String(index + 1), kind: "condominium_unit" as const }));
    const displayed = displayLots([{ kind: "lot", name: "24" }, ...units]);
    expect(displayed.length).toBeLessThanOrEqual(12);
    expect(displayed.some(lot => lot.kind === "lot" && lot.name.includes("24"))).toBe(true);
    expect(displayed.filter(lot => lot.kind === "condominium_unit").map(lot => lot.detail).join(" ")).toContain("13");
  });

  it("refreshes the new hierarchy and removes its labels and legend entries when fields disappear", () => {
    const address = { address: "test", content: <iframe title="Address map" /> };
    const { rerender } = render(<LegalMapContent legal={hierarchyFixture} addressMaps={[address]} />);
    fireEvent.click(screen.getByRole("tab", { name: "Address" }));
    fireEvent.click(screen.getByRole("tab", { name: "Lot & block" }));
    expect(document.querySelector("[data-legal-map-building-label]")).toHaveTextContent("C");
    rerender(<LegalMapContent legal={{ groups: [{ type: "lot_block", elements: [{ aspect: "lot", value: "24" }] }] }} addressMaps={[address]} />);
    expect(document.querySelector("[data-legal-map-building-label], [data-legal-map-heading], [data-legal-map-location]")).toBeNull();
    expect(document.querySelector(".legal-map-legend")).not.toHaveTextContent(/Building|Condominium|Condo Unit/);
    expect(document.querySelector("[data-legal-map-block]")!.children).toHaveLength(16);
  });
});
