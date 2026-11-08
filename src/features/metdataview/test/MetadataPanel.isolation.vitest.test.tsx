import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { getPanelData, indexSegments, type MetadataPayload } from "aurora-core";
import { MetadataPanel, type MetadataPanelProps } from "../component/MetadataPanel";

const metadata: MetadataPayload = {
  heading: { class: "deed", title: "Warranty Deed" },
  indexes: [{ code: "reference", segment: "reference", label: "Reference", value: "Book 42", page_number: "1" }],
  parties: { summary: null, indexes: [{ code: "party", segment: "party", label: "Grantor", value: "Alice" }] },
  pages: { recordables: [{ name: "1", code: "page", class: "Title" }] },
};
const props: MetadataPanelProps = {
  actions: { confirm: true, drop: true, reprocess: true }, callbacks: {}, choices: [],
  confirmedCodes: new Set(), removedCodes: new Set(), metadata, panelData: getPanelData(metadata),
  openSegment: "party", selectedIndex: null, sections: { filterByChoices: false, hiddenSegments: new Set(), showEmpty: false },
  showContext: true, session: "session", setSectionOpen: vi.fn(), shortcuts: null, status: "success",
  segments: { ...indexSegments, FEE: "fee", FEEFACTOR: "factor", FUND: "fund", TITLE: "title" },
};
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

it.each([
  ["Endorsements", "endorsements"], ["Parties(Party Clause)", "parties"], ["References(Recital)", "references"],
  ["Property Info", "properties"], ["Monetary", "monetarys"], ["Acknowledgment", "notary"],
  ["Transactional", "transactions"], ["Vital", "vitals"], ["Judgment", "judgments"],
])("contains %s projection failures before counts or rows are evaluated", (title, field) => {
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  const panelData = getPanelData(metadata);
  Object.defineProperty(panelData, field, { get() { throw new TypeError(`${field} failed`); } });
  render(<MetadataPanel {...props} panelData={panelData} />);
  expect(screen.getByRole("button", { name: `${title} error` })).toBeVisible();
  expect(screen.getByRole("region", { name: "Metadata accordion" })).toBeVisible();
});

it.each([[], [{ value: "Old party" }], { summary: "No indexes" }, { indexes: {} }].map(parties => [parties]))("contains incompatible Party data %j without restoring removed header badges", parties => {
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  const data = { ...metadata, parties } as unknown as MetadataPayload;
  const view = render(<MetadataPanel {...props} metadata={data} panelData={getPanelData(data)} />);
  expect(screen.getByRole("button", { name: "Parties(Party Clause) error" })).toBeVisible();
  for (const label of ["Indexes", "Unclear"]) expect(screen.queryByRole("button", { name: `${label} error` })).not.toBeInTheDocument();
  expect(screen.queryByText("No parties found.")).toBeNull();
  view.rerender(<MetadataPanel {...props} metadata={data} panelData={getPanelData(data)} openSegment="reference" />);
  expect(screen.getByText("Book 42")).toBeVisible();
  expect(screen.getByRole("button", { name: "Pages" })).toBeEnabled();
  fireEvent.focus(screen.getByRole("button", { name: "Parties(Party Clause) error" }));
});

it.each([
  ["Pages", "page", { pages: { recordables: {} } }],
  ["Titles", "title", { heading: { title: 42 } }],
  ["Confidential", "secrets", { secrets: {} }],
  ["Property Info", "property", { legals: { groups: {} } }],
  ["Acknowledgment", "acknowledgment", { execution: { indexes: {} } }],
] as const)("contains invalid %s processing while retaining valid Party rows", (title, segment, invalid) => {
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  const data = { ...metadata, ...invalid } as unknown as MetadataPayload;
  render(<MetadataPanel {...props} metadata={data} panelData={getPanelData(data)} openSegment={segment} />);
  expect(screen.getByRole("button", { name: `${title} error` })).toBeVisible();
  expect(screen.getByRole("button", { name: "Parties(Party Clause)" })).toBeEnabled();
});

it("recovers failed segment counts and rows after refresh", () => {
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  const data = { ...metadata, parties: [] } as unknown as MetadataPayload;
  const view = render(<MetadataPanel {...props} metadata={data} panelData={getPanelData(data)} />);
  expect(screen.getByRole("button", { name: "Parties(Party Clause) error" })).toBeVisible();
  view.rerender(<MetadataPanel {...props} />);
  expect(screen.queryByRole("button", { name: /error$/ })).toBeNull();
  expect(screen.getByText("Alice")).toBeVisible();
  expect(within(view.container.querySelector("header")!).queryAllByRole("definition")).toHaveLength(0);
});

it("keeps hidden and disabled malformed segments from breaking visible content", () => {
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  const data = { ...metadata, parties: [] } as unknown as MetadataPayload;
  render(<MetadataPanel {...props} metadata={data} panelData={getPanelData(data)} openSegment="reference"
    sections={{ ...props.sections, hiddenSegments: new Set(["party"]) }} />);
  expect(screen.getByText("Book 42")).toBeVisible();
  expect(screen.queryByRole("button", { name: "Parties(Party Clause)" })).toBeNull();
});

it("contains simultaneous failures and shows their errors on keyboard focus", async () => {
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  const data = { ...metadata, parties: [], pages: { recordables: {} } } as unknown as MetadataPayload;
  render(<MetadataPanel {...props} metadata={data} panelData={getPanelData(data)} openSegment="reference" />);
  expect(screen.getByText("Book 42")).toBeVisible();
  expect(screen.getByRole("button", { name: "Pages error" })).toBeVisible();
  fireEvent.focus(screen.getByRole("button", { name: "Parties(Party Clause) error" }));
  expect(await screen.findByRole("tooltip")).not.toBeEmptyDOMElement();
});

it("retains title text when malformed Pages prevent resolving title links", () => {
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  const data = { ...metadata, pages: { recordables: {} } } as unknown as MetadataPayload;
  render(<MetadataPanel {...props} metadata={data} panelData={getPanelData(data)} openSegment="title" callbacks={{ onPageClick: vi.fn() }} />);
  expect(screen.getByText("Warranty Deed")).toBeVisible();
  expect(screen.getByRole("button", { name: "Pages error" })).toBeVisible();
  expect(screen.queryByRole("button", { name: "Titles error" })).toBeNull();
});
