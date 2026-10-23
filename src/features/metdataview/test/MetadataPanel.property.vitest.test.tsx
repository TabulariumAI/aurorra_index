import { fireEvent, render, screen, within } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { getPanelData, type MetadataPayload } from "aurora-core";
import { MetadataPanel, type MetadataPanelProps } from "../component/MetadataPanel";

const metadata: MetadataPayload = {
  indexes: [
    { code: "parcel", segment: "property", aspect: "property_id", label: "parcel", page_number: "2", page: "2", value: "Parcel 42" },
    { code: "description-1", segment: "property", aspect: "legal_description", label: "description", page_number: "2", value: "Duplicate description one" },
    { code: "description-2", segment: "property", aspect: "legal_description", label: "description", page_number: "3", value: "Duplicate description two" },
    { code: "party", segment: "party", aspect: "legal_description", label: "party", page_number: "1", value: "Unrelated party description" },
  ],
  legals: {
    summary: "Property legal summary.",
    groups: [
      { code: "legal-1", page: "2", type: "lot_block", elements: [{ aspect: "lot", value: "12" }, { aspect: "block", value: "4" }] },
      { code: "legal-2", page: "3", type: "metes_bounds", elements: [{ aspect: "description", value: "Boundary description" }] },
      { code: "empty", elements: [] },
    ],
  },
};
const props: MetadataPanelProps = {
  actions: { confirm: true, drop: true, reprocess: true }, callbacks: {},
  choices: [{ service: "ExhibitIndexing", level: 1 }, { service: "LegalEnrichment", level: 1 }, { service: "PartyClauseIndexing", level: 1 }],
  metadata, panelData: getPanelData(metadata), confirmedCodes: new Set(), removedCodes: new Set(),
  openSegment: "property", selectedIndex: null,
  sections: { filterByChoices: true, hiddenSegments: new Set(), showEmpty: false },
  showContext: false, session: "session-1", setSectionOpen: vi.fn(), shortcuts: null, status: "success",
  segments: { ACKNOWLEDGMENT: "acknowledgment", JUDGMENT: "judgment", ENDORSEMENT: "endorsement", FEE: "fee", FEEFACTOR: "factor", FUND: "fund", LEGAL: "legal", MONETARY: "monetary", PAGE: "page", PARTY: "party", PROPERTY: "property", REFERENCE: "reference", SECRETS: "secrets", TITLE: "title", TRANSACTION: "transaction", VITAL: "vital" },
};

it("merges property rows and legal groups with one count and no duplicate descriptions", () => {
  const view = render(<MetadataPanel {...props} />);
  const trigger = screen.getByRole("button", { name: "Property Info" });
  expect(trigger.parentElement?.querySelector(":scope > span")).toHaveTextContent("3");
  expect(screen.queryByRole("button", { name: "Legal Descriptions" })).toBeNull();
  const content = trigger.parentElement!.parentElement!;
  expect(within(content).getByText("Parcel 42")).toBeVisible();
  expect(within(content).getByText("Property legal summary.")).toBeVisible();
  expect(within(content).getByText("Boundary description")).toBeVisible();
  expect(within(content).getAllByText("Legal Description", { exact: true })).toHaveLength(2);
  expect(screen.queryByText("Duplicate description one")).toBeNull();
  expect(screen.queryByText("Duplicate description two")).toBeNull();
  expect(screen.queryByText("No property info found.")).toBeNull();
  expect(screen.queryByText("No legal descriptions found.")).toBeNull();
  view.rerender(<MetadataPanel {...props} openSegment="party" />);
  expect(screen.getByText("Unrelated party description")).toBeVisible();
});

it.each([undefined, { groups: [] }, { groups: [{ elements: [] }] }, { groups: [{ code: "empty" }] }])(
  "keeps description indexes when there are no legal elements: %j", (legals) => {
    const data = { ...metadata, legals };
    render(<MetadataPanel {...props} metadata={data} panelData={getPanelData(data)} />);
    expect(screen.getByRole("button", { name: "Property Info" }).parentElement?.querySelector(":scope > span")).toHaveTextContent("3");
    expect(screen.getByText("Duplicate description one")).toBeVisible();
    expect(screen.getByText("Duplicate description two")).toBeVisible();
  },
);

