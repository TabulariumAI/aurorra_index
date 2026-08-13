import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
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
  heading: { class: "deed", title: "Warranty Deed" },
  indexes: [{ code: "idx-1", label: "grantor", page: "1", page_number: "1", segment: "party", value: "Alice" }],
  pages: { num_of_pages: 1, recordables: [{ code: "page-1", name: "1" }] },
};

function renderPanel(status: "error" | "success") {
  return render(
    <MetadataPanel
      actions={{ confirm: false, drop: false, refine: false, reprocess: false }}
      callbacks={{}}
      choices={[{ level: 1, service: "PartyClauseIndexing" }]}
      confirmedCodes={new Set()}
      metadata={metadata}
      openSegment={segments.PARTY}
      panelData={getPanelData(metadata)}
      removedCodes={new Set()}
      sections={{ filterByChoices: true, hiddenSegments: new Set(), showEmpty: false }}
      selectedIndex={null}
      segments={segments}
      session="session-1"
      setSectionOpen={vi.fn()}
      shortcuts={null}
      status={status}
    />,
  );
}

describe("MetadataPanel status contract", () => {
  it("retains visible metadata when a refresh fails", () => {
    const { container: healthy } = renderPanel("success");
    expect(healthy.querySelector("[aria-label='Metadata']")).not.toBeNull();

    const { container: failed } = renderPanel("error");
    expect(failed.querySelector("[aria-label='Metadata']")).toHaveTextContent("Alice");
  });
});
