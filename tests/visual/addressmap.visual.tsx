import { useMemo, useState, type JSX } from "react";
import { createRoot } from "react-dom/client";
import { MetadataPanel } from "../../src/features/metdata/component/MetadataPanel";
import { buildAddressMapEmbedUrl } from "../../src/features/addressmap/data/addressMap";
import { getPanelData } from "../../src/features/metdata/data/metadataData";
import type { IndexSegmentValues, MetadataPayload } from "../../src/features/metdata/type/metadata.types";

const stage = document.getElementById("visual-stage");
if (!stage) {
  throw new Error("Missing visual stage.");
}

stage.style.display = "flex";
stage.style.flexDirection = "column";
stage.style.overflow = "hidden";
stage.style.padding = "0 1rem 1rem";
stage.style.boxSizing = "border-box";
stage.innerHTML = "";

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
  const [addressClicked, setAddressClicked] = useState("");

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

  const address = "123 Main Street, Austin, TX 78701";
  const noOp = () => undefined;

  return (
    <>
      <MetadataPanel
        actions={{ confirm: true, drop: true, refine: true, reprocess: true }}
        callbacks={{
          onAddressClick: (value) => setAddressClicked(buildAddressMapEmbedUrl(value)),
          onPageClick: () => undefined,
        }}
        confirmedCodes={new Set()}
        choices={[{ level: 1, service: "ExhibitIndexing" }]}
        metadata={metadata}
        onConfirm={noOp}
        onDrop={noOp}
        onReprocess={noOp}
        openSegment={segments.PROPERTY}
        panelData={panelData}
        removedCodes={new Set()}
        sections={{ filterByChoices: false, hiddenSegments: new Set(), showEmpty: false }}
        selectedIndex={null}
        segments={segments}
        session="visual-session-addressmap"
        setSectionOpen={() => undefined}
        shortcuts={null}
        status="success"
      />
      <div data-testid="address-map-callback-source">
        {addressClicked || "empty"}
      </div>
      <div data-testid="address-map-input">{address}</div>
    </>
  );
}

createRoot(stage).render(<AddressMapVisualHarness />);
