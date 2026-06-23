import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { useState, type JSX } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { storeApi } from "../../../store/state/store";
import { MetadataPanel } from "../component/MetadataPanel";
import { getPanelData, splitMetadataJSON } from "../data/metadataData";
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

const metadata: MetadataPayload = {
  fees: [],
  funds: [],
  heading: { class: "deed", title: "Warranty Deed" },
  indexes: [],
  legals: {
    groups: [
      {
        code: "legal-1",
        elements: [
          { aspect: "subdivision", value: "METADATA LEGAL" },
          { aspect: "lot", value: "Lot 1" },
        ],
        page: "3",
        type: "lot_block",
      },
    ],
    summary: "Metadata legal summary.",
  },
  pages: { num_of_pages: 1, recordables: [{ code: "page-1", name: "1" }] },
  secrets: [],
};

function PanelHarness(): JSX.Element {
  const [legalOpen, setLegalOpen] = useState(false);

  return (
    <MetadataPanel
      callbacks={{}}
      confirmedCodes={new Set()}
      choices={[{ level: 1, service: "LegalEnrichment" }]}
      legalOpen={legalOpen}
      metadata={metadata}
      onConfirm={vi.fn()}
      onDrop={vi.fn()}
      openSegment="legal"
      panelData={getPanelData(metadata)}
      removedCodes={new Set()}
      selectedIndex={null}
      segments={segments}
      session="session-legal"
      setLegalOpen={setLegalOpen}
      setSectionOpen={vi.fn()}
      store={{ error: null, status: "success" }}
    />
  );
}

describe("MetadataPanel legal plat trigger", () => {
  afterEach(() => {
    storeApi.getState().resetAllState();
  });

  it("opens LegalPlatDialog and passes stored legalJSON into legalplat", async () => {
    storeApi.getState().setJSON("session-legal", splitMetadataJSON({
      legals: {
        groups: [
          {
            code: "legal-store",
            elements: [
              { aspect: "subdivision", value: "STORE LEGAL" },
              { aspect: "phase", value: "Phase 2" },
              { aspect: "block", value: "Block 8" },
              { aspect: "lot", value: "Lot 4" },
            ],
            page: "4",
            type: "lot_block",
          },
        ],
      },
    } as MetadataPayload));

    render(<PanelHarness />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Open legal view" }));
    });

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("Legal Plat")).toBeInTheDocument();
    expect(within(dialog).getByText("STORE LEGAL")).toBeInTheDocument();
    expect(within(dialog).queryByText("METADATA LEGAL")).not.toBeInTheDocument();

    const overlay = document.querySelector("[data-dialog-overlay]");
    expect(overlay).not.toBeNull();

    await act(async () => {
      fireEvent.click(overlay as Element);
    });
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });
});
