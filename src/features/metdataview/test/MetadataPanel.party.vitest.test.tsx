import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { getPanelData, type MetadataPayload } from "aurora-core";
import { MetadataPanel, type MetadataPanelProps } from "../component/MetadataPanel";

const party = { code: "party-1", segment: "party", aspect: "person, Direct", label: "assignor", value: "John Smith", ambiguous: "YES" };
const metadata: MetadataPayload = { heading: { title: "Assignment" }, indexes: [], parties: { indexes: [party] } };
const props: MetadataPanelProps = {
  actions: { confirm: true, drop: true, reprocess: true }, callbacks: {},
  choices: [{ service: "PartyClauseIndexing", level: 1 }, { service: "PartyEnrichment", level: 1 }],
  confirmedCodes: new Set(), removedCodes: new Set(), metadata, panelData: getPanelData(metadata),
  openSegment: "party", selectedIndex: null,
  sections: { filterByChoices: true, hiddenSegments: new Set(), showEmpty: false },
  showContext: true, session: "session-1", setSectionOpen: vi.fn(), shortcuts: null, status: "success",
  segments: { ACKNOWLEDGMENT: "acknowledgment", JUDGMENT: "judgment", ENDORSEMENT: "endorsement", FEE: "fee", FEEFACTOR: "factor", FUND: "fund", LEGAL: "legal", MONETARY: "monetary", PAGE: "page", PARTY: "party", PROPERTY: "property", REFERENCE: "reference", SECRETS: "secrets", TITLE: "title", TRANSACTION: "transaction", VITAL: "vital" },
};

it("renders party records with the existing counts and no summary paragraph", () => {
  const { container } = render(<MetadataPanel {...props} />);
  expect(screen.getByText(party.value)).toBeVisible();
  expect(screen.getByRole("button", { name: "Parties(Party Clause)" }).parentElement?.lastElementChild).toHaveTextContent("1");
  expect(within(container.querySelector("header")!).queryAllByRole("definition")).toHaveLength(0);
  expect(screen.getByRole("article")).toHaveAttribute("data-index-code", party.code);
  expect(screen.getByRole("article").parentElement?.querySelector("p")).toBeNull();
});

it.each([undefined, null])("preserves indexed party rows when the parties node is %j", parties => {
  const data = { indexes: [party], parties };
  render(<MetadataPanel {...props} metadata={data} panelData={getPanelData(data)} />);
  expect(screen.getByText(party.value)).toBeVisible();
});

it("refreshes party records when metadata changes", () => {
  const view = render(<MetadataPanel {...props} />);
  expect(screen.getByText(party.value)).toBeVisible();
  const updated = { ...metadata, parties: { indexes: [{ ...party, value: "John A Smith" }] } };
  view.rerender(<MetadataPanel {...props} metadata={updated} panelData={getPanelData(updated)} />);
  expect(screen.queryByText(party.value)).toBeNull();
  expect(screen.getByText("John A Smith")).toBeVisible();
});

it("keeps the empty-state message when there are no party rows", () => {
  const data = { ...metadata, parties: { indexes: [] } };
  render(<MetadataPanel {...props} metadata={data} panelData={getPanelData(data)} />);
  expect(screen.getByText("No parties found.")).toBeVisible();
  expect(screen.queryByRole("article")).toBeNull();
  expect(screen.getByRole("button", { name: "Parties(Party Clause)" }).parentElement?.lastElementChild).toHaveTextContent("0");
});

it("preserves party edit, confirm, drop and segment actions", async () => {
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
  fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
  expect(onReprocess).toHaveBeenCalledExactlyOnceWith("party");
});

it.each(["hidden", "disabled", "closed"])("does not expose records when the party segment is %s", state => {
  render(<MetadataPanel {...props}
    choices={state === "disabled" ? [] : props.choices}
    sections={{ ...props.sections, hiddenSegments: new Set(state === "hidden" ? ["party"] : []) }}
    openSegment={state === "closed" ? "page" : "party"} />);
  expect(screen.queryByText(party.value)).toBeNull();
});

it("keeps party records inside the existing inert content while reprocessing", () => {
  render(<MetadataPanel {...props} pendingSegments={new Map([["party", { busy: true, actions: null, label: "Reprocessing party" }]])} />);
  expect(screen.getByRole("article").closest("[inert]")).not.toBeNull();
  expect(screen.getByRole("progressbar", { name: "Reprocessing party" }).closest("[inert]")).toBeNull();
});
