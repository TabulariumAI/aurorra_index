import { useMemo, useState, type JSX } from "react";
import { createRoot } from "react-dom/client";
import { MetadataPanel } from "../../src/features/metdata/component/MetadataPanel";
import { buildAddressMapEmbedUrl, DEFAULT_ADDRESS_MAP_ZOOM } from "../../src/features/addressmap/data/addressMap";
import { getPanelData } from "../../src/features/metdata/data/metadataData";
import type { IndexSegmentValues, MetadataPayload } from "../../src/features/metdata/type/metadata.types";

const stage = document.getElementById("visual-stage");
if (!stage) {
  throw new Error("Missing visual stage.");
}

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

function AddressMapVisualHarness(): JSX.Element {
  const [addressMapOpen, setAddressMapOpen] = useState(false);
  const [addressMapSource, setAddressMapSource] = useState("");
  const [addressMapZoom, setAddressMapZoom] = useState(DEFAULT_ADDRESS_MAP_ZOOM);

  const metadata: MetadataPayload = useMemo(
    () => ({
      fees: [],
      funds: [],
      heading: { class: "deed", title: "Warranty Deed" },
      indexes: [
        {
          aspect: "property_address",
          code: "idx-addr",
          label: "property address",
          page: "1",
          page_number: "1",
          segment: "property",
          value: "123 Main Street, Austin, TX 78701",
        },
      ],
      pages: { num_of_pages: 1, recordables: [{ code: "page-1", name: "1" }] },
      secrets: [],
    }),
    [],
  );
  const panelData = useMemo(() => getPanelData(metadata), [metadata]);
  const noOp = (..._args: unknown[]) => undefined;

  const address = "123 Main Street, Austin, TX 78701";
  const expectedSource = buildAddressMapEmbedUrl(address);

  return (
    <div>
      <MetadataPanel
        callbacks={{}}
        store={{ error: null, status: "success" }}
        addressMapOpen={addressMapOpen}
        addressMapSource={addressMapSource}
        addressMapZoom={addressMapZoom}
        choices={[{ level: 1, service: "ExhibitIndexing" }]}
        legalOpen={false}
        metadata={metadata}
        closeAddressMap={() => {
          setAddressMapOpen(false);
          setAddressMapSource("");
          setAddressMapZoom(DEFAULT_ADDRESS_MAP_ZOOM);
        }}
        openAddressMap={(nextAddress, zoom = DEFAULT_ADDRESS_MAP_ZOOM) => {
          setAddressMapOpen(true);
          setAddressMapSource(buildAddressMapEmbedUrl(nextAddress));
          setAddressMapZoom(zoom);
        }}
        onConfirm={noOp}
        onDrop={noOp}
        openSegment={segments.PROPERTY}
        removedCodes={new Set()}
        selectedIndex={null}
        segments={segments}
        session="visual-session-addressmap"
        setLegalOpen={noOp}
        setSectionOpen={noOp}
        confirmedCodes={new Set()}
        panelData={panelData}
      />
      <div data-testid="address-map-source">{addressMapSource || "empty"}</div>
      <div data-testid="address-map-open">{addressMapOpen ? "open" : "closed"}</div>
      <div data-testid="address-map-zoom">{addressMapZoom}</div>
      <div data-testid="address-map-expected-source">{expectedSource}</div>
      <div style={{ display: "none" }} data-testid="address-map-literal">{address}</div>
    </div>
  );
}

createRoot(stage).render(<AddressMapVisualHarness />);