it.each([
  { property: 1, legal: 1, count: "3" },
  { property: 1, legal: 0, count: "1" },
  { property: 0, legal: 1, count: "2" },
  { property: 0, legal: 0, count: null },
])("retains service filters with property=$property legal=$legal", ({ property, legal, count }) => {
  render(<MetadataPanel {...props} choices={[{ service: "ExhibitIndexing", level: property }, { service: "LegalEnrichment", level: legal }]} />);
  const trigger = screen.queryByRole("button", { name: "Property Info" });
  if (count === null) {
    expect(trigger).toBeNull();
  } else {
    expect(trigger!.parentElement?.querySelector(":scope > span")).toHaveTextContent(count);
    expect(Boolean(screen.queryByText("Parcel 42"))).toBe(Boolean(property));
    expect(Boolean(screen.queryByText("Property legal summary."))).toBe(Boolean(legal));
    expect(Boolean(screen.queryByText("Boundary description"))).toBe(Boolean(legal));
  }
});

it("retains hidden-segment filters for each content source", () => {
  const view = render(<MetadataPanel {...props} sections={{ ...props.sections, hiddenSegments: new Set(["property"]) }} />);
  expect(screen.getByRole("button", { name: "Property Info" }).parentElement?.querySelector(":scope > span")).toHaveTextContent("2");
  expect(screen.queryByText("Parcel 42")).toBeNull();
  view.rerender(<MetadataPanel {...props} sections={{ ...props.sections, hiddenSegments: new Set(["legal"]) }} />);
  expect(screen.getByRole("button", { name: "Property Info" }).parentElement?.querySelector(":scope > span")).toHaveTextContent("1");
  expect(screen.queryByText("Property legal summary.")).toBeNull();
  view.rerender(<MetadataPanel {...props} sections={{ ...props.sections, hiddenSegments: new Set(["legal", "property"]) }} />);
  expect(screen.queryByRole("button", { name: "Property Info" })).toBeNull();
});

it("renders unfiltered capability content with the same merged count", () => {
  render(<MetadataPanel {...props} choices={null} sections={{ ...props.sections, filterByChoices: false }} />);
  expect(screen.getByRole("button", { name: "Property Info" }).parentElement?.querySelector(":scope > span")).toHaveTextContent("3");
  expect(screen.getByText("Parcel 42")).toBeVisible();
  expect(screen.getByText("Boundary description")).toBeVisible();
});

it("keeps the summary font consistent with legal element text", () => {
  render(<MetadataPanel {...props} />);
  const summary = screen.getByText("Property legal summary.");
  expect(summary.style.fontSize).toBe("");
  expect(summary.style.fontWeight).toBe("");
  expect(summary.style.color).toBe("");
});

it("retains property locations, legal locations, explanations and every group element", () => {
  const data: MetadataPayload = {
    indexes: [
      { code: "city", segment: "property", aspect: "property_city", label: "city", page_number: "1", value: "San Antonio" },
      { code: "county", segment: "property", aspect: "property_county", label: "county", page_number: "1", value: "Bexar" },
      { code: "state", segment: "property", aspect: "property_state", label: "state", page_number: "1", value: "Texas" },
    ],
    legals: { groups: [
      { code: "legal-locations", type: "lot_block", elements: [
        { aspect: "city", value: "CITY OF SAN ANTONIO", explanation: "GROUP_BASIS:PLATTED identified from the legal text." },
        { aspect: "county", value: "BEXAR COUNTY" },
        { aspect: "state", value: "TEXAS" },
        { aspect: "lot", value: "9" },
      ] },
      { code: "legal-plat", type: "plat_reference", elements: [{ aspect: "plat_book", value: "2222" }, { aspect: "plat_page", value: "226" }] },
    ] },
  };
  render(<MetadataPanel {...props} metadata={data} panelData={getPanelData(data)} />);
  expect(screen.getByRole("button", { name: "Property Info" }).parentElement?.querySelector(":scope > span")).toHaveTextContent("5");
  for (const text of ["San Antonio", "Bexar", "Texas", "CITY OF SAN ANTONIO", "BEXAR COUNTY", "TEXAS", "9", "2222", "226", "GROUP_BASIS:PLATTED identified from the legal text."]) {
    expect(screen.getByText(text, { exact: true })).toBeVisible();
  }
});

