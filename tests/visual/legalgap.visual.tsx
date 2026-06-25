import { useMemo, type JSX } from "react";
import { createRoot } from "react-dom/client";
import { DEFAULT_ADDRESS_MAP_ZOOM } from "../../src/features/addressmap/data/addressMap";
import { MetadataPanel } from "../../src/features/metdata/component/MetadataPanel";
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

function LegalGapHarness(): JSX.Element {
  const metadata: MetadataPayload = useMemo(() => ({
    fees: [],
    funds: [],
    heading: { class: "deed", title: "Warranty Deed" },
    legals: {
      groups: [
        {
          code: "legal-1",
          elements: [{ aspect: "subdivision", value: "CHURCHILL'S SUBURBAN VILLA 1 ACRE TRACTS" }],
          page: "3",
          type: "lot_block",
        },
        {
          code: "legal-2",
          elements: [{ aspect: "easement", value: "Ingress and egress" }],
          page: "4",
          type: "metes_bounds",
        },
      ],
    },
    pages: { num_of_pages: 0, recordables: [] },
    secrets: [],
  }), []);
  const panelData = useMemo(() => getPanelData(metadata), [metadata]);
  const noOp = () => undefined;

  return (
    <MetadataPanel
      callbacks={{}}
      addressMapOpen={false}
      addressMapSource=""
      addressMapZoom={DEFAULT_ADDRESS_MAP_ZOOM}
      choices={[{ level: 1, service: "LegalEnrichment" }]}
      closeAddressMap={noOp}
      confirmedCodes={new Set()}
      legalOpen={false}
      metadata={metadata}
      onConfirm={noOp}
      onDrop={noOp}
      openAddressMap={noOp}
      openSegment={segments.LEGAL}
      panelData={panelData}
      removedCodes={new Set()}
      selectedIndex={null}
      segments={segments}
      session="visual-session-legal-gap"
      setLegalOpen={noOp}
      setSectionOpen={noOp}
      store={{ error: null, status: "success" }}
    />
  );
}

createRoot(stage).render(<LegalGapHarness />);
