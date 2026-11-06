import { fireEvent, render, screen, within } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { getPanelData, indexSegments, type MetadataIndex, type MetadataPayload } from "aurora-core";
import { MetadataPanel, type MetadataPanelProps } from "../component/MetadataPanel";

const segments = { ...indexSegments, TITLE: "title", FEE: "fee", FUND: "fund", FEEFACTOR: "factor" };
function index(code: string, segment: string, page?: string | number): MetadataIndex {
  return { code, segment, page, label: code, value: `${code} value`, ambiguous: "NO" };
}
function panel(metadata: MetadataPayload, openSegment: string, overrides: Partial<MetadataPanelProps> = {}) {
  const props: MetadataPanelProps = {
    metadata, panelData: getPanelData(metadata), openSegment, segments, session: "group-session",
    actions: { confirm: true, drop: true, reprocess: true }, callbacks: {}, choices: [],
    confirmedCodes: new Set(), removedCodes: new Set(), selectedIndex: null,
    sections: { filterByChoices: false, hiddenSegments: new Set(), showEmpty: false },
    showContext: true, status: "success", shortcuts: null, setSectionOpen: vi.fn(), ...overrides,
  };
  const view = render(<MetadataPanel {...props} />);
  return { ...view, props };
}

it.each(["reference", "property", "monetary", "transaction", "vital", "judgment"])("groups %s by page name without changing row order inside a page", segment => {
  panel({ indexes: [index("first", segment, "Exhibit-A"), index("second", segment, 2), index("third", segment, "Exhibit-A"), index("missing", segment), { ...index("number", segment), page_number: "2" }] }, segment);
  expect(screen.getAllByRole("heading", { level: 4 }).map(node => node.textContent)).toEqual(["Page Exhibit-A", "Page 2", "Page not specified"]);
  expect(within(screen.getByRole("group", { name: "Page Exhibit-A" })).getAllByRole("article").map(node => node.dataset.indexCode)).toEqual(["first", "third"]);
  expect(within(screen.getByRole("group", { name: "Page 2" })).getAllByRole("article").map(node => node.dataset.indexCode)).toEqual(["second", "number"]);
  expect(screen.queryByRole("heading", { level: 3 })).toBeNull();
});

it("shows the enriched party once when its code matches an extracted party and counts it once", () => {
  const raw = { ...index("shared", "party", "1"), ambiguous: "YES" };
  const side = { ...raw, value: "Enriched name", aspect: "person, Direct", ambiguous: "NO" };
  const onEditIndex = vi.fn();
  const onPageClick = vi.fn();
  const { container } = panel({ indexes: [raw], parties: { summary: "Party overview", indexes: [side] } }, "party", { onEditIndex, callbacks: { onPageClick } });
  expect(screen.queryByRole("heading", { level: 3 })).toBeNull();
  expect(screen.getAllByRole("heading", { level: 4 }).map(node => node.textContent)).toEqual(["Page 1"]);
  const rows = screen.getAllByRole("article");
  expect(rows).toHaveLength(1);
  expect(rows[0]).toHaveTextContent(side.value);
  expect(rows[0]).not.toHaveTextContent(raw.value!);
  expect(screen.getByText("Party overview").compareDocumentPosition(rows[0]) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(within(container.querySelector("header")!).getAllByRole("definition").map(node => node.textContent)).toEqual(["1", "0"]);
  expect(screen.getByRole("button", { name: "Parties(Party Clause)" }).parentElement?.lastElementChild).toHaveTextContent("1");
  fireEvent.click(within(rows[0]).getByRole("button", { name: "Edit index" }));
  expect(onEditIndex).toHaveBeenCalledExactlyOnceWith(side, "party", expect.any(HTMLButtonElement));
  fireEvent.click(within(rows[0]).getByRole("link", { name: side.value! }));
  expect(onPageClick).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ code: side.code, segment: "party", page: "1", value: side.value }));
});

