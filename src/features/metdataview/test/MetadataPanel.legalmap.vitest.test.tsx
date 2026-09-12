import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it, vi } from "vitest";
import { storeApi } from "../../../store/state/store";
import { MetadataPanel, getPanelData, type MetadataSegments, type MetadataPayload } from "aurora-core";

const segments: MetadataSegments = {
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
  showContext: true,
  shortcuts: null,
  status: "success" as const,
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

describe("MetadataPanel legal map trigger", () => {
  afterEach(() => {
    storeApi.getState().resetAllState();
  });

  it("delegates legal view clicks to callbacks.onLegalView and does not open dialog", async () => {
    const onLegalView = vi.fn();
    render(
      <MetadataPanel
        {...panelDefaults}
        callbacks={{ onLegalView }}
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
        session="session-legal"
        setSectionOpen={vi.fn()}
        panelData={getPanelData(metadata)}
      />,
    );

    const openButton = screen.getByRole("button", { name: "Open legal view" });
    const value = screen.getByText("Lot Block");
    expect(openButton.parentElement?.firstElementChild).toBe(openButton);
    expect(openButton.parentElement?.lastElementChild).toBe(value);
    expect(openButton).toHaveTextContent("Show plat");
    expect(openButton).toHaveStyle({ alignItems: "flex-start", height: "2rem", minHeight: "2rem", width: "auto" });
    fireEvent.click(openButton);

    await waitFor(() => expect(onLegalView).toHaveBeenCalledWith(expect.objectContaining({
      code: "legal-1",
      page: 3,
      segment: "legal",
      session: "session-legal",
      type: "lot_block",
      value: "Lot Block",
    })));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("keeps legalmap package files free of dialog ownership", () => {
    const legalmapDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "legalmap");
    const entries = readdirSync(legalmapDir, { recursive: true }) as string[];
    const files = entries.filter((entry) => entry.endsWith(".ts") || entry.endsWith(".tsx"));

    for (const file of files) {
      const source = readFileSync(path.join(legalmapDir, file), "utf8");
      expect(source).not.toContain("Dialog");
      expect(source).not.toContain("LegalMapDialog");
    }
  });
});
