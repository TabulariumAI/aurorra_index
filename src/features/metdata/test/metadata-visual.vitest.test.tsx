import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
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
        confirmedCodes={new Set()}
        choices={[{ level: 1, service: "PartyClauseIndexing" }]}
        legalOpen={false}
        metadata={metadata}
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
        border: "1px solid #d9e1ea",
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
    expect(screen.getByRole("button", { name: "Reprocess" })).toHaveStyle({ boxShadow: "none" });
    expect(screen.getByText("|")).toHaveTextContent("|");
    expect(screen.getByRole("button", { name: "Refine or Chat" })).toHaveStyle({ boxShadow: "none" });
    expect(screen.getByRole("button", { name: "Reprocess" }).parentElement?.parentElement).toHaveStyle({ justifyContent: "flex-end" });
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
  });
});