it.each([
  ["party", "Parties(Party Clause)"], ["reference", "References(Recital)"],
  ["property", "Property Info"], ["monetary", "Monetary"],
  ["acknowledgment", "Acknowledgment"], ["transaction", "Transactional"],
  ["vital", "Vital"], ["judgment", "Judgment"], ["endorsement", "Endorsements"],
])("shows and counts one index per code within %s while retaining equal values with distinct codes", (segment, title) => {
  const first = index("first", segment, "1");
  const items = [first, { ...first, page: "2", value: "Duplicate" }, { ...first, code: "second" }];
  const metadata = { indexes: items };
  const snapshot = JSON.stringify(metadata);
  const { container } = panel(metadata, segment);
  expect(screen.getAllByRole("article").map(row => row.dataset.indexCode)).toEqual(["first", "second"]);
  expect(screen.queryByText("Duplicate")).toBeNull();
  expect(screen.getByRole("button", { name: title }).parentElement?.lastElementChild).toHaveTextContent("2");
  expect(within(container.querySelector("header")!).getAllByRole("definition").map(node => node.textContent)).toEqual(["2", "0"]);
  expect(JSON.stringify(metadata)).toBe(snapshot);
});

it.each(["enriched", "both"])("deduplicates repeated codes in %s party collections and retains unmatched extracted parties", collection => {
  const side = { ...index("shared", "party", "1"), value: "Enriched name" };
  const raw = { ...side, value: "Extracted name" };
  const metadata = {
    indexes: [index("raw", "party", "2"), ...(collection === "both" ? [raw, raw] : [])],
    parties: { summary: "Overview", indexes: [side, { ...side, value: "Duplicate side" }, index("other", "party", "1")] },
  };
  const { container } = panel(metadata, "party");
  expect(screen.getAllByRole("article").map(row => row.dataset.indexCode)).toEqual(["shared", "other", "raw"]);
  expect(screen.queryByText("Extracted name")).toBeNull();
  expect(screen.queryByText("Duplicate side")).toBeNull();
  expect(within(container.querySelector("header")!).getAllByRole("definition").map(node => node.textContent)).toEqual(["3", "0"]);
});

it("deduplicates confidential and execution indexes without changing their grouping", () => {
  const secret = index("secret", "secrets", "1");
  const execution = index("execution", "execution", "2");
  const metadata = { secrets: [secret, secret], execution: { summary: null, indexes: [execution, execution] } };
  const view = panel(metadata, "secrets");
  expect(screen.getAllByRole("article").map(row => row.dataset.indexCode)).toEqual(["secret"]);
  expect(screen.getByRole("button", { name: "Confidential" }).parentElement?.lastElementChild).toHaveTextContent("1");
  view.rerender(<MetadataPanel {...view.props} openSegment="acknowledgment" />);
  expect(screen.getAllByRole("article").map(row => row.dataset.indexCode)).toEqual(["execution"]);
  expect(screen.queryByRole("heading", { level: 4 })).toBeNull();
  expect(screen.getByRole("button", { name: "Acknowledgment" }).parentElement?.lastElementChild).toHaveTextContent("1");
  expect(within(view.container.querySelector("header")!).getAllByRole("definition").map(node => node.textContent)).toEqual(["1", "0"]);
});

it("keeps the enriched row selected and pending, then updates its value and counts after refresh", () => {
  const raw = index("shared", "party", "1");
  const side = { ...raw, value: "Enriched name", ambiguous: "YES" };
  const metadata = { indexes: [raw], parties: { summary: null, indexes: [side] } };
  const onEditIndex = vi.fn();
  const view = panel(metadata, "party", {
    selectedIndex: { code: "shared", segment: "party" }, onEditIndex,
    pendingChanges: new Map([["shared", { kind: "update", busy: true, actions: null }]]),
  });
  expect(screen.getAllByRole("article")).toHaveLength(1);
  expect(screen.getByRole("article")).toHaveAttribute("data-active", "true");
  expect(screen.getByRole("article")).toHaveAttribute("aria-disabled", "true");
  const refreshed = { indexes: [raw, raw], parties: { summary: null, indexes: [{ ...side, value: "Updated name", ambiguous: "NO" }] } };
  view.rerender(<MetadataPanel {...view.props} pendingChanges={undefined} metadata={refreshed} panelData={getPanelData(refreshed)} />);
  expect(screen.getAllByRole("article")).toHaveLength(1);
  expect(screen.getByRole("article")).toHaveTextContent("Updated name");
  fireEvent.click(screen.getByRole("button", { name: "Edit index" }));
  expect(onEditIndex).toHaveBeenCalledExactlyOnceWith(refreshed.parties.indexes[0], "party", expect.any(HTMLButtonElement));
  expect(within(view.container.querySelector("header")!).getAllByRole("definition").map(node => node.textContent)).toEqual(["1", "0"]);
});