it("opens merged content for legal selection with page and plat actions and no legal edit or copy buttons", () => {
  const onEditIndex = vi.fn();
  const onPageClick = vi.fn();
  const onLegalView = vi.fn();
  const view = render(<MetadataPanel {...props} openSegment="legal" selectedIndex={{ code: "legal-1", segment: "legal" }}
    onEditIndex={onEditIndex} callbacks={{ onPageClick, onLegalView }} />);
  expect(screen.getByRole("button", { name: "Property Info" })).toHaveAttribute("aria-expanded", "true");
  const group = view.container.querySelector<HTMLElement>('[data-index-code="legal-1"]')!;
  expect(group).toHaveAttribute("data-active", "true");
  expect(group).toHaveAttribute("data-index-segment", "legal");
  expect(within(group).getByRole("link", { name: "Lot Block" })).toHaveStyle({ textDecoration: "none" });
  fireEvent.click(within(group).getByRole("link", { name: "Lot Block" }));
  expect(onPageClick).toHaveBeenCalledWith(expect.objectContaining({ code: "legal-1", segment: "legal", page: "2" }));
  expect(within(group).queryByRole("button")).toBeNull();
  expect(onEditIndex).not.toHaveBeenCalled();
  expect(screen.getByRole("button", { name: "Copy value Parcel 42" })).toBeVisible();
  expect(screen.getByRole("button", { name: "Edit index" })).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Open legal view" }));
  expect(onLegalView).toHaveBeenCalledExactlyOnceWith();
});

it("adds and reprocesses only property from the merged header", () => {
  const onAddIndex = vi.fn();
  const onReprocess = vi.fn();
  render(<MetadataPanel {...props} openSegment="legal" onAddIndex={onAddIndex} onReprocess={onReprocess} />);
  fireEvent.click(screen.getByRole("button", { name: "Add Index" }));
  fireEvent.click(screen.getByRole("button", { name: "Reprocess" }));
  expect(onAddIndex).toHaveBeenCalledExactlyOnceWith("property");
  expect(onReprocess).toHaveBeenCalledExactlyOnceWith("property");
});

it.each([true, false])("blocks all merged content during property reprocess, busy=%s", (busy) => {
  const view = render(<MetadataPanel {...props} pendingSegments={new Map([["property", { busy, actions: busy ? null : <button>Retry change</button> }]])} />);
  expect(screen.getByText("Parcel 42").closest("[inert]")).not.toBeNull();
  expect(screen.getByText("Boundary description").closest("[inert]")).not.toBeNull();
  expect(screen.getByText("Property legal summary.").closest("[inert]")).not.toBeNull();
  if (busy) expect(screen.getByRole("progressbar", { name: "Reprocessing property" })).toBeVisible();
  else expect(screen.getByRole("button", { name: "Retry change" }).closest("[inert]")).toBeNull();
  view.rerender(<MetadataPanel {...props} pendingSegments={new Map()} />);
  expect(screen.getByText("Boundary description").closest("[inert]")).toBeNull();
});

it("shows one empty message and zero items when both sources have no rows", () => {
  const data = { indexes: [], legals: { summary: "Summary without elements." } };
  render(<MetadataPanel {...props} metadata={data} panelData={getPanelData(data)} />);
  expect(screen.getByRole("button", { name: "Property Info" }).parentElement?.querySelector(":scope > span")).toHaveTextContent("0");
  expect(screen.getByText("Summary without elements.")).toBeVisible();
  expect(screen.getAllByText("No property info found.")).toHaveLength(1);
  expect(screen.queryByText("No legal descriptions found.")).toBeNull();
});


it.each(["groups", "legalGroups", "LegalGroups", "items"])("hides the map for reference-only data from %s", (key) => {
  const onLegalView = vi.fn();
  const data: MetadataPayload = { ...metadata, legals: { [key]: [
    { type: "plat_reference", elements: [{ aspect: "plat_volume", value: "105" }] },
  ] } };
  render(<MetadataPanel {...props} metadata={data} panelData={getPanelData(data)} callbacks={{ onLegalView }} />);
  expect(screen.queryByRole("button", { name: "Open legal view" })).not.toBeInTheDocument();
  expect(onLegalView).not.toHaveBeenCalled();
});

