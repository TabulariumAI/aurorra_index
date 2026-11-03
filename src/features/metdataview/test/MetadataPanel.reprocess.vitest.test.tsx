import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { getPanelData } from "aurora-core";
import { MetadataPanel, type MetadataPanelProps } from "../component/MetadataPanel";
import { IndexInput } from "../../../shared/component/IndexInput";

const metadata = {
  indexes: [{ code: "party-1", segment: "party", value: "Alice", page: "1", ambiguous: "YES" }],
};
const props: MetadataPanelProps = {
  actions: { confirm: true, drop: true, reprocess: true }, callbacks: {}, choices: [],
  confirmedCodes: new Set(), removedCodes: new Set(), metadata, panelData: getPanelData(metadata),
  openSegment: "party", selectedIndex: null, sections: { filterByChoices: false, hiddenSegments: new Set(), showEmpty: true },
  showContext: false, session: "session-1", setSectionOpen: vi.fn(), shortcuts: null, status: "success",
  segments: { ACKNOWLEDGMENT: "acknowledgment", JUDGMENT: "judgment", ENDORSEMENT: "endorsement", FEE: "fee", FEEFACTOR: "factor", FUND: "fund", LEGAL: "legal", MONETARY: "monetary", PAGE: "page", PARTY: "party", PROPERTY: "property", REFERENCE: "reference", SECRETS: "secrets", TITLE: "title", TRANSACTION: "transaction", VITAL: "vital" },
  onAddIndex: vi.fn(), onEditIndex: vi.fn(), onConfirm: vi.fn(), onDrop: vi.fn(), onReprocess: vi.fn(),
};

it.each([0, 1])("reprocesses acknowledgment without an extra approval control when enrichment choice is %s", level => {
  const onReprocess = vi.fn();
  render(<MetadataPanel {...props} choices={[{ service: "ExecutionEnrichment", level }]} openSegment="acknowledgment" onReprocess={onReprocess} />);
  expect(screen.queryByRole("checkbox", { name: "Acknowledgment Verification" })).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Reprocess" }));
  expect(onReprocess).toHaveBeenCalledExactlyOnceWith("acknowledgment");
});

it.each(["party", "property", "acknowledgment", "execution"])("uses the standard Enhancement control for %s Add/Edit", segment => {
  const onEnrichmentChange = vi.fn();
  render(<IndexInput value="" aspects={{}} segment={segment} selected={[]} onChange={vi.fn()} onSelect={vi.fn()} allowEnrichment={false} onEnrichmentChange={onEnrichmentChange} />);
  const checkbox = screen.getByRole("checkbox", { name: "Enhancement" });
  expect(checkbox).toBeEnabled();
  fireEvent.click(checkbox);
  expect(onEnrichmentChange).toHaveBeenCalledExactlyOnceWith(true);
});

