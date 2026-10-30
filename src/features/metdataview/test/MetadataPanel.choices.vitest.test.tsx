import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { getPanelData, type MetadataPayload, type MetadataSegments } from "aurora-core";
import { MetadataPanel, type MetadataPanelProps } from "../component/MetadataPanel";

const segments: MetadataSegments = {
  ACKNOWLEDGMENT: "acknowledgment", ENDORSEMENT: "endorsement", FEE: "fee", FEEFACTOR: "factor",
  FUND: "fund", JUDGMENT: "judgment", LEGAL: "legal", MONETARY: "monetary", PAGE: "page",
  PARTY: "party", PROPERTY: "property", REFERENCE: "reference", SECRETS: "secrets", TITLE: "title",
  TRANSACTION: "transaction", VITAL: "vital",
};
const metadata: MetadataPayload = {
  heading: { class: "deed", title: "Grant Deed" },
  indexes: [{ code: "party-1", label: "grantor", page: "1", page_number: "1", segment: "party", value: "Alice" }],
  pages: { num_of_pages: 20, recordables: [{ code: "p1", name: "1" }] },
};
const props: MetadataPanelProps = {
  actions: { confirm: true, drop: true, reprocess: true }, callbacks: {},
  choices: [{ service: "Recognition", level: 3 }, { service: "PartyClauseIndexing", level: 1 }, { service: "ExhibitIndexing", level: 1 }],
  confirmedCodes: new Set(), metadata, openSegment: "page", panelData: getPanelData(metadata),
  removedCodes: new Set(), sections: { filterByChoices: true, hiddenSegments: new Set(), showEmpty: false },
  selectedIndex: null, showContext: true, segments, session: "s", setSectionOpen: vi.fn(), shortcuts: null, status: "success",
};

describe("session processing choices", () => {
  it("shows unselected segments disabled, including an already open segment, without actions", () => {
    const open = vi.fn();
    const add = vi.fn();
    const reprocess = vi.fn();
    render(<MetadataPanel {...props} openSegment="monetary" setSectionOpen={open} onAddIndex={add} onReprocess={reprocess} />);
    const monetary = screen.getByRole("button", { name: "Monetary" });
    expect(monetary).toBeDisabled();
    expect(screen.getByRole("button", { name: "Endorsements" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Parties(Party Clause)" })).toBeEnabled();
    expect(screen.queryByText("Not selected for this session.")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Monetary information" })).toBeEnabled();
    fireEvent.click(monetary);
    fireEvent.keyDown(monetary, { key: "Enter" });
    expect(open).not.toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: "Reprocess" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add Index" })).not.toBeInTheDocument();
  });

  it.each([
    [{ first: 5, last: 3 }, 20, "first 5 and last 3 pages — 8 of 20 pages"],
    [{ first: 5, last: 3 }, 4, "first 5 and last 3 pages — 4 of 4 pages"],
    [{ first: 1, last: 0 }, 20, "first page — 1 of 20 pages"],
    [{ all: true }, 20, "all 20 pages"],
  ] as const)("shows the selected page scope and distinct page count in a header tooltip: %j", async (pageScope, count, text) => {
    const data = { ...metadata, pages: { ...metadata.pages, num_of_pages: count } };
    render(<MetadataPanel {...props} metadata={data} panelData={getPanelData(data)} pageScope={pageScope} />);
    expect(screen.queryByText(`Processing scope for this session: ${text}.`)).not.toBeInTheDocument();
    fireEvent.focus(screen.getByRole("button", { name: "Pages information" }));
    expect(await screen.findByRole("tooltip")).toHaveTextContent(`Processing scope for this session: ${text}.`);
  });

  it.each([true, false])("only explains unselected enrichment in a header tooltip: %s", async enabled => {
    const choices = [...props.choices!, { service: "PartyEnrichment", level: Number(enabled) }, { service: "LegalEnrichment", level: Number(enabled) }];
    const view = render(<MetadataPanel {...props} choices={choices} openSegment="party" />);
    expect(screen.queryByText("Party enrichment is enabled for this session.")).not.toBeInTheDocument();
    expect(screen.queryByText("Party enrichment was not selected for this session.")).not.toBeInTheDocument();
    if (enabled) expect(screen.queryByRole("button", { name: "Parties(Party Clause) information" })).not.toBeInTheDocument();
    else {
      fireEvent.focus(screen.getByRole("button", { name: "Parties(Party Clause) information" }));
      expect(await screen.findByRole("tooltip")).toHaveTextContent("Party enrichment was not selected for this session.");
      fireEvent.blur(screen.getByRole("button", { name: "Parties(Party Clause) information" }));
    }
    view.rerender(<MetadataPanel {...props} choices={choices} openSegment="property" />);
    expect(screen.queryByText("Legal description enrichment is enabled for this session.")).not.toBeInTheDocument();
    expect(screen.queryByText("Legal description enrichment was not selected for this session.")).not.toBeInTheDocument();
    if (enabled) expect(screen.queryByRole("button", { name: "Property Info information" })).not.toBeInTheDocument();
    else {
      fireEvent.focus(screen.getByRole("button", { name: "Property Info information" }));
      expect(await screen.findByRole("tooltip")).toHaveTextContent("Legal description enrichment was not selected for this session.");
    }
  });

  it.each(["Texas, Harris County", null])("shows the session jurisdiction or its absence: %s", jurisdiction => {
    render(<MetadataPanel {...props} openSegment="title" jurisdiction={jurisdiction} />);
    expect(screen.getByText(jurisdiction ? `Jurisdiction for this session: ${jurisdiction}.` : "No jurisdiction was selected for this session.")).toBeVisible();
  });

  it("keeps page scope information accessible while Pages is collapsed", async () => {
    render(<MetadataPanel {...props} openSegment="party" pageScope={{ all: true }} />);
    fireEvent.focus(screen.getByRole("button", { name: "Pages information" }));
    expect(await screen.findByRole("tooltip")).toHaveTextContent("Processing scope for this session: all 20 pages.");
  });

  it("reports unavailable page scope without inventing a selection", async () => {
    render(<MetadataPanel {...props} />);
    fireEvent.focus(screen.getByRole("button", { name: "Pages information" }));
    expect(await screen.findByRole("tooltip")).toHaveTextContent("Processing scope is unavailable for this session.");
  });

  it("keeps metadata available when choices are unavailable without claiming deselection", () => {
    render(<MetadataPanel {...props} choices={null} openSegment="party" />);
    expect(screen.getByText("Alice")).toBeVisible();
    expect(screen.getByRole("button", { name: "Parties(Party Clause)" })).toBeEnabled();
    expect(screen.getByText("Processing choices are unavailable for this session.")).toBeVisible();
    expect(screen.queryByText("Party enrichment was not selected for this session.")).not.toBeInTheDocument();
  });

  it("preserves explicit section exclusions and unfiltered consumers", () => {
    render(<MetadataPanel {...props} choices={[]} openSegment="party" sections={{ filterByChoices: false, hiddenSegments: new Set(["vital"]), showEmpty: true }} />);
    expect(screen.getByRole("button", { name: "Parties(Party Clause)" })).toBeEnabled();
    expect(screen.getByText("Alice")).toBeVisible();
    expect(screen.queryByRole("button", { name: "Vital" })).not.toBeInTheDocument();
    expect(screen.queryByText("Not selected for this session.")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /information$/ })).not.toBeInTheDocument();
  });
});
