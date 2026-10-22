import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useState, type JSX } from "react";
import { describe, expect, it, vi } from "vitest";
import { getPanelData, type MetadataSegments, type MetadataPayload } from "aurora-core";
import { MetadataPanel } from "../component/MetadataPanel";

const segments: MetadataSegments = {
  ACKNOWLEDGMENT: "acknowledgment",
  JUDGMENT: "judgment",
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
    reprocess: true,
  },
  sections: {
    filterByChoices: true,
    hiddenSegments: new Set<string>(),
    showEmpty: false,
  },
  showContext: true,
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
          onLegalView: () => setAddress("combined-map"),
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
  it("opens the combined map once above the property rows", async () => {
    render(<PanelHarness />);

    const openButton = await screen.findByRole("button", { name: "Open legal view" });
    const value = screen.getByText("123 Main Street, Austin, TX 78701");
    expect(openButton.parentElement).not.toContainElement(value);
    expect(openButton).toHaveStyle({ padding: "0px" });
    expect(value).toHaveStyle({ display: "inline", whiteSpace: "normal", overflowWrap: "anywhere" });
    expect(openButton).toHaveTextContent("Show Map");
    expect(openButton).toHaveStyle({ alignItems: "center", height: "2rem", minHeight: "2rem", width: "auto" });
    fireEvent.click(openButton);

    await waitFor(() => expect(screen.getByTestId("address-clicked").textContent).toBe("combined-map"));
    expect(screen.queryByRole("button", { name: /^Open address/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
