import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LegalMapContent } from "../component/LegalMapContent";

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
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("2,3")).toHaveAttribute("title", "Condominium Unit");
    expect(screen.getByText("Subdivision")).toBeInTheDocument();
    expect(screen.getByText("Condominium Unit")).toBeInTheDocument();
    expect(screen.getByText("Austin | Travis County | Texas")).toBeInTheDocument();
    const grid = document.querySelector("[data-legal-map-grid='true']");
    expect(grid).toHaveStyle({
      flex: "1 1 auto",
      justifyContent: "flex-start",
      maxHeight: "100%",
      overflow: "auto",
    });
    expect(grid?.parentElement).toHaveStyle({ height: "100%", overflow: "hidden" });
    expect(grid?.firstElementChild).toHaveStyle({ flex: "0 0 auto" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Close" })).not.toBeInTheDocument();
    expect(onReadyChange).toHaveBeenCalledWith(true);
  });

  it("renders the donor empty-state text for empty legal data", () => {
    render(<LegalMapContent legal={null} onReadyChange={vi.fn()} />);

    expect(screen.getByText("No valid property hierarchy data found.")).toBeInTheDocument();
  });
});
