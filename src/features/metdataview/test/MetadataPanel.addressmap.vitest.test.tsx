import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useState, type JSX } from "react";
import { describe, expect, it, vi } from "vitest";
import { MetadataPanel } from "../component/MetadataPanel";
import { getPanelData } from "../data/metadataData";
import type { MetdataSegmentValues, MetadataPayload } from "../type/metadataView.types";

const segments: MetdataSegmentValues = {
  ACKNOWLEDGMENT: "acknowledgment",
  COURT: "court",
  ENDORSEMENT: "endorsement",
  FEE: "fee",
  FEEFACTOR: "factor",
  FUND: "fund",
  LEGAL: "legal",
  MONETARY: "monetary",
  PAGE: "page",
  PARTY: "party",
  PROPERTY: "property",
  REFERENCE: "reference",
  SECRETS: "secrets",
  TITLE: "title",
  TRANSACTION: "transaction",
  VITAL: "vital",
};

const panelDefaults = {
  actions: {
    confirm: true,
    drop: true,
    refine: true,
    reprocess: true,
  },
  sections: {
    filterByChoices: true,
    hiddenSegments: new Set<string>(),
    showEmpty: false,
  },
  shortcuts: null,
  status: "success" as const,
};

function PanelHarness(): JSX.Element {
  const [address, setAddress] = useState("");

  const metadata: MetadataPayload = {
    fees: [],
    funds: [],
    heading: { class: "deed", title: "Warranty Deed" },
    indexes: [
      {
        aspect: "property_address",
        code: "idx-addr",
        label: "property address",
        page: "1",
        segment: "property",
        value: "123 Main Street, Austin, TX 78701",
      },
    ],
    pages: { num_of_pages: 1, recordables: [{ code: "page-1", name: "1" }] },
    secrets: [],
  };

  return (
    <>
      <MetadataPanel
        {...panelDefaults}
        callbacks={{
          onAddressClick: (value) => setAddress(value),
        }}
        confirmedCodes={new Set()}
        choices={[{ level: 1, service: "ExhibitIndexing" }]}
        metadata={metadata}
        onConfirm={vi.fn()}
        onDrop={vi.fn()}
        onReprocess={vi.fn()}
        openSegment="property"
        removedCodes={new Set()}
        selectedIndex={null}
        segments={segments}
        session="session-address-map"
        setSectionOpen={vi.fn()}
        panelData={getPanelData(metadata)}
      />
      <div data-testid="address-clicked">{address}</div>
    </>
  );
}

describe("MetadataPanel address map integration", () => {
  it("forwards address row click to callbacks.onAddressClick", async () => {
    render(<PanelHarness />);

    const openButton = await screen.findByRole("button", { name: "Open address 123 Main Street, Austin, TX 78701" });
    const value = screen.getByText("123 Main Street, Austin, TX 78701");
    expect(openButton.parentElement?.firstElementChild).toBe(openButton);
    expect(openButton.parentElement?.lastElementChild).toBe(value);
    expect(openButton).toHaveStyle({ alignItems: "flex-start" });
    fireEvent.click(openButton);

    await waitFor(() => expect(screen.getByTestId("address-clicked").textContent).toBe("123 Main Street, Austin, TX 78701"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