it.each(["sides", "parties", "both", "empty"])("retains party grouping and empty behavior without subgroup titles for %s", collection => {
  const side = index("side", "party", "2");
  const raw = index("raw", "party", "Exhibit-A");
  const metadata: MetadataPayload = {
    indexes: collection === "parties" || collection === "both" ? [raw] : [],
    parties: { summary: null, indexes: collection === "sides" || collection === "both" ? [side] : [] },
  };
  const view = panel(metadata, "party");
  expect(screen.queryByRole("heading", { level: 3 })).toBeNull();
  expect(screen.queryAllByRole("heading", { level: 4 }).map(node => node.textContent)).toEqual(
    collection === "both" ? ["Page 2", "Page Exhibit-A"] : collection === "sides" ? ["Page 2"] : collection === "parties" ? ["Page Exhibit-A"] : [],
  );
  expect(screen.queryAllByRole("article").map(node => node.dataset.indexCode)).toEqual(
    collection === "both" ? ["side", "raw"] : collection === "sides" ? ["side"] : collection === "parties" ? ["raw"] : [],
  );
  expect(screen.queryAllByText("No parties found.")).toHaveLength(collection === "empty" ? 1 : 0);
  const refreshed = { indexes: [raw], parties: { summary: null, indexes: [side] } };
  view.rerender(<MetadataPanel {...view.props} metadata={refreshed} panelData={getPanelData(refreshed)} />);
  expect(screen.queryByRole("heading", { level: 3 })).toBeNull();
  expect(screen.getAllByRole("article").map(node => node.dataset.indexCode)).toEqual(["side", "raw"]);
});

it("retains extracted parties when the enriched collection is empty", () => {
  panel({ indexes: [index("raw", "party", "1")], parties: { summary: null, indexes: [] } }, "party");
  expect(screen.getByText("raw value")).toBeVisible();
  expect(screen.queryByText("No parties found.")).toBeNull();
  expect(screen.queryByRole("heading", { level: 3 })).toBeNull();
});

it("keeps property page headings and omits page headings before legal descriptions", () => {
  panel({ indexes: [index("parcel", "property", "3")], legals: { summary: "Legal overview", groups: [
    { code: "legal-a", page: "Exhibit-A", type: "lot_block", elements: [{ aspect: "lot", value: "12" }] },
    { code: "legal-b", type: "lot_block", elements: [{ aspect: "lot", value: "13" }] },
  ] } }, "property");
  expect(screen.queryByRole("heading", { level: 3 })).toBeNull();
  expect(screen.getAllByRole("heading", { level: 4 }).map(node => node.textContent)).toEqual(["Page 3"]);
  expect(screen.getByText("Legal overview").compareDocumentPosition(screen.getAllByRole("article")[0]) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(screen.getAllByRole("article").map(node => node.dataset.indexCode)).toEqual(["parcel", "legal-a", "legal-b"]);
});

it("puts execution first without segment or execution-page headings and retains acknowledgment page headings", () => {
  panel({ indexes: [index("notary", "acknowledgment", "1")], execution: { summary: "Execution overview", indexes: [index("seal", "execution", "2"), index("signature", "execution", "1")] } }, "acknowledgment");
  expect(screen.queryByRole("heading", { level: 3 })).toBeNull();
  expect(screen.getAllByRole("heading", { level: 4 }).map(node => node.textContent)).toEqual(["Page 1"]);
  expect(screen.getAllByRole("article").map(node => node.dataset.indexCode)).toEqual(["seal", "signature", "notary"]);
  expect(screen.getByText("Execution overview").compareDocumentPosition(screen.getAllByRole("article")[0]) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
});

it.each(["property_address", "mailback", "party_address", "property_location"])("removes the address map action for %s while retaining image preview and editing", aspect => {
  const item = { ...index("address", "transaction", "1"), aspect, value: "123 Main Street, Austin" };
  const onAddressClick = vi.fn();
  const onPageClick = vi.fn();
  const onEditIndex = vi.fn();
  panel({ indexes: [item] }, "transaction", { callbacks: { onAddressClick, onPageClick }, onEditIndex });
  expect(screen.queryByRole("button", { name: /^Open address/ })).toBeNull();
  expect(screen.queryByText("Show map")).toBeNull();
  fireEvent.click(screen.getByRole("link", { name: item.value }));
  expect(onPageClick).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ code: item.code, value: item.value, page: "1" }));
  fireEvent.click(screen.getByRole("button", { name: "Edit index" }));
  expect(onEditIndex).toHaveBeenCalledExactlyOnceWith(item, "transaction", expect.any(HTMLButtonElement));
  expect(onAddressClick).not.toHaveBeenCalled();
});

