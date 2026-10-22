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
  it("replaces batch/session text with all-index and ambiguous-index counts", () => {
    const indexes = ["YES", "y", true, 1, "NO", false, null, undefined].map((ambiguous, index) => ({
      code: String(index), segment: index % 2 ? "party" : "reference", value: "Value", ambiguous,
    }));
    const { container } = renderPanel("success", { ...metadata, indexes });
    const header = container.querySelector("header")!;
    expect(header).not.toHaveTextContent("Pending");
    expect(header).not.toHaveTextContent("session-1");
    expect(within(header).getByRole("heading", { name: "Deed" })).toBeVisible();
    expect(within(header).getByText("Indexes").parentElement).toHaveTextContent("8");
    expect(within(header).getByText("Unclear").parentElement).toHaveTextContent("4");
    for (const term of within(header).getAllByRole("term")) {
      expect(term.nextElementSibling?.tagName).toBe("DD");
      expect(term.parentElement).toHaveStyle({ display: "flex", flexDirection: "column-reverse" });
    }
    expect(header.style.minHeight).toBe("var(--panel-header-height)");
    expect(header.style.padding).toBe("var(--panel-header-padding)");
  });

  it.each([undefined, []])("shows zero counts for absent or empty indexes", (indexes) => {
    const { container } = renderPanel("success", { ...metadata, indexes });
    expect(within(container.querySelector("header")!).getAllByRole("definition").map(node => node.textContent)).toEqual(["0", "0"]);
  });

  it.each([undefined, []])("counts separate party records when indexes are absent or empty", (indexes) => {
    const parties = [{ ...metadata.indexes![0], ambiguous: "YES" }];
    const { container } = renderPanel("success", { ...metadata, indexes, parties });
    expect(container.querySelector('[data-index-code="idx-1"]')).toHaveAttribute("data-status", "warning");
    expect(within(container.querySelector("header")!).getAllByRole("definition").map(node => node.textContent)).toEqual(["1", "1"]);
  });

  it("uses the displayed parties instead of stale duplicate party indexes", () => {
    const party = { ...metadata.indexes![0], ambiguous: "YES" };
    const reference = { ...party, code: "ref-1", segment: "reference", ambiguous: "NO" };
    const { container } = renderPanel("success", {
      ...metadata,
      indexes: [{ ...party, ambiguous: "NO" }, reference],
      parties: [party],
    });
    expect(within(container.querySelector("header")!).getAllByRole("definition").map(node => node.textContent)).toEqual(["2", "1"]);
  });

  it("does not count stale party indexes when the displayed party collection is empty", () => {
    const { container } = renderPanel("success", { ...metadata, parties: [] });
    expect(within(container.querySelector("header")!).getAllByRole("definition").map(node => node.textContent)).toEqual(["0", "0"]);
  });

  it.each(["confirmed", "removed", "refreshed"])("updates separate-party counts when %s", (state) => {
    const parties = [{ ...metadata.indexes![0], ambiguous: state === "refreshed" ? "NO" : "YES" }];
    const { container } = renderPanel("success", { ...metadata, indexes: [], parties },
      new Set(state === "confirmed" ? ["idx-1"] : []), new Set(state === "removed" ? ["idx-1"] : []));
    expect(within(container.querySelector("header")!).getAllByRole("definition").map(node => node.textContent))
      .toEqual([state === "removed" ? "0" : "1", "0"]);
  });

  it("retains visible metadata when a refresh fails", () => {
    const { container: healthy } = renderPanel("success");
    expect(healthy.querySelector("[aria-label='Metadata']")).not.toBeNull();

    const { container: failed } = renderPanel("error");
    expect(failed.querySelector("[aria-label='Metadata']")).toHaveTextContent("Alice");
  });
});
