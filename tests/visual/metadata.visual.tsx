import { createRoot } from "react-dom/client";
import { useState } from "react";
import { MetadataPanel } from "../../src/features/metdataview/component/MetadataPanel";
import { getPanelData } from "aurora-core";
import type { MetadataSegments, MetadataPayload } from "aurora-core";

const segments: MetadataSegments = {
  ACKNOWLEDGMENT: "acknowledgment",
  CHAIN: "chain",
  JUDGMENT: "judgment",
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
    { ambiguous: "YES", aspect: "person-direct", code: "party-1", label: "borrower", page_number: "1", segment: "party", value: "GALINDO MANUEL GUEL" },
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
const propertyMetadata: MetadataPayload = {
  ...shortMetadata,
  indexes: [{ code: "property-1", segment: "property", aspect: "property_city", label: "property", page_number: "1", value: "Roanoke" }],
  legals: {
    summary: "One parcel in Green Acres Estates, Denton County, Texas.",
    groups: [{ code: "legal-1", type: "lot_block", elements: [
      { aspect: "subdivision", value: "GREEN ACRES ESTATES", explanation: "Subdivision identified in the legal description." },
      { aspect: "lot", value: "6" },
    ] }],
  },
};
const summaryMetadata: MetadataPayload = {
  ...shortMetadata,
  heading: { class: "mortgage", title: "Mortgage Satisfaction",
    secondary_titles: new URLSearchParams(window.location.search).has("secondary") ? ["Release of Lien"] : undefined,
    summary: `This document is a Mortgage Satisfaction${new URLSearchParams(window.location.search).has("secondary") ? " with a Release of Lien" : ""} extinguishing the recorded mortgage and releasing the lender's lien on the property.` },
  pages: { recordables: [{ name: "2", code: "summary-page", class: "Title" }], num_of_pages: 2 },
};
const activeMetadata = scenario === "metadata-summary" ? summaryMetadata : scenario === "metadata-property-alignment" ? propertyMetadata : scenario === "metadata-pages" ? pageMetadata : scenario === "metadata-address-row" ? addressRowMetadata : scenario === "metadata-party-rows" ? partyRowMetadata : scenario === "metadata-row" ? rowMetadata : scenario === "metadata-short" ? shortMetadata : metadata;
const activePanelData = scenario === "metadata-summary" ? getPanelData(summaryMetadata) : scenario === "metadata-property-alignment" ? getPanelData(propertyMetadata) : scenario === "metadata-pages" ? pagePanelData : scenario === "metadata-address-row" ? addressRowPanelData : scenario === "metadata-party-rows" ? partyRowPanelData : scenario === "metadata-row" ? rowPanelData : scenario === "metadata-short" ? shortPanelData : panelData;

const groupMetadata: MetadataPayload = {
  heading: { class: "deed", title: "Warranty Deed", summary: "Title overview." },
  pages: { recordables: [{ name: "1", code: "page-1", class: "Title" }, { name: "2", code: "page-2", class: "execution" }] },
  indexes: [
    { code: "endorsement-1", segment: "endorsement", page: "1", aspect: "recording_number", label: "Recording Number", value: "2026-001" },
    { code: "endorsement-2", segment: "endorsement", page: "2", aspect: "recording_date", label: "Recording Date", value: "November 2, 2026" },
    { code: "endorsement-3", segment: "endorsement", page: "1", aspect: "recording_office", label: "Recording Office", value: "County Recorder" },
    { code: "raw-1", segment: "party", page: "1", aspect: "person", label: "Grantor", value: "John Smith" },
    { code: "raw-2", segment: "party", page: "Exhibit-A", aspect: "person", label: "Grantee", value: "Jane Smith" },
    { code: "property-1", segment: "property", page: "1", aspect: "property_id", label: "Parcel", value: "Parcel 42" },
    { code: "notary-1", segment: "acknowledgment", page: "2", aspect: "notary_name", label: "Notary", value: "Jane Doe" },
  ],
  parties: { summary: "Party overview.", indexes: [
    { code: "side-1", segment: "party", page: "1", aspect: "person, Direct", label: "Grantor", value: "John Smith" },
    { code: "side-2", segment: "party", aspect: "person, Indirect", label: "Grantee", value: "Jane Smith" },
  ] },
  legals: { summary: "Legal overview.", groups: [{ code: "legal-1", page: "Exhibit-A", type: "lot_block", elements: [{ aspect: "lot", value: "12" }, { aspect: "block", value: "4" }] }] },
  execution: { summary: "Execution overview.", indexes: [
    { code: "seal-1", segment: "execution", page: "2", aspect: "notary_seal", label: "Notary seal", value: "Yes" },
  ] },
};

stage.style.display = "flex";
stage.style.flexDirection = "column";
stage.style.overflow = "hidden";
stage.style.padding = "0 1rem 1rem";
stage.style.boxSizing = "border-box";
stage.innerHTML = "";

function MetadataPreview() {
  const [openSegment, setOpenSegment] = useState<string | null>(scenario === "metadata-summary" ? segments.TITLE : scenario === "metadata-property-alignment" ? segments.PROPERTY : scenario === "metadata-pages" ? segments.PAGE : scenario === "metadata-row" ? segments.ENDORSEMENT : scenario === "metadata-address-row" ? segments.TRANSACTION : segments.PARTY);
  return (
  <MetadataPanel
    actions={{ confirm: true, drop: true, reprocess: true }}
    callbacks={{ onAddressClick: (value) => stage!.setAttribute("data-address", value), onEditPage: noOp, onPageClick: value => stage!.setAttribute("data-title-page", String(value.page)) }}
    choices={[{ level: 1, service: "PartyClauseIndexing" }]}
    confirmedCodes={new Set()}
    metadata={scenario === "metadata-groups" ? groupMetadata : activeMetadata}
    onConfirm={noOp}
    onDrop={noOp}
    onAddIndex={(segment) => stage!.setAttribute("data-add-segment", segment)}
    onEditIndex={(item) => stage.setAttribute("data-edit-code", String(item.code))}
    onReprocess={noOp}
    openSegment={openSegment}
    panelData={scenario === "metadata-groups" ? getPanelData(groupMetadata) : activePanelData}
    reprocessingSegments={new Set(scenario === "metadata-reprocess" ? [segments.PARTY] : [])}
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