it("groups confidential items while pages and titles remain ungrouped", () => {
  const metadata: MetadataPayload = { secrets: [index("secret", "secrets", "Exhibit-A")], heading: { class: "deed", title: "Deed", secondary_titles: ["Addendum"], summary: "Title overview" }, pages: {
    recordables: [{ code: "page", name: "1", class: "Title" }], nonrecordables: [{ code: "attachment", name: "Exhibit-A", class: "Exhibit" }],
  } };
  const view = panel(metadata, "secrets");
  expect(screen.getByRole("heading", { name: "Page Exhibit-A" })).toBeVisible();
  view.rerender(<MetadataPanel {...view.props} openSegment="page" />);
  expect(screen.queryByRole("group")).toBeNull();
  expect(screen.queryByRole("heading", { level: 4 })).toBeNull();
  expect(screen.getAllByRole("article").map(node => node.dataset.indexCode)).toEqual(["page", "attachment"]);
  view.rerender(<MetadataPanel {...view.props} openSegment="title" />);
  expect(screen.queryByRole("group")).toBeNull();
  expect(screen.queryByRole("heading", { level: 4 })).toBeNull();
  expect(screen.getAllByRole("article")).toHaveLength(2);
  expect(screen.getByText("Title overview").compareDocumentPosition(screen.getAllByRole("article")[0]) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(screen.getByText("Title overview").closest("[role=group]")).toBeNull();
});

it("preserves endorsement order across repeated page names without group headings", () => {
  const onEditIndex = vi.fn();
  const items = [index("first", "endorsement", "1"), index("second", "endorsement", "2"), index("third", "endorsement", "1")];
  panel({ indexes: items }, "endorsement", { onEditIndex });
  expect(screen.queryByRole("group")).toBeNull();
  expect(screen.queryByRole("heading", { level: 4 })).toBeNull();
  expect(screen.getAllByRole("article").map(node => node.dataset.indexCode)).toEqual(["first", "second", "third"]);
  fireEvent.click(within(screen.getAllByRole("article")[1]).getByRole("button", { name: "Edit index" }));
  expect(onEditIndex).toHaveBeenCalledExactlyOnceWith(items[1], "endorsement", expect.any(HTMLButtonElement));
});

it("preserves page order when an attachment repeats a recordable page name", () => {
  panel({ pages: { recordables: [{ code: "first", name: "1" }, { code: "second", name: "2" }], nonrecordables: [{ code: "third", name: "1" }] } }, "page");
  expect(screen.queryByRole("group")).toBeNull();
  expect(screen.getAllByRole("article").map(node => node.dataset.indexCode)).toEqual(["first", "second", "third"]);
});

it("omits removed rows and empty groups, updates grouping on refresh, and preserves selected actions", () => {
  const data = { indexes: [index("removed", "transaction", "1"), index("kept", "transaction", "2")] };
  const view = panel(data, "transaction", { removedCodes: new Set(["removed"]), selectedIndex: { code: "kept", segment: "transaction" } });
  expect(screen.queryByRole("heading", { name: "Page 1" })).toBeNull();
  expect(screen.getByRole("article")).toHaveAttribute("data-active", "true");
  const metadata = { indexes: [index("kept", "transaction", "Exhibit-A")] };
  view.rerender(<MetadataPanel {...view.props} metadata={metadata} panelData={getPanelData(metadata)} />);
  expect(screen.queryByRole("heading", { name: "Page 2" })).toBeNull();
  expect(screen.getByRole("heading", { name: "Page Exhibit-A" })).toBeVisible();
});
