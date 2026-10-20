import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it, vi } from "vitest";
import { storeApi } from "../../../store/state/store";
import { MetadataPanel, getPanelData, type MetadataSegments, type MetadataPayload } from "aurora-core";

const segments: MetadataSegments = {
  ACKNOWLEDGMENT: "acknowledgment",
  JUDGMENT: "judgment",
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
    reprocess: true,
  },
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

  it("opens one summary plat for all matching groups and keeps legal rows separate", async () => {
    const onLegalView = vi.fn();
    const legals: MetadataPayload = {
      ...metadata,
      legals: {
        summary: "Metadata legal summary.",
        groups: [
          ...metadata.legals!.groups!,
          { code: "legal-2", elements: [{ aspect: "lot", value: "Lot 2" }], page: "4", type: "lot_block" },
          { code: "legal-3", elements: [{ aspect: "description", value: "Boundary" }], page: "5", type: "metes_bounds" },
        ],
      },
    };
    render(
      <MetadataPanel
        {...panelDefaults}
        callbacks={{ onLegalView }}
        confirmedCodes={new Set()}
        choices={[{ level: 1, service: "LegalEnrichment" }]}
        metadata={legals}
        onConfirm={vi.fn()}
        onDrop={vi.fn()}
        onReprocess={vi.fn()}
        openSegment="legal"
        removedCodes={new Set()}
        selectedIndex={null}
        segments={segments}
        session="session-legal"
        setSectionOpen={vi.fn()}
        panelData={getPanelData(legals)}
      />,
    );

    const openButton = screen.getByRole("button", { name: "Open legal view" });
    const summary = screen.getByText("Metadata legal summary.");
    expect(summary).toContainElement(openButton);
    expect(screen.getAllByRole("button", { name: "Open legal view" })).toHaveLength(1);
    expect(screen.getAllByText("Lot Block")).toHaveLength(2);
    expect(screen.getByText("Metes Bounds")).toBeInTheDocument();
    expect(screen.getAllByRole("article")).toHaveLength(3);
    expect(openButton).toHaveStyle({ padding: "0px" });
    expect(openButton).toHaveTextContent("Show Map");
    expect(openButton).toHaveStyle({ alignItems: "center", height: "2rem", minHeight: "2rem", width: "auto" });
    fireEvent.click(openButton);

    await waitFor(() => expect(onLegalView).toHaveBeenCalledOnce());
    expect(onLegalView).toHaveBeenCalledWith();

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("shows the summary plat action when matching groups have no summary text", () => {
    render(
      <MetadataPanel
        {...panelDefaults}
        callbacks={{ onLegalView: vi.fn() }}
        confirmedCodes={new Set()}
        choices={[{ level: 1, service: "LegalEnrichment" }]}
        metadata={{ ...metadata, legals: { groups: metadata.legals!.groups } }}
        openSegment="legal"
        removedCodes={new Set()}
        selectedIndex={null}
        segments={segments}
        session="session-legal"
        setSectionOpen={vi.fn()}
        panelData={getPanelData(metadata)}
      />,
    );
    expect(screen.getByRole("button", { name: "Open legal view" })).toBeInTheDocument();
  });

  it("hides the plat action when no legal group matches", () => {
    const legals: MetadataPayload = {
      ...metadata,
      legals: { summary: "Boundary description.", groups: [{ code: "legal-3", elements: [{ aspect: "description", value: "Boundary" }], type: "metes_bounds" }] },
    };
    render(
      <MetadataPanel
        {...panelDefaults}
        callbacks={{ onLegalView: vi.fn() }}
        confirmedCodes={new Set()}
        choices={[{ level: 1, service: "LegalEnrichment" }]}
        metadata={legals}
        openSegment="legal"
        removedCodes={new Set()}
        selectedIndex={null}
        segments={segments}
        session="session-legal"
        setSectionOpen={vi.fn()}
        panelData={getPanelData(legals)}
      />,
    );
    expect(screen.getByText("Boundary description.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Open legal view" })).not.toBeInTheDocument();
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
