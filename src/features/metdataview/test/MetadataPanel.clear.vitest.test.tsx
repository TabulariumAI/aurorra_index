import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { getPanelData, indexSegments, type MetadataPayload } from "aurora-core";
import { MetadataPanel, type MetadataPanelProps } from "../component/MetadataPanel";

const props: MetadataPanelProps = {
  actions: { confirm: true, drop: true, reprocess: true }, callbacks: {}, choices: [],
  confirmedCodes: new Set(), removedCodes: new Set(), metadata: {}, panelData: getPanelData({}),
  openSegment: null, selectedIndex: null, sections: { filterByChoices: false, hiddenSegments: new Set(), showEmpty: false },
  showContext: false, session: "session", setSectionOpen: vi.fn(), shortcuts: null, status: "success",
  segments: { ...indexSegments, TITLE: "title", FEE: "fee", FEEFACTOR: "factor", FUND: "fund" },
};

afterEach(() => vi.restoreAllMocks());

it("scrolls overflowing section actions without starting a metadata operation", () => {
  vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(200);
  vi.spyOn(HTMLElement.prototype, "scrollWidth", "get").mockReturnValue(400);
  const onClear = vi.fn();
  render(<MetadataPanel {...props} openSegment="property" onClear={onClear} />);
  const button = screen.getByRole("button", { name: "Scroll section actions right" });
  const viewport = document.getElementById(button.getAttribute("aria-controls")!)!;
  const scrollBy = vi.fn();
  viewport.scrollBy = scrollBy;
  fireEvent.click(button);
  expect(scrollBy).toHaveBeenCalledExactlyOnceWith({ left: 200 });
  expect(onClear).not.toHaveBeenCalled();
  viewport.scrollLeft = 200;
  fireEvent.scroll(viewport);
  expect(button).toBeDisabled();
  viewport.scrollLeft = 0;
  fireEvent.scroll(viewport);
  expect(button).toBeEnabled();
});

it("omits the scroll control when section actions fit", () => {
  render(<MetadataPanel {...props} openSegment="property" onClear={vi.fn()} />);
  expect(screen.queryByRole("button", { name: "Scroll section actions right" })).toBeNull();
});

it.each(["endorsement", "party", "reference", "property", "monetary", "acknowledgment", "transaction", "vital", "judgment", "secrets"])(
  "confirms one section-level clear for %s", segment => {
    const metadata = { indexes: [{ code: "index", segment, aspect: "person", label: "Person", page_number: 1, value: "Value" }], secrets: [{ code: "secret", value: "Confidential" }] };
    const onClear = vi.fn();
    render(<MetadataPanel {...props} metadata={metadata} panelData={getPanelData(metadata)} openSegment={segment} onClear={onClear} />);
    fireEvent.click(screen.getByRole("button", { name: "Clear indexes" }));
    expect(onClear).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
    expect(onClear).toHaveBeenCalledExactlyOnceWith(segment);
  },
);

it.each(["page", "title"])("omits Clear indexes from %s", segment => {
  render(<MetadataPanel {...props} openSegment={segment} onClear={vi.fn()} />);
  expect(screen.queryByRole("button", { name: "Clear indexes" })).toBeNull();
});

it.each<{ segment: string; metadata: MetadataPayload }>([
  { segment: "property", metadata: { legals: { groups: [{ code: "legal", elements: [{ aspect: "lot", value: "1" }] }] } } },
  { segment: "acknowledgment", metadata: { execution: { indexes: [{ code: "signature", aspect: "signatory_signature", value: "Yes" }] } } },
])("enables $segment clearing when only its second segment has indexes", ({ segment, metadata }) => {
  render(<MetadataPanel {...props} metadata={metadata} panelData={getPanelData(metadata)} openSegment={segment} onClear={vi.fn()} />);
  expect(screen.getByRole("button", { name: "Clear indexes" })).toBeEnabled();
});

it("disables empty-section clearing and keeps populated sections inert during operations", () => {
  const view = render(<MetadataPanel {...props} openSegment="party" onClear={vi.fn()} />);
  expect(screen.getByRole("button", { name: "Clear indexes" })).toBeDisabled();
  const metadata = { indexes: [{ code: "party", segment: "party", aspect: "person", label: "Person", page_number: 1, value: "Alice" }] };
  view.rerender(<MetadataPanel {...props} metadata={metadata} panelData={getPanelData(metadata)} openSegment="party" onClear={vi.fn()}
    pendingSegments={new Map([["party", { busy: true, actions: null, label: "Clearing party" }]])} />);
  expect(screen.getByRole("progressbar", { name: "Clearing party" })).toBeVisible();
  expect(screen.getByRole("button", { name: "Clear indexes" }).closest("[inert]")).not.toBeNull();
  expect(screen.getByRole("button", { name: "Pages" }).closest("[inert]")).toBeNull();
});

it.each(["endorsement", "party", "reference", "property", "monetary", "acknowledgment", "transaction", "vital", "judgment", "secrets"])(
  "does not confirm or clear an empty %s section", segment => {
    const onClear = vi.fn();
    render(<MetadataPanel {...props} openSegment={segment} onClear={onClear} onReprocess={vi.fn()} />);
    const button = screen.getByRole("button", { name: "Clear indexes" });
    expect(button).toBeDisabled();
    expect(screen.getByRole("button", { name: "Reprocess" })).toBeEnabled();
    fireEvent.click(button);
    expect(screen.queryByRole("button", { name: "Confirm" })).toBeNull();
    expect(onClear).not.toHaveBeenCalled();
  },
);

it("disables clearing after the populated section becomes empty", () => {
  const metadata = { indexes: [{ code: "party", segment: "party", aspect: "person", label: "Person", page_number: 1, value: "Alice" }] };
  const view = render(<MetadataPanel {...props} metadata={metadata} panelData={getPanelData(metadata)} openSegment="party" onClear={vi.fn()} />);
  expect(screen.getByRole("button", { name: "Clear indexes" })).toBeEnabled();
  view.rerender(<MetadataPanel {...props} openSegment="party" onClear={vi.fn()} />);
  expect(screen.getByRole("button", { name: "Clear indexes" })).toBeDisabled();
});
