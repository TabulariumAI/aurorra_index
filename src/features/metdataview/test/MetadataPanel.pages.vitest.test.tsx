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
  heading: { class: "deed", title: "Warranty Deed" },
  indexes: [{ code: "party-1", label: "grantor", page_number: "1", segment: "party", value: "Alice" }],
  pages: { num_of_pages: 1, recordables: [{ code: "page-1", name: "1", class: "Title" }] },
};
const props: MetadataPanelProps = {
  actions: { confirm: false, drop: false, reprocess: false }, callbacks: { onPageClick: vi.fn() },
  choices: [], confirmedCodes: new Set(), metadata, openSegment: "page", panelData: getPanelData(metadata),
  removedCodes: new Set(), sections: { filterByChoices: false, hiddenSegments: new Set(), showEmpty: false },
  selectedIndex: null, segments, session: "session-1", setSectionOpen: vi.fn(), shortcuts: null,
  showContext: true, status: "success",
};
const pageError = { code: "content_result_invalid", error: "The pages export result could not be decoded: the JSON is incomplete." };

describe("Pages export failure isolation", () => {
  it("keeps section headers usable and exposes the failure in the count badge", async () => {
    render(<MetadataPanel {...props} metadata={{ ...metadata, pages: undefined }} pageError={pageError} />);
    expect(screen.getByRole("region", { name: "Metadata accordion" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Parties(Party Clause)" })).toBeEnabled();
    const badge = screen.getByRole("button", { name: "Pages error" });
    expect(badge.parentElement).not.toHaveTextContent("0");
    fireEvent.focus(badge);
    expect(await screen.findByRole("tooltip")).toHaveTextContent(pageError.error);
    expect(screen.queryByText("No recordables pages found.")).not.toBeInTheDocument();
  });

  it("removes stale page rows on failure while preserving other metadata", () => {
    const view = render(<MetadataPanel {...props} />);
    expect(screen.getByText("1 : Title page")).toBeVisible();
    view.rerender(<MetadataPanel {...props} pageError={pageError} />);
    expect(screen.queryByText("1 : Title page")).not.toBeInTheDocument();
    view.rerender(<MetadataPanel {...props} openSegment="party" pageError={pageError} />);
    expect(screen.getByText("Alice")).toBeVisible();
    expect(screen.getByRole("button", { name: "Pages error" })).toBeVisible();
    view.rerender(<MetadataPanel {...props} openSegment="title" pageError={pageError} />);
    expect(screen.getByText("Warranty Deed")).toBeVisible();
    expect(screen.queryByRole("link", { name: "Warranty Deed" })).not.toBeInTheDocument();
  });

  it("replaces the error with the new count and rows after recovery", () => {
    const view = render(<MetadataPanel {...props} pageError={pageError} />);
    const recovered = { ...metadata, pages: { num_of_pages: 2, recordables: [{ code: "page-2", name: "2", class: "instrument" }] } };
    view.rerender(<MetadataPanel {...props} metadata={recovered} panelData={getPanelData(recovered)} />);
    expect(screen.queryByRole("button", { name: "Pages error" })).not.toBeInTheDocument();
    expect(screen.getByText("2 : Instrument page")).toBeVisible();
    expect(screen.getByRole("button", { name: "Pages" }).parentElement!.lastElementChild).toHaveTextContent("1");
    expect(screen.queryByText("1 : Title page")).not.toBeInTheDocument();
  });
});
