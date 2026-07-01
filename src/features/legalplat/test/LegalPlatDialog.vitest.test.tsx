import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LegalPlatDialog } from "../component/LegalPlatDialog";

describe("LegalPlatDialog", () => {
  it("owns the legal plat dialog shell with visible header, constrained body, and bottom close button", () => {
    let open = true;
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
        onOpenChange={(nextOpen) => {
          open = nextOpen;
        }}
        open={open}
      />,
    );

    const dialog = screen.getByRole("dialog", { name: "Plat" });
    expect(dialog).toHaveAttribute("data-height-mode", "medium");
    const header = dialog.querySelector("[data-dialog-header]");
    expect(header).toBeInTheDocument();
    expect(within(header as HTMLElement).getByText("Plat")).toBeInTheDocument();
    expect(dialog.querySelector("[data-dialog-body]")).toHaveAttribute("data-body-mode", "center");
    expect(within(dialog).getByText("DIALOG LEGAL")).toBeInTheDocument();
    const closeButtons = within(dialog).getAllByRole("button", { name: "Close" });
    expect(closeButtons).toHaveLength(2);
    closeButtons[0].click();
    expect(open).toBe(false);
  });
});
