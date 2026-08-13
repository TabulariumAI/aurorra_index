import * as Tooltip from "@radix-ui/react-tooltip";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
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
});
