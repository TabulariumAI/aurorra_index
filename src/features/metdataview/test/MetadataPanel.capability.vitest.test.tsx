import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { imageViewerStoreApi } from "../../imageviewer/store/imageViewerStore";
import { MetadataPanel } from "../component/MetadataPanel";
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

const metadata: MetadataPayload = {
  chain: [{ class: "deed", required: "true", role: "grantee", title: "Alice" }],
  fee_factors: [{ amount: "1", name: "Page count" }],
  fees: [{ amount: "125", formula: "base fee", name: "Recording fee" }],
  funds: [{ amount: "75", formula: "allocation", name: "General fund" }],
  heading: { class: "deed", title: "Warranty Deed" },
  history: {
    conveyance: [],
    encumbrance: [],
    mortgage: [],
  },
  indexes: [{
    code: "idx-1",
    label: "grantor",
    page: "1",
    page_number: "1",
    segment: "party",
    source: "Source",
    value: "Alice",
  }],
  pages: { num_of_pages: 1, recordables: [{ code: "page-1", name: "1" }] },
  secrets: [],
};

describe("MetadataPanel capability mode", () => {
  it("uses explicit status, action, section, shortcut, and callback-only page behavior", () => {
    imageViewerStoreApi.getState().resetViewer();
    const onPageClick = vi.fn();

    render(
      <MetadataPanel
        actions={{
          confirm: false,
          drop: false,
          refine: false,
          reprocess: false,
        }}
        batch="Pending"
        callbacks={{ onPageClick }}
        choices={null}
        confirmedCodes={new Set()}
        metadata={metadata}
        openSegment="party"
        panelData={getPanelData(metadata)}
        removedCodes={new Set()}
        sections={{
          filterByChoices: false,
          hiddenSegments: new Set(),
          showEmpty: true,
        }}
        selectedIndex={null}
        segments={segments}
        session="session-capability"
        setSectionOpen={vi.fn()}
        shortcuts={new Map([[segments.PARTY, "p"]])}
        status="success"
      />,
    );

    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Reprocess" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Open AI chat" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Pop the index" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Fee Factors/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Fees/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Funds/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Chain/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^History/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Parties\(Party Clause\)/i }).querySelector("u")?.textContent).toBe("P");

    fireEvent.click(screen.getByRole("link", { name: "Alice" }));

    expect(onPageClick).toHaveBeenCalledWith(expect.objectContaining({
      code: "idx-1",
      session: "session-capability",
      value: "Alice",
    }));
    expect(imageViewerStoreApi.getState().request).toBeNull();
  });

  it("retains visible metadata on explicit error status", () => {
    const { container } = render(
      <MetadataPanel
        actions={{
          confirm: false,
          drop: false,
          refine: false,
          reprocess: false,
        }}
        batch="Pending"
        callbacks={{}}
        choices={null}
        confirmedCodes={new Set()}
        metadata={metadata}
        openSegment="party"
        panelData={getPanelData(metadata)}
        removedCodes={new Set()}
        sections={{
          filterByChoices: false,
          hiddenSegments: new Set(),
          showEmpty: true,
        }}
        selectedIndex={null}
        segments={segments}
        session="session-capability"
        setSectionOpen={vi.fn()}
        shortcuts={null}
        status="error"
      />,
    );

    expect(container.querySelector("[aria-label='Metadata']")).toHaveTextContent("Alice");
  });
});
