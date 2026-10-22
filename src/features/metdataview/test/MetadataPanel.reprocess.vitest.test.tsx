import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { getPanelData } from "aurora-core";
import { MetadataPanel, type MetadataPanelProps } from "../component/MetadataPanel";

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
