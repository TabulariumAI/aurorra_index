import * as Tooltip from "@radix-ui/react-tooltip";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MetadataRow } from "../component/MetadataRows";

describe("MetadataRow details", () => {
  it("renders named structured details without JSON", () => {
    render(
      <Tooltip.Provider>
        <MetadataRow
          callbacks={{}}
          confirmed={false}
          details={[
            { label: "Formula", value: "base + pages" },
            { label: "Status", value: "Active" },
          ]}
          item={{
            code: "fee-1",
            explanation: "County recording charge.",
            label: "Recording fee",
            value: "$203.50",
          }}
          selected={false}
          segment="fee"
          session="session-1"
        />
      </Tooltip.Provider>,
    );

    expect(screen.getByText("$203.50")).toBeVisible();
    expect(screen.getByText("Recording fee")).toBeVisible();
    expect(screen.getByText("Explanation:")).toBeVisible();
    expect(screen.getByText("County recording charge.")).toBeVisible();
    expect(screen.getByText("Formula:")).toBeVisible();
    expect(screen.getByText("base + pages")).toBeVisible();
    expect(screen.getByText("Status:")).toBeVisible();
    expect(screen.getByText("Active")).toBeVisible();
    expect(screen.queryByText(/\"formula\"/)).not.toBeInTheDocument();
    expect(screen.queryByText("Quote:")).not.toBeInTheDocument();
  });

  it("keeps details aligned beside top-right action targets", () => {
    render(
      <Tooltip.Provider>
        <MetadataRow
          callbacks={{}}
          confirmed={false}
          item={{ code: "index-1", label: "loan amount", value: "$251,000.00" }}
          onDrop={vi.fn()}
          selected={false}
          segment="monetary"
          session="session-1"
        />
      </Tooltip.Provider>,
    );

    const row = screen.getByText("$251,000.00").closest("article");
    const actions = screen.getByRole("button", { name: "Pop the index" }).parentElement;

    expect(row).toHaveStyle({ alignItems: "start", display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto" });
    expect(row?.firstElementChild).toHaveStyle({ display: "flex", flexDirection: "column", gap: "0.25rem" });
    expect(row?.firstElementChild?.firstElementChild).toHaveStyle({ alignItems: "flex-start", display: "flex", minWidth: "0px" });
    expect(actions).toHaveStyle({ alignSelf: "start" });
  });

  it("shows confirmation progress until the index update completes", async () => {
    let complete!: () => void;
    const onConfirm = vi.fn(() => new Promise<void>((resolve) => {
      complete = resolve;
    }));
    render(
      <Tooltip.Provider>
        <MetadataRow
          callbacks={{}}
          confirmed={false}
          item={{ ambiguous: "YES", code: "index-1", label: "grantor", value: "Alice" }}
          onConfirm={onConfirm}
          selected={false}
          segment="party"
          session="session-1"
        />
      </Tooltip.Provider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Confirm index and remove ambiguity" }));

    expect(onConfirm).toHaveBeenCalledOnce();
    expect(screen.getByRole("status", { name: "Confirming index" }).firstElementChild).toHaveClass("aurorra-index-progress-spinner");
    expect(screen.queryByRole("button", { name: "Confirm index and remove ambiguity" })).not.toBeInTheDocument();

    complete();

    await waitFor(() => expect(screen.getByRole("button", { name: "Confirm index and remove ambiguity" })).toBeVisible());
  });

  it("runs delete once and shows progress until the index removal completes", async () => {
    let complete!: () => void;
    const onDrop = vi.fn(() => new Promise<void>((resolve) => {
      complete = resolve;
    }));
    render(
      <Tooltip.Provider>
        <MetadataRow
          callbacks={{}}
          confirmed={false}
          item={{ code: "index-1", label: "grantor", value: "Alice" }}
          onDrop={onDrop}
          selected={false}
          segment="party"
          session="session-1"
        />
      </Tooltip.Provider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Pop the index" }));

    expect(onDrop).toHaveBeenCalledOnce();
    expect(screen.getByRole("status", { name: "Dropping index" }).firstElementChild).toHaveClass("aurorra-index-progress-spinner");
    expect(screen.queryByRole("button", { name: "Pop the index" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Confirm$/ })).not.toBeInTheDocument();

    complete();

    await waitFor(() => expect(screen.getByRole("button", { name: "Pop the index" })).toBeVisible());
  });
});
