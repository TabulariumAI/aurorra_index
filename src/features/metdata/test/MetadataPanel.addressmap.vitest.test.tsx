import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useState, type JSX } from "react";
import { describe, expect, it, vi } from "vitest";
import { DEFAULT_ADDRESS_MAP_ZOOM } from "../../addressmap/data/addressMap";
import { buildAddressMapEmbedUrl } from "../../addressmap/data/addressMap";
import { MetadataPanel } from "../component/MetadataPanel";
import { getPanelData } from "../data/metadataData";
import type { IndexSegmentValues, MetadataPayload } from "../type/metadata.types";

const segments: IndexSegmentValues = {
  ACKNOWLEDGMENT: "acknowledgment",
  CHAIN: "chain",
  COURT: "court",
  ENDORSEMENT: "endorsement",
  FEE: "fee",
  FEEFACTOR: "factor",
  FUND: "fund",
  HISTORY: "history",
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

function PanelHarness(): JSX.Element {
  const [addressOpen, setAddressOpen] = useState(false);
  const [addressSource, setAddressSource] = useState("");
  const [addressZoom, setAddressZoom] = useState(DEFAULT_ADDRESS_MAP_ZOOM);

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
    <MetadataPanel
      addressMapOpen={addressOpen}
      addressMapSource={addressSource}
      addressMapZoom={addressZoom}
      callbacks={{}}
      choices={[{ level: 1, service: "ExhibitIndexing" }]}
      confirmedCodes={new Set()}
      legalOpen={false}
      metadata={metadata}
      closeAddressMap={() => {
        setAddressOpen(false);
        setAddressSource("");
      }}
      openAddressMap={(address, zoom = DEFAULT_ADDRESS_MAP_ZOOM) => {
        setAddressOpen(true);
        setAddressSource(buildAddressMapEmbedUrl(address));
        setAddressZoom(zoom);
      }}
      onConfirm={vi.fn()}
      onDrop={vi.fn()}
      openSegment="property"
      removedCodes={new Set()}
      selectedIndex={null}
      segments={segments}
      session="session-address-map"
      setLegalOpen={vi.fn()}
      setSectionOpen={vi.fn()}
      store={{ error: null, status: "success" }}
      panelData={getPanelData(metadata)}
    />
  );
}

describe("MetadataPanel address map integration", () => {
  it("opens AddressMapDialog through package-owned address action handler", async () => {
    render(<PanelHarness />);

    const openButton = await screen.findByRole("button", { name: "Open address 123 Main Street, Austin, TX 78701" });
    fireEvent.click(openButton);

    await waitFor(() => expect(screen.getByRole("dialog")).toBeInTheDocument());
    expect(screen.getByText("123 Main Street, Austin, TX 78701")).toBeInTheDocument();
    const iframe = screen.getByTestId("address-map-iframe");
    await waitFor(() => expect(iframe).toHaveAttribute("src", `${buildAddressMapEmbedUrl("123 Main Street, Austin, TX 78701")}&z=${DEFAULT_ADDRESS_MAP_ZOOM}`));
    expect(screen.getByRole("button", { name: /Close/i })).toBeInTheDocument();
  });
});
