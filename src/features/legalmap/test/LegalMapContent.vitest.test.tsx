import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LegalMapContent } from "../component/LegalMapContent";

describe("parcel count rendering", () => {
  const groups = ["1", "4482C"].map(block => ({ type: "lot_block", elements: [
    { aspect: "subdivision", value: "THE RANCH AT IRON HORSE" },
    { aspect: "phase", value: "II" }, { aspect: "block", value: block }, { aspect: "lot", value: "32" },
  ] }));

  it("renders one lot and both block identifiers for the approved one-parcel example", () => {
    const legal = { groups, parcels_num: 1, summary: "One parcel: Lot 32, Block 1, County Block 4482C." };
    render(<LegalMapContent legal={legal} onReadyChange={vi.fn()} />);
    expect(document.querySelectorAll("[data-legal-map-block]")).toHaveLength(1);
    expect(document.querySelectorAll("[data-legal-map-lot]")).toHaveLength(1);
    expect(screen.getByText("1/4482C")).toBeInTheDocument();
    expect(screen.getByText("32").parentElement).toHaveTextContent("32Lot");
    expect(screen.getByText("Phase II")).toBeInTheDocument();
    expect(screen.getByText(legal.summary)).toBeInTheDocument();
  });

  it("uses the existing label formatting for each combined identifier", () => {
    const legal = { parcels_num: 1, groups: ["Block 1", "Block 4482C"].map(block => ({ type: "lot_block", elements: [
      { aspect: "block", value: block }, { aspect: "lot", value: "Lot 32" },
    ] })) };
    render(<LegalMapContent legal={legal} onReadyChange={vi.fn()} />);
    expect(screen.getByText("1/4482C")).toBeInTheDocument();
    expect(screen.getByText("32").parentElement).toHaveTextContent("32Lot");
  });

  it("renders separate right-of-way corridors within a merged parcel", () => {
    const labels = ["2.669 ACRE DRAINAGE RIGHT OF WAY", "5.455 ACRE DRAINAGE RIGHT OF WAY"];
    const legal = { parcels_num: 1, groups: groups.map((group, index) => ({ ...group, elements: [
      ...group.elements, { aspect: "right_of_way", value: labels[index] },
    ] })) };
    render(<LegalMapContent legal={legal} onReadyChange={vi.fn()} />);
    expect(Array.from(document.querySelectorAll("[data-legal-map-row]"), node => node.textContent)).toEqual(labels);
    expect(document.querySelectorAll("[data-legal-map-block]")).toHaveLength(1);
    expect(document.querySelectorAll("[data-legal-map-lot]")).toHaveLength(1);
    expect(screen.getByText("1/4482C")).toBeInTheDocument();
    expect(screen.getByText("Right Of Way", { exact: true })).toBeInTheDocument();
  });

  it.each([undefined, 0, -1, 2, 3])("retains both blocks for parcels_num %s", parcels_num => {
    const legal = { groups, parcels_num };
    render(<LegalMapContent legal={legal} onReadyChange={vi.fn()} />);
    expect(document.querySelectorAll("[data-legal-map-block]")).toHaveLength(2);
    expect(document.querySelectorAll("[data-legal-map-lot]")).toHaveLength(2);
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("4482C")).toBeInTheDocument();
  });

  it("rebuilds the map when only the parcel count changes without mutating the source", () => {
    const onReadyChange = vi.fn();
    const before = structuredClone(groups);
    const legal = { groups, parcels_num: 1 };
    const { rerender } = render(<LegalMapContent legal={legal} onReadyChange={onReadyChange} />);
    expect(document.querySelectorAll("[data-legal-map-block]")).toHaveLength(1);
    rerender(<LegalMapContent legal={{ ...legal, parcels_num: 2 }} onReadyChange={onReadyChange} />);
    expect(document.querySelectorAll("[data-legal-map-block]")).toHaveLength(2);
    expect(screen.queryByText("1/4482C")).not.toBeInTheDocument();
    expect(onReadyChange).toHaveBeenCalledTimes(2);
    expect(groups).toEqual(before);
  });
});

