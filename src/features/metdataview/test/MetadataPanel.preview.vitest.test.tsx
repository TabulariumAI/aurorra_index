import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MetadataPanel } from "../component/MetadataPanel";
import { getPanelData, metadataStyles, type MetadataCallbacks, type MetadataPayload, type MetadataSegments } from "aurora-core";

const segments: MetadataSegments = {
  ACKNOWLEDGMENT: "acknowledgment", ENDORSEMENT: "endorsement", FEE: "fee", FEEFACTOR: "factor",
  FUND: "fund", JUDGMENT: "judgment", LEGAL: "legal", MONETARY: "monetary", PAGE: "page",
  PARTY: "party", PROPERTY: "property", REFERENCE: "reference", SECRETS: "secrets", TITLE: "title",
  TRANSACTION: "transaction", VITAL: "vital",
};

function panel(metadata: MetadataPayload, openSegment: string, callbacks: MetadataCallbacks = {}) {
  return render(<MetadataPanel actions={{ confirm: false, drop: false, reprocess: false }}
    callbacks={callbacks} choices={[]} confirmedCodes={new Set()} metadata={metadata}
    openSegment={openSegment} panelData={getPanelData(metadata)} removedCodes={new Set()}
    sections={{ filterByChoices: false, hiddenSegments: new Set(), showEmpty: false }}
    selectedIndex={null} segments={segments} session="session-1" setSectionOpen={vi.fn()}
    shortcuts={null} showContext status="success" />);
}

describe("metadata page and title previews", () => {
  it("renders changed page segments and supplies the same values when editing", () => {
    const onEditPage = vi.fn();
    const view = panel({ pages: { recordables: [{ name: "1", code: "page-1", class: "instrument", segments: ["party"] }] } }, "page", { onEditPage });
    expect(screen.getByText("Party")).toBeVisible();
    view.unmount();
    panel({ pages: { recordables: [{ name: "1", code: "page-1", class: "instrument", segments: ["reference", "secrets"] }] } }, "page", { onEditPage });
    expect(screen.queryByText("Party")).not.toBeInTheDocument();
    expect(screen.getByText("Reference, Secrets")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Edit index" }));
    expect(onEditPage).toHaveBeenCalledWith(expect.objectContaining({ pageSegments: ["reference", "secrets"] }), expect.any(HTMLElement));
  });

  it.each([
    ["1", "instrument", "Instrument"], ["26", "Title", "Title"], ["Exhibit-A", "TITLE", "Title"],
    ["01", "deed", "Title"], ["1", "title", "Title"], ["2", "title", "Title"],
  ])("labels page %s with class %s using the approved title rule", (name, pageClass, label) => {
    panel({ heading: { class: pageClass === "title" ? "title" : "deed" },
      pages: { recordables: [{ name, code: "page-1", class: pageClass }] } }, "page");
    expect(screen.getByText(`${name} : ${label} page`)).toBeVisible();
  });

  it("does not identify page one or a missing class as a title", () => {
    panel({ pages: { recordables: [{ name: "1", code: "page-1", class: "instrument" },
      { name: "2", code: "page-2" }] } }, "page");
    expect(screen.getByText("1 : Instrument page")).toBeVisible();
    expect(screen.queryByText(/Title page/)).not.toBeInTheDocument();
  });

  it("does not treat lowercase title as an explicit Title class when the heading differs", () => {
    panel({ heading: { class: "deed", title: "Warranty Deed" }, pages: { recordables: [{ name: "3", code: "page-3", class: "title" }] } }, "title", { onPageClick: vi.fn() });
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it.each(["Title", "TITLE", "deed"])("opens main and secondary titles on the page with class %s", pageClass => {
    const onPageClick = vi.fn();
    panel({ heading: { class: "deed", title: "Warranty Deed", secondary_titles: ["Additional Title"], summary: "Heading explanation" },
      pages: { recordables: [{ name: "1", code: "cover", class: "instrument" },
        { name: "Exhibit-A", code: "title-page", class: pageClass }] } }, "title", { onPageClick });
    for (const title of ["Warranty Deed", "Additional Title"]) {
      fireEvent.click(screen.getByRole("link", { name: title }));
      expect(onPageClick).toHaveBeenLastCalledWith({ code: "title-page", page: "Exhibit-A", segment: "title", session: "session-1", type: "title", value: title });
    }
    expect(onPageClick).toHaveBeenCalledTimes(2);
    expect(screen.getAllByText("Heading explanation")).toHaveLength(1);
  });

  it("uses the matching attachment page name", () => {
    const onPageClick = vi.fn();
    panel({ heading: { class: "deed", title: "Warranty Deed" }, pages: {
      recordables: [{ name: "1", code: "cover", class: "instrument" }],
      nonrecordables: [{ name: "01", code: "attachment", class: "TITLE" }],
    } }, "title", { onPageClick });
    fireEvent.click(screen.getByRole("link", { name: "Warranty Deed" }));
    expect(onPageClick).toHaveBeenCalledWith(expect.objectContaining({ code: "attachment", page: "01", segment: "title", value: "Warranty Deed" }));
  });

  it.each(["page", "callback"])("retains plain title text without a %s", missing => {
    panel({ heading: { class: "deed", title: "Warranty Deed" }, pages: {
      recordables: [{ name: "1", code: "cover", class: missing === "page" ? "instrument" : "Title" }],
    } }, "title", missing === "callback" ? {} : { onPageClick: vi.fn() });
    expect(screen.getByText("Warranty Deed")).toBeVisible();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});


it.each([undefined, ["Release of Lien"]])("renders the document summary with secondary titles %s", secondary_titles => {
  const summary = `This document is a Mortgage Satisfaction${secondary_titles ? " with a Release of Lien" : ""} extinguishing the recorded mortgage.`;
  const onPageClick = vi.fn();
  panel({ heading: { class: "mortgage", title: "Mortgage Satisfaction", secondary_titles, summary },
    pages: { recordables: [{ name: "2", code: "title-page", class: "Title" }] } }, "title", { onPageClick });
  expect(screen.getAllByText(summary)).toHaveLength(1);
  const paragraph = screen.getByText(summary);
  expect(paragraph.tagName).toBe("P");
  expect(paragraph).toHaveStyle(metadataStyles.segmentSummary);
  expect(paragraph.closest("article")).toBeNull();
  expect(paragraph.compareDocumentPosition(screen.getAllByRole("article")[0]) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(screen.getAllByRole("article")).toHaveLength(secondary_titles ? 2 : 1);
  expect(screen.getByRole("button", { name: "Titles" }).parentElement?.lastElementChild).toHaveTextContent(secondary_titles ? "2" : "1");
  fireEvent.click(screen.getByRole("link", { name: "Mortgage Satisfaction" }));
  expect(onPageClick).toHaveBeenCalledWith(expect.objectContaining({ page: "2", value: "Mortgage Satisfaction" }));
  expect(screen.queryByText("undefined")).not.toBeInTheDocument();
});

it.each([undefined, ""])("omits an absent heading summary %j while retaining titles", summary => {
  panel({ heading: { title: "Deed", summary } }, "title");
  expect(screen.getByText("Deed")).toBeVisible();
  expect(screen.getByRole("article").parentElement?.querySelector("p")).toBeNull();
});

it("renders a heading summary before the empty title state", () => {
  panel({ heading: { summary: "Document overview." } }, "title");
  expect(screen.getByText("Document overview.")).toBeVisible();
  expect(screen.getByText("No titles found.")).toBeVisible();
  expect(screen.queryByRole("article")).toBeNull();
});
