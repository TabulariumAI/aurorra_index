import * as Tooltip from "@radix-ui/react-tooltip";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterAll, afterEach, describe, expect, it, vi } from "vitest";
import { imageViewerStoreApi } from "../../imageviewer/store/imageViewerStore";
import { MetadataPanel } from "../component/MetadataPanel";
import { IndexValue, copyIndexValue } from "../component/MetadataRows";
import { getPanelData } from "../data/metadataData";
import type { MetdataSegmentValues, MetadataPayload } from "../type/metadataView.types";

const segments: MetdataSegmentValues = {
  ACKNOWLEDGMENT: "acknowledgment",
  COURT: "court",
  ENDORSEMENT: "endorsement",
  FEE: "fee",
  FEEFACTOR: "factor",
  FUND: "fund",
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

const panelDefaults = {
  actions: {
    confirm: true,
    drop: true,
    refine: true,
    reprocess: true,
  },
  batch: "Pending",
  sections: {
    filterByChoices: true,
    hiddenSegments: new Set<string>(),
    showEmpty: false,
  },
  shortcuts: null,
  status: "success" as const,
};

const longExplanation =
  "This explanation is intentionally long so the metadata row stays collapsed to a single line by default and only reveals the full text after the user expands it with the inline disclosure control. ".repeat(3);
const longQuote =
  "P:1. This quote is intentionally long so the metadata row keeps the source collapsed to a single line by default and only reveals the full quoted source after the user expands it with the inline disclosure control. ".repeat(3);
const longValue =
  "All that certain lot, tract or parcel of land being 1.89 acres in the Patrick O'Rourk Survey A-666 and being more particularly described by metes and bounds.";

const originalScrollWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "scrollWidth");
const originalClientWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "clientWidth");
const originalScrollHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "scrollHeight");
const originalClientHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "clientHeight");
const originalClipboard = Object.getOwnPropertyDescriptor(navigator, "clipboard");

Object.defineProperties(HTMLElement.prototype, {
  scrollWidth: {
    configurable: true,
    get(this: HTMLElement) {
      return (this.textContent?.length ?? 0) > 120 ? 240 : 80;
    },
  },
  clientWidth: {
    configurable: true,
    get() {
      return 100;
    },
  },
  scrollHeight: {
    configurable: true,
    get(this: HTMLElement) {
      return (this.textContent?.length ?? 0) > 120 ? 24 : 16;
    },
  },
  clientHeight: {
    configurable: true,
    get() {
      return 16;
    },
  },
});
afterAll(() => {
  if (originalScrollWidth) {
    Object.defineProperty(HTMLElement.prototype, "scrollWidth", originalScrollWidth);
  }
  if (originalClientWidth) {
    Object.defineProperty(HTMLElement.prototype, "clientWidth", originalClientWidth);
  }
  if (originalScrollHeight) {
    Object.defineProperty(HTMLElement.prototype, "scrollHeight", originalScrollHeight);
  }
  if (originalClientHeight) {
    Object.defineProperty(HTMLElement.prototype, "clientHeight", originalClientHeight);
  }
});
afterEach(() => {
  imageViewerStoreApi.getState().resetViewer();
  if (originalClipboard) {
    Object.defineProperty(navigator, "clipboard", originalClipboard);
  } else {
    Reflect.deleteProperty(navigator, "clipboard");
  }
  vi.clearAllMocks();
});