describe("LegalMapContent", () => {
  it("renders the pure legal map hierarchy without shell dialog controls", () => {
    const onReadyChange = vi.fn();
    render(
      <LegalMapContent
        legal={{
          groups: [
            {
              elements: [
                { aspect: "subdivision", value: "WILLOW CREEK" },
                { aspect: "phase", value: "Phase 1" },
                { aspect: "block", value: "Block 12" },
                { aspect: "lot", value: "Lot 7" },
                { aspect: "condominium_unit", value: "2-3" },
              ],
              type: "lot_block",
            },
          ],
          plat: { city: "austin", county: "travis", state: "TX" },
        }}
        onReadyChange={onReadyChange}
      />,
    );

    expect(screen.getByText("WILLOW CREEK")).toBeInTheDocument();
    expect(screen.getByText("Phase 1")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("7").parentElement).toHaveTextContent("Lot");
    expect(screen.getByText("Subdivision")).toBeInTheDocument();
    expect(screen.queryByText("Condominium Unit")).not.toBeInTheDocument();
    expect(screen.getByText("Austin | Travis County | Texas")).toBeInTheDocument();
    const location = screen.getByText("Austin | Travis County | Texas");
    expect(location.compareDocumentPosition(screen.getByText("Subdivision")) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(location.style.fontSize).toBe(screen.getByText("WILLOW CREEK").style.fontSize);
    const grid = document.querySelector("[data-legal-map-grid='true']");
    expect(grid).toHaveStyle({ borderRadius: "var(--radius-card)" });
    expect((grid as HTMLElement).style.backgroundImage).toMatch(/svg\+xml|legal-map-backdrop/);
    const north = grid?.querySelector("[data-legal-map-north='true']");
    expect(north).toHaveTextContent("N");
    expect(north).toHaveAttribute("aria-hidden", "true");
    expect(north).toHaveStyle({ borderRadius: "var(--radius-control)", boxShadow: "var(--shadow-card)" });
    expect(grid?.querySelector("[data-legal-map-subdivision='true']")).toHaveStyle({ borderRadius: "var(--radius-card)", borderStyle: "dashed" });
    const block = screen.getByText("12").parentElement;
    expect(block).toHaveStyle({ backgroundColor: "#e8f0f4", gridColumn: "2 / 4", gridRow: "2 / 4" });
    expect(screen.getByText("7").parentElement).toHaveStyle({ backgroundColor: "#fbe9e3" });
    expect(screen.getByText("7").parentElement).toHaveStyle({ fontSize: "18.4px" });
    expect(screen.getByText("7").parentElement?.style.fontSize).toBe(screen.getByText("12").style.fontSize);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Close" })).not.toBeInTheDocument();
    expect(onReadyChange).toHaveBeenCalledWith(true);
  });

  it("renders the donor empty-state text for empty legal data", () => {
    render(<LegalMapContent legal={null} onReadyChange={vi.fn()} />);

    expect(screen.getByText("No valid property hierarchy data found.")).toBeInTheDocument();
  });

  it("shows the document summary without repeating its plat references", () => {
    render(<LegalMapContent legal={{
      groups: [
        { type: "lot_block", elements: [{ aspect: "subdivision", value: "COUNTRY CLUB MANOR NO. 3" }, { aspect: "block", value: "Block 110" }, { aspect: "lot", value: "Lot 7" }] },
        { type: "plat_reference", elements: [{ aspect: "plat", value: "COUNTRY CLUB MANOR NO. 3, REPLAT NO. 2" }, { aspect: "plat_book", value: "12" }, { aspect: "plat_page", value: "167" }] },
      ],
      summary: "1 parcel: Lot 7, Block 110; plat recorded in Book 12, Page 167.",
    }} onReadyChange={vi.fn()} />);

    const info = document.querySelector("[data-legal-map-info='true']");
    expect(info).toHaveTextContent("Description");
    expect(info).toHaveTextContent("1 parcel: Lot 7, Block 110; plat recorded in Book 12, Page 167.");
    expect(screen.getByText("1 parcel: Lot 7, Block 110; plat recorded in Book 12, Page 167.")).toHaveStyle({ borderRadius: "var(--radius-card)" });
    expect(info).toHaveTextContent("Subdivision");
    expect(info).toHaveTextContent("Block");
    expect(info).toHaveTextContent("Lot");
    expect(document.querySelector("[data-legal-map-grid='true']")?.parentElement).not.toHaveTextContent("Subdivision");
    expect(info).not.toHaveTextContent("Plat References");
    expect(info).not.toHaveTextContent("COUNTRY CLUB MANOR NO. 3, REPLAT NO. 2");
    expect(screen.getByText("7")).toBeInTheDocument();
    expect(screen.getByText("7").parentElement).toHaveStyle({ backgroundColor: "#fbe9e3", gridColumn: "1", gridRow: "1" });
    expect(screen.getByText("7").parentElement).toHaveTextContent("Lot");
    expect(screen.getByText("110").parentElement).toHaveStyle({ gridColumn: "2 / 4", gridRow: "2 / 4" });
    expect(screen.queryByText("8")).not.toBeInTheDocument();
  });

  it("keeps the legend on the right without a summary", () => {
    render(<LegalMapContent legal={{ groups: [
      { type: "lot_block", elements: [{ aspect: "lot", value: "Lot 7" }] },
      { type: "plat_reference", elements: [{ aspect: "plat_book", value: "12" }] },
    ] }} onReadyChange={vi.fn()} />);
    expect(screen.queryByText("Plat References")).not.toBeInTheDocument();
    const info = document.querySelector("[data-legal-map-info='true']");
    expect(info).toHaveTextContent("Lot");
    expect(info).not.toHaveTextContent("Description");
  });

  it("keeps more than 99 source lots in a block within twelve labeled cubes", () => {
    render(
      <LegalMapContent
        legal={{
          groups: [
            ...Array.from({ length: 101 }, (_, index) => ({
              elements: [
                { aspect: "subdivision", value: "CEDAR HEIGHTS" },
                { aspect: "block", value: "Block 4" },
                { aspect: "lot", value: `Lot ${index + 1}` },
              ],
              type: "lot_block",
            })),
            { elements: [{ aspect: "subdivision", value: "MAPLE RIDGE" }, { aspect: "block", value: "Block 5" }, { aspect: "lot", value: "Lot 102" }], type: "lot_block" },
            { elements: [{ aspect: "lot", value: "Lot 103" }], type: "metes_bounds" },
          ],
        }}
        onReadyChange={vi.fn()}
      />,
    );

    const largeBlock = document.querySelector("[data-legal-map-block]")!;
    expect(largeBlock.querySelectorAll("[data-legal-map-lot]")).toHaveLength(12);
    expect(largeBlock).toHaveTextContent("1–");
    expect(largeBlock).toHaveTextContent("–101");
    expect(screen.getByText("102")).toBeInTheDocument();
    expect(screen.queryByText("103")).not.toBeInTheDocument();
    expect(screen.getAllByText("CEDAR HEIGHTS")).toHaveLength(1);
    expect(screen.getAllByText("MAPLE RIDGE")).toHaveLength(1);
  });

  it("keeps lot identities visible when excluded condominium data is present", () => {
    render(
      <LegalMapContent
        legal={{ groups: [
          { elements: [{ aspect: "block", value: "Block 4" }, { aspect: "lot", value: "Lot 21" }, { aspect: "condominium_unit", value: "2-3" }], type: "lot_block" },
          { elements: [{ aspect: "block", value: "Block 4" }, { aspect: "lot", value: "Lot 22" }], type: "lot_block" },
        ] }}
        onReadyChange={vi.fn()}
      />,
    );

    expect(screen.getByText("21")).toBeInTheDocument();
    expect(screen.queryByText("2,3")).not.toBeInTheDocument();
    expect(screen.getByText("22")).toBeInTheDocument();
  });

  it("renders consecutive lots without skipping or replacing any lot", () => {
    render(
      <LegalMapContent
        legal={{ groups: [
          ...["Lot 31", "Lot 32"].map((value) => ({ elements: [{ aspect: "block", value: "Block 4" }, { aspect: "lot", value }], type: "lot_block" })),
          { elements: [{ aspect: "block", value: "Block 4" }, { aspect: "lot", value: "Lot 33" }, { aspect: "condominium_unit", value: "3-4" }], type: "lot_block" },
          { elements: [{ aspect: "block", value: "Block 4" }, { aspect: "lot", value: "Lot 34" }], type: "lot_block" },
        ] }}
        onReadyChange={vi.fn()}
      />,
    );

    expect(screen.getByText("31")).toBeInTheDocument();
    expect(screen.getByText("32")).toBeInTheDocument();
    expect(screen.getByText("33")).toBeInTheDocument();
    expect(screen.getByText("34")).toBeInTheDocument();
  });

  it("draws named lots and missing positions in separate cubes", () => {
    render(<LegalMapContent legal={{ groups: [{ type: "lot_block", elements: [
      { aspect: "block", value: "31" }, { aspect: "lot", value: "2, 3, & 4" },
    ] }] }} onReadyChange={vi.fn()} />);
    const block = document.querySelector("[data-legal-map-block]")!;
    expect(Array.from(block.querySelectorAll("[data-legal-map-lot]"), node => node.textContent)).toEqual(["2Lot", "3Lot", "4Lot"]);
  });

  it("leaves gaps blank without exceeding twelve cubes", () => {
    render(<LegalMapContent legal={{ groups: [{ type: "lot_block", elements: [
      { aspect: "block", value: "30" }, { aspect: "lot", value: "1, 3, 5" },
    ] }] }} onReadyChange={vi.fn()} />);
    const block = document.querySelector("[data-legal-map-block]")!;
    expect(Array.from(block.querySelectorAll("[data-legal-map-empty]"), node => node.textContent)).toEqual(["", ""]);
    expect(block.querySelectorAll("[data-legal-map-lot]")).toHaveLength(3);
  });

  it("renders numeric blocks in order within the same subdivision and unit", () => {
    render(<LegalMapContent legal={{ groups: ["31", "30", "32", "34"].map(block => ({
      type: "lot_block", elements: [
        { aspect: "subdivision", value: "LUENSMANN" }, { aspect: "unit", value: "1B1" },
        { aspect: "block", value: `Block ${block}` }, { aspect: "lot", value: "1" },
      ],
    })) }} onReadyChange={vi.fn()} />);
    const labels = document.querySelectorAll("[data-legal-map-block-label]");
    expect(Array.from(labels, label => label.textContent)).toEqual(["30", "31", "32", "34"]);
  });

  it("renders one named unit containing both Seale blocks and their own labeled lots", () => {
    render(<LegalMapContent legal={{ groups: ["4", "4335A"].map(block => ({
      type: "lot_block", elements: [
        { aspect: "state", value: "TEXAS" }, { aspect: "county", value: "BEXAR COUNTY" },
        { aspect: "subdivision", value: "SEALE SUBDIVISION" }, { aspect: "unit", value: "1" },
        { aspect: "block", value: block }, { aspect: "lot", value: "4" },
      ],
    })) }} onReadyChange={vi.fn()} />);

    expect(screen.getAllByText("SEALE SUBDIVISION")).toHaveLength(1);
    expect(screen.getAllByText("Unit 1")).toHaveLength(1);
    const unit = screen.getByText("Unit 1").closest("[data-legal-map-division]")!;
    const blocks = unit.querySelectorAll("[data-legal-map-block]");
    expect(blocks).toHaveLength(2);
    expect(blocks[0].querySelector("[data-legal-map-block-label]")).toHaveTextContent("4");
    expect(blocks[1].querySelector("[data-legal-map-block-label]")).toHaveTextContent("4335A");
    for (const block of blocks) {
      const lots = block.querySelectorAll("[data-legal-map-lot]");
      expect(lots).toHaveLength(1);
      expect(lots[0]).toHaveTextContent("4Lot");
    }
    expect(screen.queryByText("4335", { exact: true })).not.toBeInTheDocument();
  });

  it("uses the supplied palette for map layers, captions and legend without rendering palette tables", () => {
    render(<LegalMapContent legal={{ summary: "One parcel.", groups: [{ type: "lot_block", elements: [
      { aspect: "subdivision", value: "SEALE SUBDIVISION" }, { aspect: "unit", value: "1" },
      { aspect: "block", value: "4335A" }, { aspect: "lot", value: "4" },
    ] }] }} onReadyChange={vi.fn()} />);
    const grid = document.querySelector("[data-legal-map-grid]")!;
    const unit = grid.querySelector("[data-legal-map-division]")!;
    const block = grid.querySelector("[data-legal-map-block-label]")!.parentElement!;
    const lot = grid.querySelector("[data-legal-map-lot]")!;
    expect(grid).toHaveStyle({ backgroundColor: "#f7f8f6", color: "#183247" });
    expect(grid.querySelector("[data-legal-map-subdivision]")).toHaveStyle({ borderColor: "#3a7c8c" });
    expect(screen.getByText("SEALE SUBDIVISION")).toHaveStyle({ color: "#274f59" });
    expect(unit).toHaveStyle({ backgroundColor: "#f4f1ea", borderColor: "#c8bdaa" });
    expect(screen.getByText("Unit 1")).toHaveStyle({ color: "#6b6256" });
    expect(block).toHaveStyle({ backgroundColor: "#e8f0f4", borderStyle: "none", color: "#294d60" });
    expect(lot).toHaveStyle({ backgroundColor: "#fbe9e3", borderColor: "#cf7258", color: "#9d4934", aspectRatio: "1" });
    expect(within(lot as HTMLElement).getByText("Lot")).toHaveStyle({ color: "#9d4934" });
    const info = document.querySelector("[data-legal-map-info]")!;
    for (const [label, fill, border] of [
      ["Subdivision", "rgba(0, 0, 0, 0)", "#3a7c8c"], ["Unit", "#f4f1ea", "#c8bdaa"],
      ["Block", "#e8f0f4", "#91aebe"], ["Lot", "#fbe9e3", "#cf7258"],
    ]) {
      const swatch = within(info as HTMLElement).getByText(label, { exact: true }).previousElementSibling;
      expect(swatch).toHaveStyle({ backgroundColor: fill, borderColor: border });
    }
    expect(info).toHaveTextContent("Description");
    expect(info).toHaveTextContent("One parcel.");
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.queryByText("Color Palette")).not.toBeInTheDocument();
    expect(screen.queryByText("Map Colors")).not.toBeInTheDocument();
  });

  it.each(["unit", "phase", "section"])("renders the full %s designation above the block", (aspect) => {
    render(<LegalMapContent legal={{ groups: [{ type: "lot_block", elements: [
      { aspect, value: `${aspect} 16A` }, { aspect: "block", value: "Block 4335A" },
      { aspect: "lot", value: "Lot 4A-4C" },
    ] }] }} onReadyChange={vi.fn()} />);
    expect(screen.getByText(`${aspect[0].toUpperCase()}${aspect.slice(1)} 16A`)).toBeInTheDocument();
    expect(screen.getByText("4335A")).toBeInTheDocument();
    expect(screen.getByText("4A-4C").parentElement).toHaveTextContent("Lot");
  });

  it("updates the hierarchy when the selected legal payload changes", () => {
    const { rerender } = render(<LegalMapContent legal={{ groups: [{ type: "lot_block", elements: [
      { aspect: "subdivision", value: "FIRST" }, { aspect: "lot", value: "7" },
    ] }] }} onReadyChange={vi.fn()} />);
    rerender(<LegalMapContent legal={{ groups: [{ type: "lot_block", elements: [
      { aspect: "subdivision", value: "SECOND" }, { aspect: "lot", value: "8" },
    ] }] }} onReadyChange={vi.fn()} />);
    const grid = document.querySelector("[data-legal-map-grid]")!;
    expect(within(grid as HTMLElement).queryByText("FIRST")).not.toBeInTheDocument();
    expect(within(grid as HTMLElement).getByText("SECOND")).toBeInTheDocument();
    expect(screen.queryByText("7")).not.toBeInTheDocument();
    expect(screen.getByText("8")).toBeInTheDocument();
  });
});

