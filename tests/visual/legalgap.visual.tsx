import { useMemo, type JSX } from "react";
import { createRoot } from "react-dom/client";
import { MetadataPanel } from "aurora-core";
import { getPanelData } from "aurora-core";
import type { MetadataSegments, MetadataPayload } from "aurora-core";

const stage = document.getElementById("visual-stage");

if (!stage) {
  throw new Error("Missing visual stage.");
}

const segments: MetadataSegments = {
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
      actions={{ confirm: true, drop: true, reprocess: true }}
      callbacks={{}}
      choices={[{ level: 1, service: "LegalEnrichment" }]}
      confirmedCodes={new Set()}
      metadata={metadata}
      onConfirm={noOp}
      onDrop={noOp}
      onReprocess={noOp}
      openSegment={segments.LEGAL}
      panelData={panelData}
      removedCodes={new Set()}
      sections={{ filterByChoices: false, hiddenSegments: new Set(), showEmpty: false }}
      selectedIndex={null}
      showContext
      segments={segments}
      session="visual-session-legal-gap"
      setSectionOpen={noOp}
      shortcuts={null}
      status="success"
    />
  );
}

createRoot(stage).render(<LegalGapHarness />);
