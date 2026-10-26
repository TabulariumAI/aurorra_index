import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LegalMapContent } from "../component/LegalMapContent";
import { metesFixture } from "./metesFixture";

describe("map headings and legend", () => {
  it.each(["lot_block", "plss"])("hides the single-parcel heading for %s", type => {
    render(<LegalMapContent legal={{ parcels_num: 1, groups: [{ type, elements: [
      { aspect: type === "plss" ? "aliquots" : "lot", value: type === "plss" ? "NE1/4 of Section 12" : "21" },
    ] }] }} />);
    expect(document.querySelectorAll("[data-legal-map-surface]")).toHaveLength(1);
    expect(screen.queryByRole("heading", { name: /^Parcel/ })).toBeNull();
  });

  it("uses one footer row for north and the compact legend across schematic views", () => {
    render(<LegalMapContent legal={metesFixture} />);
    for (const view of ["Metes & Bounds", "PLSS"]) {
      fireEvent.click(screen.getByRole("tab", { name: view }));
      for (const surface of document.querySelectorAll("[data-legal-map-surface]")) {
        const footer = surface.querySelector("[data-legal-map-footer]");
        expect(footer).toHaveStyle({ display: "flex", alignItems: "center" });
        expect(footer).toContainElement(surface.querySelector("[data-legal-map-north]"));
        expect(footer).toContainElement(surface.querySelector(".legal-map-legend"));
        expect(surface.querySelector(".legal-map-legend")).toHaveStyle({ flexWrap: "wrap", overflow: "hidden", maxHeight: "2.85rem" });
      }
    }
  });

  it("caps the plat legend at two rows while keeping legend items together", () => {
    render(<LegalMapContent legal={{ parcels_num: 1, groups: [{ type: "lot_block", elements: [
      { aspect: "lot", value: "21" }, { aspect: "block", value: "53" },
      { aspect: "subdivision", value: "LACKLAND CITY SUBDIVISION" }, { aspect: "unit", value: "168-A" },
    ] }] }} />);
    const legend = document.querySelector(".legal-map-legend")!;
    expect(legend).toHaveStyle({ flexDirection: "row", flexWrap: "wrap", maxHeight: "2.85rem", overflow: "hidden" });
    for (const item of legend.children) expect(item).toHaveStyle({ whiteSpace: "nowrap", flexShrink: "0" });
    expect(legend.closest("[data-legal-map-footer]")).toContainElement(document.querySelector("[data-legal-map-north]"));
  });
});
