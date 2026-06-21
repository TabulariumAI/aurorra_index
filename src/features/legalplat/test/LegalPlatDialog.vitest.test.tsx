import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LegalPlatDialog } from "../component/LegalPlatDialog";

describe("LegalPlatDialog", () => {
  it("owns the legal plat dialog shell, sizing, and body mode without a close button", () => {
    render(
      <LegalPlatDialog
        legal={{
          groups: [
            {
              elements: [
                { aspect: "subdivision", value: "DIALOG LEGAL" },
                { aspect: "block", value: "Block 8" },
                { aspect: "lot", value: "Lot 4" },
              ],
              type: "lot_block",
            },
          ],
        }}
        onOpenChange={() => undefined}
        open
      />,
    );

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("data-height-mode", "wide");
    expect(dialog.querySelector("[data-dialog-header]")).not.toBeInTheDocument();
    expect(dialog.querySelector("[data-dialog-body]")).toHaveAttribute("data-body-mode", "center");
    expect(within(dialog).getByText("DIALOG LEGAL")).toBeInTheDocument();
    expect(within(dialog).queryByRole("button", { name: "Close" })).not.toBeInTheDocument();
  });
});
