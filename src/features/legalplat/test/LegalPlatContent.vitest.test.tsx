import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LegalPlatContent } from "../component/LegalPlatContent";

describe("LegalPlatContent", () => {
  it("renders the pure legal plat hierarchy without shell dialog controls", () => {
    render(
      <LegalPlatContent
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
      />,
    );

    expect(screen.getByText("WILLOW CREEK")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("2,3")).toHaveAttribute("title", "Condominium Unit");
    expect(screen.getByText("Subdivision")).toBeInTheDocument();
    expect(screen.getByText("Condominium Unit")).toBeInTheDocument();
    expect(screen.getByText("Austin | Travis County | Texas")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Close" })).not.toBeInTheDocument();
  });

  it("renders the donor empty-state text for empty legal data", () => {
    render(<LegalPlatContent legal={null} />);

    expect(screen.getByText("No valid property hierarchy data found.")).toBeInTheDocument();
  });
});
