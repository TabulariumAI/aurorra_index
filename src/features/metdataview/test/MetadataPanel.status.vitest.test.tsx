import { render, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { getPanelData, type MetadataSegments, type MetadataPayload } from "aurora-core";
import { MetadataPanel } from "../component/MetadataPanel";

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

const metadata: MetadataPayload = {
  heading: { class: "deed", title: "Warranty Deed" },
  indexes: [{ code: "idx-1", label: "grantor", page: "1", page_number: "1", segment: "party", value: "Alice" }],
  pages: { num_of_pages: 1, recordables: [{ code: "page-1", name: "1" }] },
};

function renderPanel(status: "error" | "success", data = metadata, confirmedCodes = new Set<string>(), removedCodes = new Set<string>()) {
  return render(
    <MetadataPanel
      actions={{ confirm: false, drop: false, reprocess: false }}
      callbacks={{}}
      choices={[{ level: 1, service: "PartyClauseIndexing" }]}
      confirmedCodes={confirmedCodes}
      metadata={data}
      openSegment={segments.PARTY}
      panelData={getPanelData(data)}
      removedCodes={removedCodes}
      sections={{ filterByChoices: true, hiddenSegments: new Set(), showEmpty: false }}
      selectedIndex={null}
      showContext
      segments={segments}
      session="session-1"
      setSectionOpen={vi.fn()}
      shortcuts={null}
      status={status}
    />,
  );
}

describe("MetadataPanel status contract", () => {
  it("keeps the document heading and header sizing without the removed badges", () => {
    const { container } = renderPanel("success");
    const header = container.querySelector("header")!;
    expect(within(header).getByRole("heading", { name: "Deed" })).toBeVisible();
    for (const label of ["Indexes", "Unclear"]) expect(within(header).queryByText(label)).not.toBeInTheDocument();
    expect(within(header).queryByRole("definition")).not.toBeInTheDocument();
    expect(header.style.minHeight).toBe("var(--panel-header-height)");
    expect(header.style.padding).toBe("var(--panel-header-padding)");
  });

  it.each([undefined, []])("renders separate parties when indexes are absent or empty", indexes => {
    const parties = [{ ...metadata.indexes![0], ambiguous: "YES" }];
    const { container } = renderPanel("success", { ...metadata, indexes, parties: { summary: null, indexes: parties } });
    expect(container.querySelector('[data-index-code="idx-1"]')).toHaveAttribute("data-status", "warning");
  });

  it.each(["confirmed", "removed"])("applies %s codes to duplicate party rows once", state => {
    const party = { ...metadata.indexes![0], ambiguous: "YES" };
    const data = { ...metadata, indexes: [party, party], parties: { summary: null, indexes: [party, party] } };
    const { container } = renderPanel("success", data,
      new Set(state === "confirmed" ? ["idx-1"] : []), new Set(state === "removed" ? ["idx-1"] : []));
    expect(container.querySelectorAll('[data-index-code="idx-1"]')).toHaveLength(state === "removed" ? 0 : 1);
    if (state === "confirmed") expect(container.querySelector('[data-index-code="idx-1"]')).toHaveAttribute("data-status", "success");
  });

  it("renders extracted parties when the enriched collection is empty", () => {
    const { container } = renderPanel("success", { ...metadata, parties: { summary: null, indexes: [] } });
    expect(container.querySelector('[data-index-code="idx-1"]')).toHaveTextContent("Alice");
  });

  it("retains visible metadata when a refresh fails", () => {
    const { container } = renderPanel("error");
    expect(container.querySelector("[aria-label='Metadata']")).toHaveTextContent("Alice");
  });
});
