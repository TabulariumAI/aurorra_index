import { createRoot } from "react-dom/client";
import { MetadataPanel } from "../../src/features/metdata/component/MetadataPanel";
import { getPanelData } from "../../src/features/metdata/data/metadataData";
import type { IndexSegmentValues, MetadataPayload } from "../../src/features/metdata/type/metadata.types";

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

const longExplanation =
  "This explanation is intentionally long so the metadata row stays collapsed to a single line by default and only reveals the full text after the user expands it with the inline disclosure control. ".repeat(
    3,
  );
const longQuote =
  "This quote is intentionally long so the metadata row keeps the source collapsed to a single line by default and only reveals the full quoted source after the user expands it with the inline disclosure control. ".repeat(
    3,
  );
const longValue =
  "All that certain lot, tract or parcel of land being 1.89 acres in the Patrick O'Rourk Survey A-666 and being more particularly described by metes and bounds. ".repeat(
    3,
  );

const metadata: MetadataPayload = {
  fees: [],
  funds: [],
  heading: { class: "deed", title: "Warranty Deed" },
  indexes: [
    {
      code: "idx-1",
      explanation: longExplanation,
      label: "grantor",
      page: "1",
      page_number: "1",
      segment: "party",
      source: longQuote,
      value: longValue,
    },
  ],
  pages: { num_of_pages: 1, recordables: [{ code: "page-1", name: "1" }] },
  secrets: [],
};

const shortMetadata: MetadataPayload = {
  fees: [],
  funds: [],
  heading: { class: "deed", title: "Warranty Deed" },
  indexes: [
    {
      code: "idx-1",
      explanation: "Short explanation",
      label: "grantor",
      page: "1",
      page_number: "1",
      segment: "party",
      source: "Short quote",
      value: "Alice",
    },
  ],
  pages: { num_of_pages: 1, recordables: [{ code: "page-1", name: "1" }] },
  secrets: [],
};

const panelData = getPanelData(metadata);
const shortPanelData = getPanelData(shortMetadata);
const noOp = (..._args: unknown[]) => undefined;

const stage = document.getElementById("visual-stage");
if (!stage) throw new Error("visual-stage is required.");

const scenario = new URLSearchParams(window.location.search).get("scenario");
const activeMetadata = scenario === "metadata-short" ? shortMetadata : metadata;
const activePanelData = scenario === "metadata-short" ? shortPanelData : panelData;

stage.style.overflow = "auto";
stage.style.padding = "0 1rem 1rem";
stage.style.boxSizing = "border-box";
stage.innerHTML = "";

createRoot(stage).render(
  <MetadataPanel
    actions={{ confirm: true, drop: true, refine: true, reprocess: true }}
    callbacks={{ onEditPage: noOp, onPageClick: noOp }}
    choices={[{ level: 1, service: "PartyClauseIndexing" }]}
    confirmedCodes={new Set()}
    metadata={activeMetadata}
    onConfirm={noOp}
    onDrop={noOp}
    onReprocess={noOp}
    openSegment={segments.PARTY}
    panelData={activePanelData}
    removedCodes={new Set()}
    sections={{ filterByChoices: false, hiddenSegments: new Set(), showEmpty: false }}
    selectedIndex={null}
    segments={segments}
    session="visual-session-metadata"
    setSectionOpen={noOp}
    shortcuts={null}
    status="success"
  />,
);
