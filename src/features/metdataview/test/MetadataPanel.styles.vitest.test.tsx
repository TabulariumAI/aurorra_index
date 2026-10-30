import { render } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { getPanelData, metadataRowCss, metadataSpinnerCss, type MetadataPayload } from "aurora-core";
import { MetadataPanel, type MetadataPanelProps } from "../component/MetadataPanel";

it("renders the Core public API styles for property rows and responsive recovery", () => {
  const metadata: MetadataPayload = { indexes: [] };
  const props: MetadataPanelProps = {
    actions: { confirm: false, drop: false, reprocess: false },
    callbacks: {}, choices: [], metadata, panelData: getPanelData(metadata),
    confirmedCodes: new Set(), removedCodes: new Set(),
    openSegment: null, selectedIndex: null,
    sections: { filterByChoices: false, hiddenSegments: new Set(), showEmpty: false },
    showContext: false, session: "session-1", setSectionOpen: vi.fn(),
    shortcuts: null, status: "success",
    segments: {
      ACKNOWLEDGMENT: "acknowledgment", JUDGMENT: "judgment", ENDORSEMENT: "endorsement",
      FEE: "fee", FEEFACTOR: "factor", FUND: "fund", LEGAL: "legal", MONETARY: "monetary",
      PAGE: "page", PARTY: "party", PROPERTY: "property", REFERENCE: "reference",
      SECRETS: "secrets", TITLE: "title", TRANSACTION: "transaction", VITAL: "vital",
    },
  };

  const { container } = render(<MetadataPanel {...props} />);
  const css = container.querySelector("style")?.textContent;
  expect(metadataRowCss).toContain(":where(.metadata-property)");
  expect(metadataRowCss).toContain("@container metadata");
  expect(metadataRowCss).toContain('[data-status="error"] > .metadata-row-actions');
  expect(css).toBe(metadataSpinnerCss + metadataRowCss);
});