describe("right of way rendering", () => {
  const labels = ["2.669 ACRE DRAINAGE RIGHT OF WAY", "5.455 ACRE DRAINAGE RIGHT OF WAY"];
  const groups = labels.map(value => ({ type: "lot_block", elements: [
    { aspect: "subdivision", value: "INWOOD PLACE SUBDIVISION" }, { aspect: "unit", value: "1" },
    { aspect: "right_of_way", value },
  ] }));

  it("renders separate square hatched corridors and their legend without creating lots or blocks", () => {
    render(<LegalMapContent legal={{ groups, summary: "Two drainage rights of way." }} onReadyChange={vi.fn()} />);
    const subdivision = document.querySelector("[data-legal-map-subdivision]")!;
    const bands = subdivision.querySelectorAll<HTMLElement>("[data-legal-map-row]");
    expect(Array.from(bands, band => band.textContent)).toEqual(labels);
    expect(subdivision.querySelectorAll("[data-legal-map-division]")).toHaveLength(1);
    expect(subdivision.querySelectorAll("[data-legal-map-block], [data-legal-map-lot]")).toHaveLength(0);
    expect(screen.getByText("Unit 1")).toBeInTheDocument();
    for (const band of bands) {
      expect(band).toHaveStyle({ position: "absolute", height: "3rem", width: "100%", borderRadius: "0", transform: "translateY(-50%)", textAlign: "center" });
      expect(band.style.backgroundImage).toContain("repeating-linear-gradient");
      expect(band.style.borderTop).toContain("1px solid");
      expect(band.style.borderBottom).toContain("1px solid");
      expect(band.parentElement).toHaveStyle({ position: "relative", minHeight: "24rem" });
    }
    expect(parseFloat(bands[0].style.top)).toBeCloseTo(100 / 3);
    expect(parseFloat(bands[1].style.top)).toBeCloseTo(200 / 3);
    const legend = screen.getByText("Right Of Way");
    expect(legend.closest("[data-legal-map-info]")).toBeTruthy();
    expect((legend.previousElementSibling as HTMLElement).style.backgroundImage).toBe(bands[0].style.backgroundImage);
    expect(screen.getByText("Two drainage rights of way.")).toBeInTheDocument();
  });

  it.each([1, 2, 4])("distributes %i bands using their count rather than acreage", count => {
    render(<LegalMapContent legal={{ groups: Array.from({ length: count }, (_, index) => ({
      type: "lot_block", elements: [
        { aspect: "subdivision", value: "INWOOD PLACE SUBDIVISION" },
        { aspect: "right_of_way", value: `${index === 0 ? "0.001" : "9999"} ACRE RIGHT OF WAY ${index}` },
      ],
    })) }} onReadyChange={vi.fn()} />);
    const bands = document.querySelectorAll<HTMLElement>("[data-legal-map-row]");
    expect(bands).toHaveLength(count);
    bands.forEach((band, index) => {
      expect(parseFloat(band.style.top)).toBeCloseTo(100 * (index + 1) / (count + 1));
      expect(band).toHaveStyle({ height: "3rem", width: "100%", borderRadius: "0" });
    });
  });

  it("keeps each band's parent subdivision and existing lot/block rendering", () => {
    render(<LegalMapContent legal={{ groups: [
      ...groups,
      { type: "lot_block", elements: [{ aspect: "subdivision", value: "OTHER" }, { aspect: "right_of_way", value: "OTHER RIGHT OF WAY" }] },
      { type: "lot_block", elements: [
        { aspect: "subdivision", value: "INWOOD PLACE SUBDIVISION" }, { aspect: "unit", value: "1" },
        { aspect: "block", value: "4" }, { aspect: "lot", value: "1, 3" },
      ] },
    ] }} onReadyChange={vi.fn()} />);
    const subdivisions = document.querySelectorAll("[data-legal-map-subdivision]");
    expect(Array.from(subdivisions[0].querySelectorAll("[data-legal-map-row]"), band => band.textContent)).toEqual(labels);
    expect(subdivisions[1].querySelector("[data-legal-map-row]")).toHaveTextContent("OTHER RIGHT OF WAY");
    const block = subdivisions[0].querySelector("[data-legal-map-block]")!;
    expect(block.querySelector("[data-legal-map-block-label]")).toHaveTextContent("4");
    expect(Array.from(block.querySelectorAll("[data-legal-map-lot]"), lot => lot.textContent)).toEqual(["1Lot", "3Lot"]);
    expect(block.querySelectorAll("[data-legal-map-empty]")).toHaveLength(1);
  });

  it("removes ROW geometry, height and legend when the selected payload has no ROW", () => {
    const onReadyChange = vi.fn();
    const { rerender } = render(<LegalMapContent legal={{ groups }} onReadyChange={onReadyChange} />);
    rerender(<LegalMapContent legal={{ groups: [{ type: "lot_block", elements: [
      { aspect: "subdivision", value: "ORDINARY" }, { aspect: "lot", value: "7" },
    ] }] }} onReadyChange={onReadyChange} />);
    expect(document.querySelector("[data-legal-map-row]")).toBeNull();
    expect(screen.queryByText("Right Of Way")).not.toBeInTheDocument();
    expect(document.querySelector<HTMLElement>("[data-legal-map-subdivision]")!.firstElementChild).not.toHaveStyle({ minHeight: "24rem" });
    expect(screen.getByText("7").parentElement).toHaveTextContent("Lot");
    expect(onReadyChange).toHaveBeenCalledTimes(2);
  });
});
