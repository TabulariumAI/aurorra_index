import { createRoot } from "react-dom/client";
import { useState } from "react";
import { MetadataPanel } from "aurora-core";
import { getPanelData } from "aurora-core";
import type { MetadataSegments, MetadataPayload } from "aurora-core";

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
const rowMetadata: MetadataPayload = {
  ...shortMetadata,
  indexes: [{
    aspect: "recording_instrument_number",
    code: "endorsement-1",
    label: "recording_instrument_number",
    page: "1",
    page_number: "1",
    segment: "endorsement",
    value: "20180081078",
  }],
};
const rowPanelData = getPanelData(rowMetadata);
const partyRowMetadata: MetadataPayload = {
  ...shortMetadata,
  indexes: [
    { aspect: "person-direct", code: "party-1", label: "borrower", page_number: "1", segment: "party", value: "GALINDO MANUEL GUEL" },
    { aspect: "person-direct", code: "party-2", label: "borrower", page_number: "1", segment: "party", value: "GUEL ALMA E" },
    { aspect: "person-other", code: "party-3", label: "trustee", page_number: "1", segment: "party", value: "IRVINE TIMOTHY K" },
    { aspect: "organization-indirect", code: "party-4", label: "beneficiary", page_number: "1", segment: "party", value: "BANK OF NEW YORK MELLON TRUST CO" },
    { aspect: "government-indirect", code: "party-5", label: "lender", page_number: "1", segment: "party", value: "TEXAS DEPT OF HOUSING AND COMMUNITY AFFAIRS" },
    { aspect: "organization-indirect", code: "party-6", label: "senior_lien_holder", page_number: "1", segment: "party", value: "GEORGETOWN MTG LLC" },
  ],
};
const partyRowPanelData = getPanelData(partyRowMetadata);
const addressRowMetadata: MetadataPayload = {
  ...shortMetadata,
  indexes: [
    {
      aspect: "mailback",
      code: "transaction-1",
      label: "transactional",
      page_number: "1",
      segment: "transaction",
      value: "4819 Williams Drive, Georgetown, 78633, Georgetown Mortgage Street, LLC",
    },
    {
      aspect: "party_address",
      code: "transaction-2",
      label: "prepared_by",
      page_number: "1",
      segment: "transaction",
      value: "PO Box 13941, Austin, TX 78711-3941 Street, Timothy K Irvine",
    },
  ],
};
const addressRowPanelData = getPanelData(addressRowMetadata);
const pageMetadata: MetadataPayload = {
  ...shortMetadata,
  indexes: [],
  pages: {
    num_of_pages: 3,
    recordables: [
      { class: "title", code: "page-1", name: "1" },
      { class: "instrument", code: "page-2", name: "2" },
      { class: "document", code: "page-3", name: "3" },
    ],
  },
};
const pagePanelData = getPanelData(pageMetadata);
const noOp = (..._args: unknown[]) => undefined;

const stage = document.getElementById("visual-stage");
if (!stage) throw new Error("visual-stage is required.");

const scenario = new URLSearchParams(window.location.search).get("scenario");
const activeMetadata = scenario === "metadata-pages" ? pageMetadata : scenario === "metadata-address-row" ? addressRowMetadata : scenario === "metadata-party-rows" ? partyRowMetadata : scenario === "metadata-row" ? rowMetadata : scenario === "metadata-short" ? shortMetadata : metadata;
const activePanelData = scenario === "metadata-pages" ? pagePanelData : scenario === "metadata-address-row" ? addressRowPanelData : scenario === "metadata-party-rows" ? partyRowPanelData : scenario === "metadata-row" ? rowPanelData : scenario === "metadata-short" ? shortPanelData : panelData;

stage.style.display = "flex";
stage.style.flexDirection = "column";
stage.style.overflow = "hidden";
stage.style.padding = "0 1rem 1rem";
stage.style.boxSizing = "border-box";
stage.innerHTML = "";

function MetadataPreview() {
  const [openSegment, setOpenSegment] = useState<string | null>(scenario === "metadata-pages" ? segments.PAGE : scenario === "metadata-row" ? segments.ENDORSEMENT : scenario === "metadata-address-row" ? segments.TRANSACTION : segments.PARTY);
  return (
  <MetadataPanel
    actions={{ confirm: true, drop: true, reprocess: true }}
    callbacks={{ onAddressClick: (value) => stage!.setAttribute("data-address", value), onEditPage: noOp, onPageClick: noOp }}
    choices={[{ level: 1, service: "PartyClauseIndexing" }]}
    confirmedCodes={new Set()}
    metadata={activeMetadata}
    onConfirm={noOp}
    onDrop={noOp}
    onAddIndex={(segment) => stage!.setAttribute("data-add-segment", segment)}
    onEditIndex={(item) => stage.setAttribute("data-edit-code", String(item.code))}
    onReprocess={noOp}
    openSegment={openSegment}
    panelData={activePanelData}
    reprocessingSegment={scenario === "metadata-reprocess" ? segments.PARTY : null}
    removedCodes={new Set()}
    sections={{ filterByChoices: false, hiddenSegments: new Set(), showEmpty: false }}
    selectedIndex={null}
    showContext
    segments={segments}
    session="visual-session-metadata"
    setSectionOpen={(segment, open) => setOpenSegment(open ? segment : null)}
    shortcuts={null}
    status="success"
  />
  );
}

createRoot(stage).render(<MetadataPreview />);