it("displays execution results before acknowledgment indexes and preserves their segment for editing", () => {
  const summary = "Notary seal and John Smith's signature are visible. Mary Smith's signature is missing.";
  const data = { indexes: [{ code: "notary", segment: "acknowledgment", aspect: "notary_name", label: "Notary Name", value: "Jane Doe", page: "1" }], execution: { summary, indexes: [
    { code: "seal", segment: "execution", aspect: "notary_seal", label: "Jane Doe Seal", value: "Yes", source: "Jane Doe, Notary", explanation: "Visible seal", page: "1" },
    { code: "signed", segment: "execution", aspect: "signatory_signature", label: "John Smith Signature", value: "Yes", source: "J. Smith", explanation: "Visible signature", page: "1" },
    { code: "unsigned", segment: "execution", aspect: "signatory_signature", label: "Mary Smith Signature", value: "No", source: "", explanation: "Blank signature line", page: "1" },
  ] } };
  const onEditIndex = vi.fn();
  render(<MetadataPanel {...props} metadata={data} panelData={getPanelData(data)} openSegment="acknowledgment" onEditIndex={onEditIndex} />);
  expect(screen.getByRole("button", { name: /Acknowledgment/i })).toBeVisible();
  const paragraph = screen.getByText(summary);
  expect(paragraph.tagName).toBe("P");
  expect(paragraph.closest("article")).toBeNull();
  expect(paragraph.compareDocumentPosition(screen.getAllByRole("article")[0]) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(screen.getByText(/John Smith Signature/i)).toBeVisible();
  expect(screen.getByText(/Mary Smith Signature/i)).toBeVisible();
  expect(screen.getAllByRole("article").map(row => row.dataset.indexCode)).toEqual(["seal", "signed", "unsigned", "notary"]);
  const john = screen.getByText(/John Smith Signature/i).closest("article")!;
  fireEvent.click(within(john).getByRole("button", { name: "Edit index" }));
  expect(onEditIndex).toHaveBeenCalledWith(expect.objectContaining({ code: "signed" }), "execution", expect.any(HTMLButtonElement));
});

it("does not fabricate a summary for unverified execution indexes", () => {
  const data = { execution: { summary: null, indexes: [{ code: "seal", segment: "execution", aspect: "notary_seal", label: "Notary Seal", value: "No" }] } };
  render(<MetadataPanel {...props} metadata={data} panelData={getPanelData(data)} openSegment="acknowledgment" />);
  expect(screen.getByText("No")).toBeVisible();
  expect(screen.getAllByRole("article")).toHaveLength(1);
  expect(screen.getByRole("button", { name: "Acknowledgment" }).closest("section")?.querySelector("p")).toBeNull();
});

describe("Metadata segment progress", () => {
  it.each([metadata, { indexes: [] }])("blocks the complete segment, including empty content, while reprocessing", (data) => {
    const view = render(<MetadataPanel {...props} metadata={data} panelData={getPanelData(data)} pendingSegments={new Map([["party", { busy: true, actions: null }]])} />);
    const progress = screen.getByRole("progressbar", { name: "Reprocessing party" });
    const segment = progress.parentElement!;
    expect(segment).toHaveAttribute("aria-busy", "true");
    expect(progress.closest("[inert]")).toBeNull();
    expect(progress).not.toHaveAttribute("aria-valuenow");
    expect(progress.firstElementChild).toHaveClass("metadata-row-progress");
    const content = segment.querySelector("[inert]")!;
    expect(content).toContainElement(within(view.container).getByText("Parties(Party Clause)"));
    expect(content.querySelectorAll("button").length).toBeGreaterThan(1);
    expect(screen.getByRole("button", { name: "Pages" }).closest("[inert]")).toBeNull();
    view.rerender(<MetadataPanel {...props} metadata={data} panelData={getPanelData(data)} pendingSegments={new Map()} />);
    expect(screen.queryByRole("progressbar")).toBeNull();
    expect(screen.getByRole("button", { name: "Reprocess" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Add Index" }).closest("[inert]")).toBeNull();
  });

  it("keeps progress on each running segment when the displayed segment changes", () => {
    const view = render(<MetadataPanel {...props} pendingSegments={new Map(["party", "property"].map(segment => [segment, { busy: true, actions: null }]))} />);
    expect(screen.getAllByRole("progressbar")).toHaveLength(2);
    view.rerender(<MetadataPanel {...props} openSegment="property" pendingSegments={new Map([["party", { busy: true, actions: null }]])} />);
    expect(screen.getByRole("progressbar", { name: "Reprocessing party" })).toBeVisible();
    expect(screen.queryByRole("progressbar", { name: "Reprocessing property" })).toBeNull();
    expect(screen.getByRole("button", { name: "Reprocess" }).closest("[inert]")).toBeNull();
  });
});

it("keeps failed content inert while recovery remains interactive", () => {
  render(<MetadataPanel {...props} pendingSegments={new Map([["party", { busy: false, actions: <button>Retry change</button> }]])} />);
  expect(screen.queryByRole("progressbar")).toBeNull();
  expect(screen.getByRole("button", { name: "Add Index" }).closest("[inert]")).not.toBeNull();
  expect(screen.getByRole("button", { name: "Retry change" }).closest("[inert]")).toBeNull();
});

it("keeps the segment in the header and only the taxpayer label on the second descriptor line", () => {
  const data = { indexes: [{ code: "party-1", segment: "party", aspect: "person-indirect", label: "taxpayer", value: "Alice", page: "1" }] };
  render(<MetadataPanel {...props} metadata={data} panelData={getPanelData(data)} />);
  expect(screen.getByRole("button", { name: "Parties(Party Clause)" })).toBeVisible();
  const row = screen.getByRole("article");
  expect(within(row).getByText("Person").parentElement?.parentElement).toHaveTextContent("Person, Indirect");
  expect(within(row).getByText("Taxpayer").parentElement?.parentElement).toHaveTextContent(/^Taxpayer$/);
  expect(row).not.toHaveTextContent("Parties(Party Clause)");
});