it.each([
  { address: "123 Main St, Austin, TX 78701", groups: [], visible: true },
  { address: "123 Main St, Austin, TX 78701", groups: [{ type: "plat_reference", elements: [{ aspect: "plat_volume", value: "6" }] }], visible: true },
  { address: "", groups: [], visible: false },
  { address: "   ", groups: [], visible: false },
  { address: null, groups: [{ type: "lot_block", elements: [{ aspect: "lot", value: "8" }] }], visible: true },
  { address: null, groups: [{ type: "lot_block", elements: [{ aspect: "lot", value: " " }] }], visible: false },
  { address: null, groups: [{ type: "plss", elements: [{ aspect: "aliquots", value: "NE1/4 of Section 12" }] }], visible: true },
  { address: null, groups: [{ type: "metes_bounds", elements: [{ aspect: "bearings", value: "N" }, { aspect: "distances", value: "100 ft" }] }], visible: true },
  { address: null, groups: [{ type: "plss", elements: [{ value: " " }] }], visible: false },
  { address: null, groups: [{ type: "metes_bounds", elements: [] }], visible: false },
])("offers one map action for available property data: %j", ({ address, groups, visible }) => {
  const onLegalView = vi.fn();
  const onAddressClick = vi.fn();
  const data: MetadataPayload = { indexes: address === null ? [] : [{ code: "address", aspect: "property_address", segment: "property", label: "Property Address", page_number: "1", value: address }], legals: { groups } };
  render(<MetadataPanel {...props} metadata={data} panelData={getPanelData(data)} sections={{ ...props.sections, showEmpty: true }} callbacks={{ onLegalView, onAddressClick }} />);
  const button = screen.queryByRole("button", { name: "Open legal view" });
  expect(Boolean(button)).toBe(visible);
  if (button) {
    expect(button).toHaveTextContent("Show Map");
    fireEvent.click(button);
    expect(onLegalView).toHaveBeenCalledExactlyOnceWith();
  }
  expect(screen.queryByRole("button", { name: /^Open address/ })).not.toBeInTheDocument();
  expect(onAddressClick).not.toHaveBeenCalled();
});

it("opens the available data for an incomplete legal description", () => {
  const data: MetadataPayload = { ...metadata, legals: { summary: "Metes and bounds.", groups: [
    { type: "metes_bounds", elements: [{ aspect: "description", value: "A tract." }] },
  ] } };
  const onLegalView = vi.fn();
  render(<MetadataPanel {...props} metadata={data} panelData={getPanelData(data)} callbacks={{ onLegalView }} />);
  fireEvent.click(screen.getByRole("button", { name: "Open legal view" }));
  expect(onLegalView).toHaveBeenCalledExactlyOnceWith();
  expect(screen.getByText("A tract.")).toBeVisible();
});

it.each(["groups", "legalGroups", "LegalGroups", "items"] as const)("enables both schematic group types from %s while retaining legal visibility gates", key => {
  for (const type of ["plss", "metes_bounds"]) {
    const data: MetadataPayload = { indexes: [], legals: { [key]: [{ type, elements: type === "plss" ? [{ aspect: "aliquots", value: "NE1/4 of Section 12" }] : [{ aspect: "bearings", value: "N" }, { aspect: "distances", value: "100 ft" }] }] } };
    const onLegalView = vi.fn();
    const view = render(<MetadataPanel {...props} metadata={data} panelData={getPanelData(data)} callbacks={{ onLegalView }} />);
    fireEvent.click(screen.getByRole("button", { name: "Open legal view" }));
    expect(onLegalView).toHaveBeenCalledExactlyOnceWith();
    view.rerender(<MetadataPanel {...props} metadata={data} panelData={getPanelData(data)} sections={{ ...props.sections, hiddenSegments: new Set(["legal"]) }} />);
    expect(screen.queryByRole("button", { name: "Open legal view" })).not.toBeInTheDocument();
    view.rerender(<MetadataPanel {...props} metadata={data} panelData={getPanelData(data)} choices={[{ service: "LegalEnrichment", level: 0 }]} />);
    expect(screen.queryByRole("button", { name: "Open legal view" })).not.toBeInTheDocument();
    view.unmount();
  }
});