describe("metadata visual surface", () => {
  it("shows header actions only for the expanded action segment", () => {
    const metadata: MetadataPayload = {
      fees: [],
      funds: [],
      heading: { class: "deed", title: "Warranty Deed" },
      indexes: [
        { code: "party-1", label: "grantor", page: "1", page_number: "1", segment: "party", value: "Alice" },
        { code: "endorsement-1", label: "recording_date", page: "1", page_number: "1", segment: "endorsement", value: "May 28, 2025" },
      ],
      pages: { num_of_pages: 1, recordables: [{ code: "page-1", name: "1" }] },
      secrets: [],
    };
    const props = {
      ...panelDefaults,
      callbacks: { onEditPage: vi.fn() },
      choices: [
        { level: 1, service: "PartyClauseIndexing" },
        { level: 1, service: "EndorsementIndexing" },
      ],
      confirmedCodes: new Set<string>(),
      metadata,
      onConfirm: vi.fn(),
      onDrop: vi.fn(),
      onReprocess: vi.fn(),
      removedCodes: new Set<string>(),
      selectedIndex: null,
      segments,
      session: "session-1",
      setSectionOpen: vi.fn(),
      panelData: getPanelData(metadata),
    };
    const { rerender } = render(<MetadataPanel {...props} openSegment="party" />);
    const partyHeader = screen.getByRole("button", { name: /Parties\(Party Clause\)/i }).parentElement;
    const endorsementHeader = screen.getByRole("button", { name: "Record Endorsements" }).parentElement;

    expect(partyHeader?.querySelectorAll("button[aria-label]")).toHaveLength(2);
    expect(endorsementHeader?.querySelectorAll("button[aria-label]")).toHaveLength(0);

    rerender(<MetadataPanel {...props} openSegment="endorsement" />);

    expect(partyHeader?.querySelectorAll("button[aria-label]")).toHaveLength(0);
    expect(endorsementHeader?.querySelectorAll("button[aria-label]")).toHaveLength(2);
  });

  it("renders the package metadata surface with standard one-click index actions", async () => {
    const metadata: MetadataPayload = {
      fees: [],
      funds: [],
      heading: { class: "deed", title: "Warranty Deed" },
      indexes: [{ ambiguous: "YES", code: "idx-1", label: "grantor", page: "1", page_number: "1", segment: "party", value: "Alice" }],
      pages: { num_of_pages: 1, recordables: [{ code: "page-1", name: "1" }] },
      secrets: [],
    };
    const panelData = getPanelData(metadata);
    const onEditPage = vi.fn();
    const onConfirm = vi.fn();
    const onDrop = vi.fn();
    const onReprocess = vi.fn(async () => undefined);
    const setSectionOpen = vi.fn();

    const { container } = render(
      <MetadataPanel
        {...panelDefaults}
        callbacks={{ onEditPage }}
        batch="Property Intake"
        confirmedCodes={new Set()}
        choices={[{ level: 1, service: "PartyClauseIndexing" }]}
        metadata={metadata}
        onConfirm={onConfirm}
        onDrop={onDrop}
        onReprocess={onReprocess}
        openSegment="party"
        removedCodes={new Set()}
        selectedIndex={{ code: "idx-1", segment: "party" }}
        segments={segments}
        session="session-1"
        setSectionOpen={setSectionOpen}
        panelData={panelData}
      />,
    );

    await waitFor(() => expect(screen.getByText("Alice")).toBeInTheDocument());
    const popButton = screen.getByRole("button", { name: "Pop the index" });
    const copyButton = screen.getByRole("button", { name: "Copy value Alice" });
    const confirmButton = screen.getByRole("button", { name: "Confirm index and remove ambiguity" });
    expect(popButton).toHaveClass("metadata-row-action");
    expect(popButton).toHaveStyle({ color: "var(--primary)" });
    expect(popButton).toHaveStyle({ boxShadow: "none" });
    expect(copyButton).toHaveStyle({ color: "var(--primary)" });
    fireEvent.click(confirmButton);
    fireEvent.click(popButton);
    expect(onConfirm).toHaveBeenCalledOnce();
    expect(onDrop).toHaveBeenCalledOnce();
    expect(screen.queryByRole("button", { name: /^Confirm$/ })).not.toBeInTheDocument();
    expect(container.querySelector("[aria-label='Metadata']")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Deed" })).toBeInTheDocument();
    const header = screen.getByRole("heading", { level: 2, name: "Deed" }).closest("header");
    expect(header).toBeTruthy();
    if (header) {
      expect(header.parentElement).toHaveStyle({ display: "flex", flex: "1 1 auto", flexDirection: "column", minHeight: "0px", overflow: "hidden" });
      expect(header).toHaveStyle({ flex: "0 0 auto", position: "static" });
      expect(header).not.toHaveStyle({ borderLeft: "0.2rem solid #06afc1" });
      expect(header.children).toHaveLength(2);
      expect(header.firstElementChild).toBe(screen.getByRole("heading", { level: 2, name: "Deed" }));
      expect(header.lastElementChild).toHaveTextContent("Property Intake");
      expect(header.lastElementChild).toHaveTextContent("session-1");
      expect(header.nextElementSibling).toHaveStyle({ alignItems: "stretch", display: "flex", flex: "1 1 0", flexDirection: "column", minHeight: "0px", overflowX: "hidden", overflowY: "auto" });
    }

    expect(screen.getByText("Property Intake")).toHaveStyle({ fontWeight: "700" });
    expect(screen.getByText("session-1")).toHaveStyle({
      fontSize: "0.75rem",
      lineHeight: "1.35",
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    });
    const title = screen.getByRole("heading", { level: 2, name: "Deed" });
    expect(title).toHaveStyle({
      fontSize: "calc(var(--panel-title-size) * 1.15)",
      fontWeight: "var(--panel-title-weight)",
      letterSpacing: "var(--panel-title-tracking)",
      lineHeight: "var(--panel-title-line-height)",
    });
    const segmentButton = screen.getByRole("button", { name: /Parties\(Party Clause\)/i });
    const collapsedButton = screen.getByRole("button", { name: /Pages/i });
    const segmentHeader = segmentButton.parentElement;
    const collapsedHeader = collapsedButton.parentElement;
    expect(segmentHeader).toBeTruthy();
    if (segmentHeader) {
      expect(segmentHeader).toHaveStyle({
        alignItems: "center",
        display: "flex",
        gap: "0.65rem",
        minHeight: "2.85rem",
        padding: "0.424rem 0px 0.442rem",
      });
    }
    expect(segmentButton).toHaveStyle({
      alignSelf: "stretch",
      boxSizing: "border-box",
      flex: "1 1 auto",
      minWidth: "0px",
      padding: "0px",
    });
    const segmentTitleBox = segmentButton.firstElementChild as HTMLElement | null;
    expect(segmentTitleBox).toBeTruthy();
    if (segmentTitleBox) {
      expect(segmentTitleBox).toHaveStyle({ flex: "1 1 auto", minWidth: "0px" });
    }
    const segmentRoot = segmentHeader?.parentElement;
    expect(segmentRoot).toBeTruthy();
    if (segmentRoot) {
      expect(segmentRoot).toHaveStyle({
        margin: "0px",
        overflow: "hidden",
        width: "100%",
      });
    }
    const segmentCount = segmentHeader?.lastElementChild as HTMLElement | null;
    expect(segmentCount).toBeTruthy();
    const collapsedCount = collapsedHeader?.lastElementChild as HTMLElement | null;
    expect(collapsedCount).toBeTruthy();
    expect(collapsedHeader?.querySelectorAll("button[aria-label]")).toHaveLength(0);
    const selectedRow = container.querySelector("[data-index-code='idx-1']");
    expect(selectedRow).toHaveAttribute("data-active", "true");
    fireEvent.mouseEnter(collapsedButton);
    fireEvent.mouseLeave(collapsedButton);
    fireEvent.mouseEnter(segmentButton);
    fireEvent.mouseLeave(segmentButton);
    expect(screen.queryByText("▾")).not.toBeInTheDocument();
    expect(screen.queryByText("▸")).not.toBeInTheDocument();
    expect(screen.getByText("Alice")).toHaveStyle({ fontWeight: "700", textTransform: "none" });
    const reprocessButton = screen.getByRole("button", { name: "Reprocess" });
    const chatButton = screen.getByRole("button", { name: "Open AI chat" });
    expect(reprocessButton).toHaveStyle({
      background: "transparent",
      boxShadow: "none",
      color: "var(--primary)",
      height: "2.75rem",
    });
    expect(reprocessButton).toHaveTextContent("Reprocess");
    expect(reprocessButton.querySelector("svg")).toBeNull();
    expect(chatButton).toHaveStyle({
      background: "transparent",
      boxShadow: "none",
      color: "var(--primary)",
      height: "2.75rem",
    });
    expect(chatButton).toHaveTextContent("AI chat");
    expect(chatButton.querySelector("svg")).toBeNull();
    expect(screen.queryByText("|")).not.toBeInTheDocument();
    const actionGroup = reprocessButton.parentElement;
    expect(actionGroup).toBeTruthy();
    expect(actionGroup?.parentElement).toBe(segmentHeader);
    expect(segmentButton).not.toContainElement(reprocessButton);
    expect(actionGroup?.nextElementSibling).toBe(segmentCount);
    const footer = document.querySelector<HTMLElement>("[data-metadata-footer]");
    expect(footer).toBeTruthy();
    if (footer) {
      expect(footer).toHaveStyle({ flex: "0 0 0", height: "0px", overflow: "hidden" });
      expect(footer).toBeEmptyDOMElement();
    }
    const shell = segmentHeader?.nextElementSibling as HTMLElement | undefined;
    expect(shell).toBeTruthy();
    if (shell) {
      expect(shell).toHaveStyle({ padding: "0px" });
      expect(shell.children).toHaveLength(1);
      const content = shell.children[0] as HTMLElement | undefined;
      expect(content).toBeTruthy();
      if (content) {
        expect(content).toHaveStyle({ padding: "0.72rem 0px 0.82rem" });
        expect(content).not.toHaveStyle({ borderLeft: "1px solid #d9e1ea" });
      }
    }
    fireEvent.click(segmentButton);
    expect(setSectionOpen).toHaveBeenCalledWith("party", false);
    setSectionOpen.mockClear();
    if (segmentTitleBox) {
      expect(segmentTitleBox).toHaveStyle({ flex: "1 1 auto", minWidth: "0px" });
    }
    expect(screen.queryByRole("button", { name: /refresh/i })).not.toBeInTheDocument();
    expect(onReprocess).not.toHaveBeenCalled();
    expect(onEditPage).not.toHaveBeenCalled();

    fireEvent.click(reprocessButton);
    await waitFor(() => expect(onReprocess).toHaveBeenCalledWith("party"));
    fireEvent.click(chatButton);
    expect(setSectionOpen).not.toHaveBeenCalled();
    expect(onEditPage).toHaveBeenCalledWith({
      code: "",
      page: 0,
      segment: "party",
      session: "session-1",
      type: "segment",
    });
  });

  it("collapses explanation rows to one line and expands inline", async () => {
    const metadata: MetadataPayload = {
      fees: [],
      funds: [],
      heading: { class: "deed", title: "Warranty Deed" },
      indexes: [{
        code: "idx-1",
        explanation: longExplanation,
        label: "grantor",
        page: "1",
        page_number: "1",
        segment: "party",
        source: longQuote,
        value: "Alice",
      }],
      pages: { num_of_pages: 1, recordables: [{ code: "page-1", name: "1" }] },
      secrets: [],
    };

    render(
      <MetadataPanel
        {...panelDefaults}
        callbacks={{}}
        confirmedCodes={new Set()}
        choices={[{ level: 1, service: "PartyClauseIndexing" }]}
        metadata={metadata}
        onConfirm={vi.fn()}
        onDrop={vi.fn()}
        onReprocess={vi.fn()}
        openSegment="party"
        removedCodes={new Set()}
        selectedIndex={null}
        segments={segments}
        session="session-party-explanation"
        setSectionOpen={vi.fn()}
        panelData={getPanelData(metadata)}
      />,
    );

    await waitFor(() => expect(screen.getByText("Alice")).toBeInTheDocument());
    const explanation = screen.getAllByText(/This explanation is intentionally long/i).find((node) => node.getAttribute("aria-hidden") !== "true") as HTMLElement;
    const explanationLabel = screen.getAllByText("Explanation:").find((node) => node.closest("[aria-hidden='true']") === null) as HTMLElement;
    const expandButton = screen.getByRole("button", { name: "Expand explanation" });
    const quote = screen.getAllByText(/full quoted source/i).find((node) => node.getAttribute("aria-hidden") !== "true") as HTMLElement;
    const quoteLabel = screen.getAllByText("Quote:").find((node) => node.closest("[aria-hidden='true']") === null) as HTMLElement;
    const quoteButton = screen.getByRole("button", { name: "Expand quote" });
    const row = screen.getByText("Alice").closest("article");

    expect(explanationLabel.parentElement).toBe(explanation);
    expect(quoteLabel.parentElement).toBe(quote);
    expect(row).toHaveStyle({ boxShadow: "none" });
    expect(expandButton).toHaveAttribute("aria-expanded", "false");
    expect(expandButton.textContent).toBe("");
    expect(expandButton.querySelector("svg rect")).toBeInTheDocument();
    expect(expandButton.querySelectorAll("svg path")).toHaveLength(2);
    expect(expandButton).toHaveStyle({ alignItems: "flex-start", boxShadow: "none", color: "var(--title-ink)", height: "2.75rem", width: "2.75rem" });
    expect(explanation.parentElement).toHaveStyle({ minHeight: "1.5rem" });
    fireEvent.focus(expandButton);
    expect(expandButton).toHaveStyle({
      background: "var(--accent-surface)",
      outline: "2px solid var(--primary)",
    });
    fireEvent.blur(expandButton);
    expect(explanation).toHaveStyle({
      display: "block",
      overflow: "hidden",
      paddingRight: "1.75rem",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    });
    expect(quoteButton).toHaveAttribute("aria-expanded", "false");
    expect(quoteButton.textContent).toBe("");
    expect(quoteButton.querySelector("svg rect")).toBeInTheDocument();
    expect(quoteButton.querySelectorAll("svg path")).toHaveLength(2);
    expect(quoteButton).toHaveStyle({ alignItems: "flex-start", boxShadow: "none", color: "var(--title-ink)", height: "2.75rem", width: "2.75rem" });
    expect(quote.parentElement).toHaveStyle({ minHeight: "1.5rem" });
    expect(quote).toHaveStyle({
      display: "block",
      overflow: "hidden",
      paddingRight: "1.75rem",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    });

    fireEvent.click(expandButton);

    expect(await screen.findByRole("button", { name: "Collapse explanation" })).toBeInTheDocument();
    const collapseButton = screen.getByRole("button", { name: "Collapse explanation" });
    expect(collapseButton.textContent).toBe("");
    expect(collapseButton.querySelector("svg rect")).toBeInTheDocument();
    expect(collapseButton.querySelectorAll("svg path")).toHaveLength(1);
    expect(explanation).toHaveStyle({
      overflow: "visible",
      textOverflow: "clip",
      whiteSpace: "normal",
    });

    fireEvent.click(quoteButton);

    expect(await screen.findByRole("button", { name: "Collapse quote" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Collapse quote" }).textContent).toBe("");
    expect(quote).toHaveStyle({
      overflow: "visible",
      textOverflow: "clip",
      whiteSpace: "normal",
    });

    fireEvent.click(screen.getByRole("button", { name: "Collapse explanation" }));
    expect(screen.getByRole("button", { name: "Expand explanation" })).toBeInTheDocument();
  });

  it("collapses every overflowing index value and keeps short values without disclosure", async () => {
    const onClick = vi.fn();
    const view = render(
      <Tooltip.Provider>
        <IndexValue onClick={onClick} value={longValue} />
      </Tooltip.Provider>,
    );
    const value = screen.getByRole("link", { name: longValue });
    const expandButton = await screen.findByRole("button", { name: "Expand index value" });

    expect(expandButton).toHaveAttribute("aria-expanded", "false");
    expect(expandButton.textContent).toBe("");
    expect(expandButton.querySelector("svg rect")).toBeInTheDocument();
    expect(expandButton.querySelectorAll("svg path")).toHaveLength(2);
    expect(expandButton).toHaveStyle({ alignItems: "flex-start", height: "2.75rem", width: "2.75rem" });
    expect(value).toHaveStyle({ minHeight: "1.5rem" });
    expect(value).toHaveStyle({
      overflow: "hidden",
      paddingRight: "1.75rem",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    });

    fireEvent.click(value);
    expect(onClick).toHaveBeenCalledTimes(1);
    fireEvent.click(expandButton);

    const collapseButton = screen.getByRole("button", { name: "Collapse index value" });
    expect(collapseButton.textContent).toBe("");
    expect(collapseButton.querySelector("svg rect")).toBeInTheDocument();
    expect(collapseButton.querySelectorAll("svg path")).toHaveLength(1);
    expect(value).toHaveStyle({
      overflow: "visible",
      textOverflow: "clip",
      whiteSpace: "normal",
    });

    view.unmount();
    render(
      <Tooltip.Provider>
        <IndexValue value="Alice" />
      </Tooltip.Provider>,
    );
    expect(screen.queryByRole("button", { name: /index value/i })).not.toBeInTheDocument();
    const shortValue = screen.getByText("Alice");
    expect(shortValue.style.minHeight).toBe("");
    expect(shortValue).toHaveStyle({
      overflow: "visible",
      textOverflow: "clip",
      whiteSpace: "normal",
    });
  });

  it("forwards metadata index fields without mutating image viewer state", async () => {
    const metadata: MetadataPayload = {
      fees: [],
      funds: [],
      heading: { class: "deed", title: "Warranty Deed" },
      indexes: [{
        ambiguous: "YES",
        code: "idx-1",
        label: "grantor",
        page: "1",
        page_number: "1",
        segment: "party",
        source: "Grantor source quote",
        value: "Alice",
      }],
      pages: { num_of_pages: 1, recordables: [{ code: "page-1", name: "1" }] },
      secrets: [],
    };
    const onPageClick = vi.fn();

    render(
      <MetadataPanel
        {...panelDefaults}
        callbacks={{ onPageClick }}
        confirmedCodes={new Set()}
        choices={[{ level: 1, service: "PartyClauseIndexing" }]}
        metadata={metadata}
        onConfirm={vi.fn()}
        onDrop={vi.fn()}
        onReprocess={vi.fn()}
        openSegment="party"
        removedCodes={new Set()}
        selectedIndex={null}
        segments={segments}
        session="session-party"
        setSectionOpen={vi.fn()}
        panelData={getPanelData(metadata)}
      />,
    );

    fireEvent.click(await screen.findByRole("link", { name: "Alice" }));

    expect(screen.queryByRole("button", { name: "Open page image 1" })).not.toBeInTheDocument();

    expect(onPageClick).toHaveBeenCalledWith(expect.objectContaining({
      metadataIndex: {
        ambiguous: "YES",
        label: "grantor",
        source: "Grantor source quote",
        value: "Alice",
      },
    }));
    expect(imageViewerStoreApi.getState().request).toBeNull();
  });

  it("hides disclosure buttons when explanation and quote fit on one line", async () => {
    const metadata: MetadataPayload = {
      fees: [],
      funds: [],
      heading: { class: "deed", title: "Warranty Deed" },
      indexes: [{
        code: "idx-1",
        explanation: "Short explanation",
        label: "grantor",
        page: "1",
        page_number: "1",
        segment: "party",
        source: "Short quote",
        value: "Alice",
      }],
      pages: { num_of_pages: 1, recordables: [{ code: "page-1", name: "1" }] },
      secrets: [],
    };

    render(
      <MetadataPanel
        {...panelDefaults}
        callbacks={{}}
        confirmedCodes={new Set()}
        choices={[{ level: 1, service: "PartyClauseIndexing" }]}
        metadata={metadata}
        onConfirm={vi.fn()}
        onDrop={vi.fn()}
        onReprocess={vi.fn()}
        openSegment="party"
        removedCodes={new Set()}
        selectedIndex={null}
        segments={segments}
        session="session-party-short"
        setSectionOpen={vi.fn()}
        panelData={getPanelData(metadata)}
      />,
    );

    await waitFor(() => expect(screen.getByText("Alice")).toBeInTheDocument());
    const explanation = screen.getAllByText(/Short explanation/i).find((node) => node.getAttribute("aria-hidden") !== "true") as HTMLElement;
    const quote = screen.getAllByText(/Short quote/i).find((node) => node.getAttribute("aria-hidden") !== "true") as HTMLElement;
    expect(screen.queryByRole("button", { name: "Expand explanation" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Expand quote" })).not.toBeInTheDocument();
    expect(explanation.parentElement?.style.minHeight).toBe("");
    expect(quote.parentElement?.style.minHeight).toBe("");
    expect(explanation).toHaveStyle({
      overflow: "visible",
      paddingRight: "0px",
      textOverflow: "clip",
      whiteSpace: "normal",
    });
    expect(quote).toHaveStyle({
      overflow: "visible",
      paddingRight: "0px",
      textOverflow: "clip",
      whiteSpace: "normal",
    });
  });

  it("removes quote line from page rows and uses compressed first-row spacing", async () => {
    const metadata: MetadataPayload = {
      fees: [],
      funds: [],
      heading: { class: "mortgage", title: "Mortgage Deed" },
      pages: { num_of_pages: 1, recordables: [{ code: "page-1", name: "1", class: "text" }] },
      secrets: [],
    } as MetadataPayload;

    render(
      <MetadataPanel
        {...panelDefaults}
        callbacks={{}}
        confirmedCodes={new Set()}
        choices={[{ level: 1, service: "PartyClauseIndexing" }]}
        metadata={metadata}
        onConfirm={vi.fn()}
        onDrop={vi.fn()}
        onReprocess={vi.fn()}
        openSegment="page"
        removedCodes={new Set()}
        selectedIndex={null}
        segments={segments}
        session="session-page"
        setSectionOpen={vi.fn()}
        panelData={getPanelData(metadata)}
      />,
    );

    await waitFor(() => expect(screen.getByText("1 : Title page")).toBeInTheDocument());
    const pageRow = screen.getByText("1 : Title page").closest("article");
    expect(pageRow).toBeTruthy();
    expect(pageRow).toHaveStyle({
      gap: "0.25rem",
      padding: "0.45rem 0.72rem",
    });
    expect(pageRow).not.toHaveTextContent("Quote:");
    expect(screen.queryByRole("button", { name: "Pop the index" })).not.toBeInTheDocument();
    const footer = document.querySelector<HTMLElement>("[data-metadata-footer]");
    expect(footer).toHaveStyle({ flex: "0 0 0", height: "0px", overflow: "hidden" });
    expect(footer).toBeEmptyDOMElement();
  });

  it("renders the edit action only for page rows", async () => {
    const metadata: MetadataPayload = {
      fees: [],
      funds: [],
      heading: { class: "mortgage", title: "Mortgage Deed" },
      indexes: [{ code: "idx-party-1", label: "grantor", page: "1", page_number: "1", segment: "party", value: "Alice" }],
      pages: {
        num_of_pages: 1,
        recordables: [{ code: "page-1", name: "1", class: "text", segments: ["reference", "property", "recital"] }],
      },
      secrets: [],
    } as MetadataPayload;
    const onEditPage = vi.fn();
    const props = {
      ...panelDefaults,
      callbacks: { onEditPage },
      confirmedCodes: new Set<string>(),
      choices: [{ level: 1, service: "PartyClauseIndexing" }],
      metadata,
      onConfirm: vi.fn(),
      onDrop: vi.fn(),
      onReprocess: vi.fn(),
      removedCodes: new Set<string>(),
      selectedIndex: null,
      segments,
      session: "session-edit-action",
      setSectionOpen: vi.fn(),
      panelData: getPanelData(metadata),
    };

    const { rerender } = render(<MetadataPanel {...props} openSegment="page" />);

    await screen.findByText("1 : Title page");
    fireEvent.click(screen.getByRole("button", { name: "Edit index" }));
    expect(onEditPage).toHaveBeenCalledWith(expect.objectContaining({
      code: "page-1",
      pageClass: "text",
      pageSegments: ["reference", "property"],
    }));

    rerender(<MetadataPanel {...props} openSegment="party" />);

    await screen.findByText("Alice");
    expect(screen.queryByRole("button", { name: "Edit index" })).not.toBeInTheDocument();
  });

  it("uses row-level action controls for legal actions", async () => {
    const metadata: MetadataPayload = {
      fees: [],
      funds: [],
      heading: { class: "deed", title: "Warranty Deed" },
      legals: {
        groups: [{
          code: "legal-2",
          elements: [{ aspect: "subdivision", value: "LOT" }],
          page: "3",
          type: "lot_block",
        }],
      },
    } as MetadataPayload;
    const panelData = getPanelData(metadata);
    const onPageClick = vi.fn();

    render(
      <MetadataPanel
        {...panelDefaults}
        callbacks={{ onPageClick }}
        confirmedCodes={new Set()}
        choices={[{ level: 1, service: "LegalEnrichment" }]}
        metadata={metadata}
        onConfirm={vi.fn()}
        onDrop={vi.fn()}
        onReprocess={vi.fn()}
        openSegment="legal"
        removedCodes={new Set()}
        selectedIndex={null}
        segments={segments}
        session="session-2"
        setSectionOpen={vi.fn()}
        panelData={panelData}
      />,
    );

    await waitFor(() => expect(screen.getByText("Lot Block")).toBeInTheDocument());
    const legalActionButtons = screen.getAllByRole("button", { name: /Open legal /i });
    expect(legalActionButtons).toHaveLength(1);
    expect(screen.getByRole("button", { name: "Open legal view" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Open legal page" })).not.toBeInTheDocument();
    const legalCard = screen.getByRole("link", { name: "Lot Block" }).closest("article");
    expect(legalCard).toHaveStyle({ alignItems: "start", display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto" });
    expect(legalCard?.firstElementChild).toHaveStyle({ display: "flex", flexDirection: "column", gap: "0.25rem" });
    expect(legalCard?.firstElementChild?.firstElementChild).toHaveStyle({ alignItems: "flex-start", display: "flex", minWidth: "0px" });
    expect(screen.getByRole("button", { name: "Copy value Lot Block" }).parentElement).toHaveStyle({ alignSelf: "start" });
    const copyButton = screen.getByRole("button", { name: "Copy value Lot Block" });
    expect(copyButton).toHaveStyle({ alignItems: "center" });
    legalActionButtons.forEach((button) => {
      expect(button).toHaveStyle({ alignItems: "flex-start", width: "2.75rem", height: "2.75rem", padding: "0" });
    });
    expect(screen.getByRole("link", { name: "Lot Block" })).toHaveStyle({ textDecoration: "underline" });
    fireEvent.click(screen.getByRole("link", { name: "Lot Block" }));
    expect(onPageClick).toHaveBeenCalledWith(expect.objectContaining({
      code: "legal-2",
      page: 3,
      segment: "legal",
      session: "session-2",
    }));
    expect(imageViewerStoreApi.getState().request).toBeNull();
  });

  it("copies the displayed index value from the row action", async () => {
    const writeText = vi.fn(async () => undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    const metadata: MetadataPayload = {
      fees: [],
      funds: [],
      heading: { class: "deed", title: "Warranty Deed" },
      indexes: [{ code: "idx-1", label: "grantor", page: "1", segment: "party", value: "Alice" }],
      pages: { num_of_pages: 1, recordables: [{ code: "page-1", name: "1" }] },
      secrets: [],
    };

    render(
      <MetadataPanel
        {...panelDefaults}
        callbacks={{}}
        confirmedCodes={new Set()}
        choices={[{ level: 1, service: "PartyClauseIndexing" }]}
        metadata={metadata}
        onConfirm={vi.fn()}
        onDrop={vi.fn()}
        onReprocess={vi.fn()}
        openSegment="party"
        removedCodes={new Set()}
        selectedIndex={null}
        segments={segments}
        session="session-copy"
        setSectionOpen={vi.fn()}
        panelData={getPanelData(metadata)}
      />,
    );

    fireEvent.click(await screen.findByRole("button", { name: "Copy value Alice" }));

    await waitFor(() => expect(writeText).toHaveBeenCalledWith("Alice"));
  });

  it("propagates clipboard write failures", async () => {
    const error = new Error("Clipboard access denied.");
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: vi.fn(() => Promise.reject(error)) },
    });

    await expect(copyIndexValue("Alice")).rejects.toBe(error);
  });

  it("spaces legal cards apart", async () => {
    const metadata: MetadataPayload = {
      fees: [],
      funds: [],
      heading: { class: "deed", title: "Warranty Deed" },
      legals: {
        groups: [
          {
            code: "legal-1",
            elements: [{ aspect: "subdivision", value: "CHURCHILL'S SUBURBAN VILLA 1 ACRE TRACTS" }],
            page: "3",
            type: "lot_block",
          },
          {
            code: "legal-2",
            elements: [{ aspect: "easement", value: "Ingress and egress" }],
            page: "4",
            type: "metes_bounds",
          },
        ],
      },
    } as MetadataPayload;

    const { container } = render(
      <MetadataPanel
        {...panelDefaults}
        callbacks={{}}
        confirmedCodes={new Set()}
        choices={[{ level: 1, service: "LegalEnrichment" }]}
        metadata={metadata}
        onConfirm={vi.fn()}
        onDrop={vi.fn()}
        onReprocess={vi.fn()}
        openSegment="legal"
        removedCodes={new Set()}
        selectedIndex={null}
        segments={segments}
        session="session-legal-gap"
        setSectionOpen={vi.fn()}
        panelData={getPanelData(metadata)}
      />,
    );

    await waitFor(() => expect(screen.getByText("Lot Block")).toBeInTheDocument());
    expect(screen.getByText("Metes Bounds")).toBeInTheDocument();
    const legalCards = container.querySelectorAll('article[data-index-segment="legal"]');
    expect(legalCards).toHaveLength(2);
    const legalList = legalCards[0].parentElement;
    expect(legalList).toHaveStyle({ display: "grid", gap: "0.35rem" });
  });
});
