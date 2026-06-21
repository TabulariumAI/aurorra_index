import { describe, expect, it } from "vitest";
import { normalizeLegalData } from "../data/legalData";

describe("legal data normalization", () => {
  it("normalizes donor lot block groups into the legal plat view model", () => {
    const view = normalizeLegalData({
      groups: [
        {
          code: "legal-1",
          elements: [
            { aspect: "subdivision", value: "WILLOW CREEK" },
            { aspect: "part", value: "Tract A" },
            { aspect: "phase", value: "Phase 1" },
            { aspect: "block", value: "Block 12" },
            { aspect: "lot", value: "Lot 7" },
            { aspect: "condominium_unit", value: "Unit 2-3" },
          ],
          page: "3",
          type: "lot_block",
        },
      ],
      plat: {
        city: "austin",
        county: "travis county",
        state: "TX",
      },
      summary: "Property is described.",
    });

    expect(view.subdivisions).toEqual([
      {
        subdivision: "WILLOW CREEK",
        tract: "",
        tracks: [
          {
            name: "Tract A",
            phases: [
              {
                name: "Phase 1",
                blocks: [
                  {
                    name: "Block 12",
                    lots: [{ name: "Lot 7", condominium_unit: "Unit 2-3" }],
                  },
                ],
              },
            ],
          },
        ],
      },
    ]);
    expect(view.location).toEqual({ city: "Austin", county: "Travis", state: "Texas" });
    expect(view.locationLabel).toBe("Austin | Travis County | Texas");
    expect(view.presentLayers).toEqual(new Set(["subdivision", "phase", "block", "lot", "condo_unit"]));
    expect(view.isEmptyStructure).toBe(false);
    expect(view.matchPlatSubdivision).toBe(true);
    expect(view.platName).toBe("Willow Creek");
  });
});
