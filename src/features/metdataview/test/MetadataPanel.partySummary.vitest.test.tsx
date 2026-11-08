import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { getPanelData, metadataStyles, type MetadataPayload } from "aurora-core";
import { MetadataPanel, type MetadataPanelProps } from "../component/MetadataPanel";

const summary = "John Smith assigns the mortgage to ACME LLC.";
const party = { code: "party-1", segment: "party", aspect: "person, Direct", label: "assignor", value: "John Smith", ambiguous: "YES" };
const metadata: MetadataPayload = { heading: { title: "Assignment" }, indexes: [], parties: { summary, indexes: [party] } };
const props: MetadataPanelProps = {
  actions: { confirm: true, drop: true, reprocess: true }, callbacks: {},
  choices: [{ service: "PartyClauseIndexing", level: 1 }, { service: "PartyEnrichment", level: 1 }],
  confirmedCodes: new Set(), removedCodes: new Set(), metadata, panelData: getPanelData(metadata),
  openSegment: "party", selectedIndex: null,
  sections: { filterByChoices: true, hiddenSegments: new Set(), showEmpty: false },
  showContext: true, session: "session-1", setSectionOpen: vi.fn(), shortcuts: null, status: "success",
  segments: { ACKNOWLEDGMENT: "acknowledgment", JUDGMENT: "judgment", ENDORSEMENT: "endorsement", FEE: "fee", FEEFACTOR: "factor", FUND: "fund", LEGAL: "legal", MONETARY: "monetary", PAGE: "page", PARTY: "party", PROPERTY: "property", REFERENCE: "reference", SECRETS: "secrets", TITLE: "title", TRANSACTION: "transaction", VITAL: "vital" },
};

it("renders one summary paragraph before party rows using the shared summary style without changing counts", () => {
  const { container } = render(<MetadataPanel {...props} />);
  const paragraph = screen.getByText(summary);
  expect(screen.getAllByText(summary)).toHaveLength(1);
  expect(paragraph.tagName).toBe("P");
  expect(paragraph).toHaveStyle(metadataStyles.segmentSummary);
  expect(paragraph.closest("article")).toBeNull();
  expect(paragraph.compareDocumentPosition(screen.getByRole("article")) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(screen.getByRole("button", { name: "Parties(Party Clause)" }).parentElement?.lastElementChild).toHaveTextContent("1");
  expect(within(container.querySelector("header")!).queryAllByRole("definition")).toHaveLength(0);
  expect(screen.getByRole("article")).toHaveAttribute("data-index-code", party.code);
});

it.each([null, ""])("keeps party rows and omits the paragraph when summary is %j", value => {
  const data = { ...metadata, parties: { summary: value, indexes: [party] } };
  render(<MetadataPanel {...props} metadata={data} panelData={getPanelData(data)} />);
  expect(screen.getByText(party.value)).toBeVisible();
  expect(screen.getAllByRole("article")).toHaveLength(1);
  expect(screen.getByRole("button", { name: "Parties(Party Clause)" }).parentElement?.parentElement?.querySelector("p")).toBeNull();
});

it.each([undefined, null])("preserves indexed party rows when the parties node is %j", parties => {
  const data = { indexes: [party], parties };
  render(<MetadataPanel {...props} metadata={data} panelData={getPanelData(data)} />);
  expect(screen.getByText(party.value)).toBeVisible();
  expect(screen.queryByText(summary)).toBeNull();
});

it("replaces the summary on refresh and removes it when the refreshed summary is null", () => {
  const view = render(<MetadataPanel {...props} />);
  expect(screen.getByText(summary)).toBeVisible();
  const updated = { ...metadata, parties: { summary: "ACME LLC receives the assigned mortgage.", indexes: [party] } };
  view.rerender(<MetadataPanel {...props} metadata={updated} panelData={getPanelData(updated)} />);
  expect(screen.queryByText(summary)).toBeNull();
  expect(screen.getByText(updated.parties.summary)).toBeVisible();
  const cleared = { ...metadata, parties: { summary: null, indexes: [party] } };
  view.rerender(<MetadataPanel {...props} metadata={cleared} panelData={getPanelData(cleared)} />);
  expect(screen.queryByText(updated.parties.summary)).toBeNull();
  expect(screen.getByText(party.value)).toBeVisible();
});

it("keeps the supplied summary and empty-state message when there are no party rows", () => {
  const data = { ...metadata, parties: { summary, indexes: [] } };
  render(<MetadataPanel {...props} metadata={data} panelData={getPanelData(data)} />);
  expect(screen.getByText(summary)).toBeVisible();
  expect(screen.getByText("No parties found.")).toBeVisible();
  expect(screen.queryByRole("article")).toBeNull();
  expect(screen.getByRole("button", { name: "Parties(Party Clause)" }).parentElement?.lastElementChild).toHaveTextContent("0");
});

it("preserves party edit, confirm, drop and segment actions alongside the summary", async () => {
  const onEditIndex = vi.fn();
  const onConfirm = vi.fn();
  const onDrop = vi.fn();
  const onAddIndex = vi.fn();
  const onReprocess = vi.fn();
  render(<MetadataPanel {...props} onEditIndex={onEditIndex} onConfirm={onConfirm} onDrop={onDrop} onAddIndex={onAddIndex} onReprocess={onReprocess} />);
  const row = within(screen.getByRole("article"));
  fireEvent.click(row.getByRole("button", { name: "Edit index" }));
  expect(onEditIndex).toHaveBeenCalledExactlyOnceWith(party, "party", expect.any(HTMLButtonElement));
  fireEvent.click(row.getByRole("button", { name: "Confirm index and remove ambiguity" }));
  fireEvent.click(row.getByRole("button", { name: "Confirm" }));
  await waitFor(() => expect(onConfirm).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ code: party.code, segment: "party" })));
  fireEvent.click(row.getByRole("button", { name: "Delete index" }));
  fireEvent.click(row.getByRole("button", { name: "Confirm" }));
  await waitFor(() => expect(onDrop).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ code: party.code, segment: "party" })));
  fireEvent.click(screen.getByRole("button", { name: "Add Index" }));
  expect(onAddIndex).toHaveBeenCalledExactlyOnceWith("party", expect.any(HTMLButtonElement));
  fireEvent.click(screen.getByRole("button", { name: "Reprocess" }));
  expect(onReprocess).toHaveBeenCalledExactlyOnceWith("party");
  expect(screen.getByText(summary)).toBeVisible();
});

it.each(["hidden", "disabled", "closed"])("does not expose the summary when the party segment is %s", state => {
  render(<MetadataPanel {...props}
    choices={state === "disabled" ? [] : props.choices}
    sections={{ ...props.sections, hiddenSegments: new Set(state === "hidden" ? ["party"] : []) }}
    openSegment={state === "closed" ? "page" : "party"} />);
  expect(screen.queryByText(summary)).toBeNull();
  expect(screen.queryByText(party.value)).toBeNull();
});

it("keeps the summary inside the existing inert content while reprocessing", () => {
  render(<MetadataPanel {...props} pendingSegments={new Map([["party", { busy: true, actions: null }]])} />);
  expect(screen.getByText(summary).closest("[inert]")).not.toBeNull();
  expect(screen.getByRole("article").closest("[inert]")).not.toBeNull();
  expect(screen.getByRole("progressbar", { name: "Reprocessing party" }).closest("[inert]")).toBeNull();
});
