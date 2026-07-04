import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterAll, afterEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_ADDRESS_MAP_ZOOM } from "../../addressmap/data/addressMap";
import { imageViewerStoreApi } from "../../imageviewer/store/imageViewerStore";
import { MetadataPanel } from "../component/MetadataPanel";
import { getPanelData } from "../data/metadataData";
import type { IndexSegmentValues, MetadataPayload } from "../type/metadata.types";

const segments: IndexSegmentValues = {
  ACKNOWLEDGMENT: "acknowledgment",
  CHAIN: "chain",
  COURT: "court",
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
  "This explanation is intentionally long so the metadata row stays collapsed to a single line by default and only reveals the full text after the user expands it with the inline disclosure control. ".repeat(3);
const longQuote =
  "P:1. This quote is intentionally long so the metadata row keeps the source collapsed to a single line by default and only reveals the full quoted source after the user expands it with the inline disclosure control. ".repeat(3);

const originalScrollWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "scrollWidth");
const originalClientWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "clientWidth");
const originalScrollHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "scrollHeight");
const originalClientHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "clientHeight");

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
  vi.clearAllMocks();
});

describe("metadata visual surface", () => {
  it("renders the package metadata surface with stable section controls", async () => {
    const metadata: MetadataPayload = {
      fees: [],
      funds: [],
      heading: { class: "deed", title: "Warranty Deed" },
      indexes: [{ code: "idx-1", label: "grantor", page: "1", page_number: "1", segment: "party", value: "Alice" }],
      pages: { num_of_pages: 1, recordables: [{ code: "page-1", name: "1" }] },
      secrets: [],
    };
    const panelData = getPanelData(metadata);
    const onEditPage = vi.fn();
    const onReprocessSegment = vi.fn(async () => true);

    const { container } = render(
      <MetadataPanel
        callbacks={{ onEditPage, onReprocessSegment }}
        addressMapOpen={false}
        addressMapSource=""
        addressMapZoom={DEFAULT_ADDRESS_MAP_ZOOM}
        confirmedCodes={new Set()}
        choices={[{ level: 1, service: "PartyClauseIndexing" }]}
        legalOpen={false}
        metadata={metadata}
        closeAddressMap={vi.fn()}
        openAddressMap={vi.fn()}
        onConfirm={vi.fn()}
        onDrop={vi.fn()}
        openSegment="party"
        removedCodes={new Set()}
        selectedIndex={null}
        segments={segments}
        session="session-1"
        setLegalOpen={vi.fn()}
        setSectionOpen={vi.fn()}
        store={{ error: null, status: "success" }}
        panelData={panelData}
      />,
    );

    await waitFor(() => expect(screen.getByText("Alice")).toBeInTheDocument());
    expect(container.querySelector("[aria-label='Metadata']")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Deed" })).toBeInTheDocument();
    const header = screen.getByRole("heading", { level: 2, name: "Deed" }).closest("header");
    expect(header).toBeTruthy();
    if (header) {
      expect(header).toHaveStyle({ boxShadow: "none", textAlign: "center", width: "100%" });
      expect(header).not.toHaveStyle({ borderLeft: "0.2rem solid #06afc1" });
    }

    expect(screen.getByText("session-1")).toHaveStyle({
      overflowWrap: "anywhere",
      wordBreak: "break-word",
      maxWidth: "100%",
    });
    const title = screen.getByRole("heading", { level: 2, name: "Deed" });
    expect(title).toHaveStyle({ fontWeight: "700" });
    const segmentButton = screen.getByRole("button", { name: /Parties\(Party Clause\)/i });
    const collapsedButton = screen.getByRole("button", { name: /Pages/i });
    expect(segmentButton).toHaveStyle({
      boxSizing: "border-box",
      height: "auto",
      minHeight: "2.85rem",
      padding: "0.424rem 0.88rem 0.442rem",
      transition: "none",
      transform: "none",
      width: "100%",
    });
    const segmentTitleBox = segmentButton.firstElementChild as HTMLElement | null;
    expect(segmentTitleBox).toBeTruthy();
    if (segmentTitleBox) {
      expect(segmentTitleBox).toHaveStyle({ flex: "1 1 auto", minWidth: "0px" });
    }
    const segmentRoot = segmentButton.parentElement;
    expect(segmentRoot).toBeTruthy();
    if (segmentRoot) {
      expect(segmentRoot).toHaveStyle({
        backgroundColor: "rgb(255, 255, 255)",
        borderTop: "1px solid #06afc1",
        borderRadius: "0",
        boxSizing: "border-box",
        boxShadow: "none",
        margin: "0px",
        overflow: "hidden",
        width: "100%",
      });
    }
    expect(segmentButton).toHaveStyle({ backgroundColor: "rgba(6, 175, 193, 0.1)" });
    fireEvent.mouseEnter(collapsedButton);
    expect(collapsedButton).toHaveStyle({ backgroundColor: "rgb(248, 250, 252)" });
    fireEvent.mouseLeave(collapsedButton);
    expect(collapsedButton).toHaveStyle({ backgroundColor: "rgba(0, 0, 0, 0)" });
    fireEvent.mouseEnter(segmentButton);
    expect(segmentButton).toHaveStyle({ backgroundColor: "rgba(6, 175, 193, 0.1)" });
    fireEvent.mouseLeave(segmentButton);
    expect(segmentButton).toHaveStyle({ backgroundColor: "rgba(6, 175, 193, 0.1)" });
    expect(screen.queryByText("▾")).not.toBeInTheDocument();
    expect(screen.queryByText("▸")).not.toBeInTheDocument();
    expect(screen.getByText("Alice")).toHaveStyle({ fontWeight: "700", textTransform: "none" });
    const reprocessLink = screen.getByRole("link", { name: "Reprocess" });
    const refineLink = screen.getByRole("link", { name: "Refine or Chat" });
    expect(reprocessLink).toHaveStyle({
      backgroundColor: "rgba(0, 0, 0, 0)",
      boxShadow: "none",
      textDecoration: "underline",
    });
    expect(screen.getByText("|")).toHaveTextContent("|");
    expect(refineLink).toHaveStyle({
      backgroundColor: "rgba(0, 0, 0, 0)",
      boxShadow: "none",
      textDecoration: "underline",
    });
    const shell = segmentButton.parentElement?.children[1] as HTMLElement | undefined;
    expect(shell).toBeTruthy();
    if (shell) {
      expect(shell).toHaveStyle({ padding: "0px" });
      const actionLine = shell.children[0] as HTMLElement | undefined;
      const content = shell.children[1] as HTMLElement | undefined;
      expect(actionLine).toBeTruthy();
      expect(content).toBeTruthy();
      if (actionLine) {
        expect(actionLine).toHaveStyle({ backgroundColor: "rgba(6, 175, 193, 0.1)", justifyContent: "flex-end" });
      }
      if (content) {
        expect(content).toHaveStyle({ padding: "0.72rem 0 0.82rem 0.24rem" });
        expect(content).not.toHaveStyle({ borderLeft: "1px solid #d9e1ea" });
        expect(content.firstElementChild).toHaveStyle({ borderTopWidth: "1px" });
      }
    }
    fireEvent.click(segmentButton);
    if (segmentTitleBox) {
      expect(segmentTitleBox).toHaveStyle({ flex: "1 1 auto", minWidth: "0px" });
    }
    expect(screen.queryByRole("button", { name: /refresh/i })).not.toBeInTheDocument();
    expect(onReprocessSegment).not.toHaveBeenCalled();
    expect(onEditPage).not.toHaveBeenCalled();

    fireEvent.click(reprocessLink);
    await waitFor(() => expect(onReprocessSegment).toHaveBeenCalledWith("party"));
    fireEvent.click(refineLink);
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
        callbacks={{}}
        addressMapOpen={false}
        addressMapSource=""
        addressMapZoom={DEFAULT_ADDRESS_MAP_ZOOM}
        confirmedCodes={new Set()}
        choices={[{ level: 1, service: "PartyClauseIndexing" }]}
        legalOpen={false}
        metadata={metadata}
        closeAddressMap={vi.fn()}
        onConfirm={vi.fn()}
        onDrop={vi.fn()}
        openAddressMap={vi.fn()}
        openSegment="party"
        removedCodes={new Set()}
        selectedIndex={null}
        segments={segments}
        session="session-party-explanation"
        setLegalOpen={vi.fn()}
        setSectionOpen={vi.fn()}
        store={{ error: null, status: "success" }}
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
    expect(expandButton).toHaveTextContent("[+]");
    expect(expandButton).toHaveStyle({ boxShadow: "none", outline: "none" });
    expect(explanation).toHaveStyle({
      display: "block",
      overflow: "hidden",
      paddingRight: "1.55rem",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    });
    expect(quoteButton).toHaveAttribute("aria-expanded", "false");
    expect(quoteButton).toHaveTextContent("[+]");
    expect(quoteButton).toHaveStyle({ boxShadow: "none", outline: "none" });
    expect(quote).toHaveStyle({
      display: "block",
      overflow: "hidden",
      paddingRight: "1.55rem",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
    });

    fireEvent.click(expandButton);

    expect(await screen.findByRole("button", { name: "Collapse explanation" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Collapse explanation" })).toHaveTextContent("[-]");
    expect(explanation).toHaveStyle({
      overflow: "visible",
      textOverflow: "clip",
      whiteSpace: "normal",
    });

    fireEvent.click(quoteButton);

    expect(await screen.findByRole("button", { name: "Collapse quote" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Collapse quote" })).toHaveTextContent("[-]");
    expect(quote).toHaveStyle({
      overflow: "visible",
      textOverflow: "clip",
      whiteSpace: "normal",
    });

    fireEvent.click(screen.getByRole("button", { name: "Collapse explanation" }));
    expect(screen.getByRole("button", { name: "Expand explanation" })).toBeInTheDocument();
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
        callbacks={{}}
        addressMapOpen={false}
        addressMapSource=""
        addressMapZoom={DEFAULT_ADDRESS_MAP_ZOOM}
        confirmedCodes={new Set()}
        choices={[{ level: 1, service: "PartyClauseIndexing" }]}
        legalOpen={false}
        metadata={metadata}
        closeAddressMap={vi.fn()}
        onConfirm={vi.fn()}
        onDrop={vi.fn()}
        openAddressMap={vi.fn()}
        openSegment="party"
        removedCodes={new Set()}
        selectedIndex={null}
        segments={segments}
        session="session-party-short"
        setLegalOpen={vi.fn()}
        setSectionOpen={vi.fn()}
        store={{ error: null, status: "success" }}
        panelData={getPanelData(metadata)}
      />,
    );

    await waitFor(() => expect(screen.getByText("Alice")).toBeInTheDocument());
    const explanation = screen.getAllByText(/Short explanation/i).find((node) => node.getAttribute("aria-hidden") !== "true") as HTMLElement;
    const quote = screen.getAllByText(/Short quote/i).find((node) => node.getAttribute("aria-hidden") !== "true") as HTMLElement;
    expect(screen.queryByRole("button", { name: "Expand explanation" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Expand quote" })).not.toBeInTheDocument();
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
        callbacks={{}}
        addressMapOpen={false}
        addressMapSource=""
        addressMapZoom={DEFAULT_ADDRESS_MAP_ZOOM}
        confirmedCodes={new Set()}
        choices={[{ level: 1, service: "PartyClauseIndexing" }]}
        legalOpen={false}
        metadata={metadata}
        closeAddressMap={vi.fn()}
        onConfirm={vi.fn()}
        onDrop={vi.fn()}
        openAddressMap={vi.fn()}
        openSegment="page"
        removedCodes={new Set()}
        selectedIndex={null}
        segments={segments}
        session="session-page"
        setLegalOpen={vi.fn()}
        setSectionOpen={vi.fn()}
        store={{ error: null, status: "success" }}
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
        callbacks={{ onPageClick }}
        addressMapOpen={false}
        addressMapSource=""
        addressMapZoom={DEFAULT_ADDRESS_MAP_ZOOM}
        confirmedCodes={new Set()}
        choices={[{ level: 1, service: "LegalEnrichment" }]}
        legalOpen={false}
        metadata={metadata}
        closeAddressMap={vi.fn()}
        onConfirm={vi.fn()}
        onDrop={vi.fn()}
        openAddressMap={vi.fn()}
        openSegment="legal"
        removedCodes={new Set()}
        selectedIndex={null}
        segments={segments}
        session="session-2"
        setLegalOpen={vi.fn()}
        setSectionOpen={vi.fn()}
        store={{ error: null, status: "success" }}
        panelData={panelData}
      />,
    );

    await waitFor(() => expect(screen.getByText("Lot Block")).toBeInTheDocument());
    const legalActionButtons = screen.getAllByRole("button", { name: /Open legal /i });
    expect(legalActionButtons).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Open legal view" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open legal page" })).toBeInTheDocument();
    legalActionButtons.forEach((button) => {
      expect(button).toHaveStyle({ width: "1.9rem", height: "1.9rem", padding: "0" });
    });
    expect(screen.getByText("Lot Block").parentElement).toHaveStyle({ display: "flex" });
    fireEvent.click(screen.getByRole("button", { name: "Open legal page" }));
    expect(onPageClick).toHaveBeenCalledWith(expect.objectContaining({
      code: "legal-2",
      page: 3,
      segment: "legal",
      session: "session-2",
    }));
    expect(imageViewerStoreApi.getState().request).toMatchObject({
      code: "legal-2",
      index: "lot_block",
      page: 3,
      segment: "legal",
      session: "session-2",
      value: "Lot Block",
    });
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
        callbacks={{}}
        addressMapOpen={false}
        addressMapSource=""
        addressMapZoom={DEFAULT_ADDRESS_MAP_ZOOM}
        confirmedCodes={new Set()}
        choices={[{ level: 1, service: "LegalEnrichment" }]}
        legalOpen={false}
        metadata={metadata}
        closeAddressMap={vi.fn()}
        onConfirm={vi.fn()}
        onDrop={vi.fn()}
        openAddressMap={vi.fn()}
        openSegment="legal"
        removedCodes={new Set()}
        selectedIndex={null}
        segments={segments}
        session="session-legal-gap"
        setLegalOpen={vi.fn()}
        setSectionOpen={vi.fn()}
        store={{ error: null, status: "success" }}
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
