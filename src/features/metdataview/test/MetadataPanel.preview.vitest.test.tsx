import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MetadataPanel } from "../component/MetadataPanel";
import { getPanelData, rowStyles, type MetadataCallbacks, type MetadataPayload, type MetadataSegments } from "aurora-core";

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
    panel({ heading: { class: "deed", title: "Warranty Deed", secondary_titles: ["Additional Title"] },
      pages: { recordables: [{ name: "1", code: "cover", class: "instrument" },
        { name: "Exhibit-A", code: "title-page", class: pageClass }] } }, "title", { onPageClick });
    for (const title of ["Warranty Deed", "Additional Title"]) {
      fireEvent.click(screen.getByRole("link", { name: title }));
      expect(onPageClick).toHaveBeenLastCalledWith({ code: "title-page", page: "Exhibit-A", segment: "title", session: "session-1", type: "title", value: title });
    }
    expect(onPageClick).toHaveBeenCalledTimes(2);
    expect(screen.getAllByRole("article")).toHaveLength(2);
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


it.each([undefined, ["Release of Lien"]])("renders only title records with secondary titles %s", secondary_titles => {
  const summary = `This document is a Mortgage Satisfaction${secondary_titles ? " with a Release of Lien" : ""} extinguishing the recorded mortgage.`;
  const onPageClick = vi.fn();
  const heading = { class: "mortgage", title: "Mortgage Satisfaction", secondary_titles, summary };
  panel({ heading,
    pages: { recordables: [{ name: "2", code: "title-page", class: "Title" }] } }, "title", { onPageClick });
  expect(screen.queryByText(summary)).not.toBeInTheDocument();
  expect(screen.getAllByRole("article")).toHaveLength(secondary_titles ? 2 : 1);
  expect(screen.getByRole("button", { name: "Titles" }).parentElement?.lastElementChild).toHaveTextContent(secondary_titles ? "2" : "1");
  fireEvent.click(screen.getByRole("link", { name: "Mortgage Satisfaction" }));
  expect(onPageClick).toHaveBeenCalledWith(expect.objectContaining({ page: "2", value: "Mortgage Satisfaction" }));
  expect(screen.queryByText("undefined")).not.toBeInTheDocument();
});

it("retains titles without a summary", () => {
  panel({ heading: { title: "Deed" } }, "title");
  expect(screen.getByText("Deed")).toBeVisible();
  expect(screen.getByRole("article").parentElement?.querySelector("p")).toBeNull();
});

it("renders the empty title state without a summary", () => {
  panel({ heading: {} }, "title");
  expect(screen.getByText("No titles found.")).toBeVisible();
  expect(screen.queryByRole("article")).toBeNull();
});


it("keeps jurisdiction in Transaction while preserving labeled titles and navigation", () => {
  const onPageClick = vi.fn();
  const metadata: MetadataPayload = {
    heading: { title: "Warranty Deed", secondary_titles: ["Addendum", "Release"] },
    indexes: [{ code: "jurisdiction-1", aspect: "jurisdiction", segment: "transaction", label: "jurisdiction", value: "Québec", page: "2", source: "Current instrument in Québec" }],
    pages: { recordables: [{ name: "2", code: "title-page", class: "Title" }] },
  };
  const view = panel(metadata, "title", { onPageClick });
  const rows = screen.getAllByRole("article");
  expect(rows).toHaveLength(3);
  for (const [index, label, value] of [[0, "Primary Title", "Warranty Deed"], [1, "Secondary Title", "Addendum"], [2, "Secondary Title", "Release"]] as const) {
    expect(within(rows[index]).getByText(label, { exact: true })).toBeVisible();
    expect(within(rows[index]).getByText(value, { exact: true })).toBeVisible();
    expect(rows[index]).toHaveClass("metadata-row");
    expect(rows[index].style.gridTemplateColumns).toBe(rowStyles.indexRow.gridTemplateColumns);
    fireEvent.click(within(rows[index]).getByRole("link", { name: value }));
    expect(onPageClick).toHaveBeenLastCalledWith(expect.objectContaining({ type: "title", page: "2", value }));
  }
  expect(screen.queryByText("Québec", { exact: true })).toBeNull();
  expect(screen.getByRole("button", { name: "Titles" }).parentElement?.lastElementChild).toHaveTextContent("3");
  view.unmount();
  panel(metadata, "transaction", { onPageClick });
  expect(screen.getByText("Québec", { exact: true })).toBeVisible();
  expect(screen.getAllByRole("article")).toHaveLength(1);
});

it("shows the empty Title state when only Transaction jurisdiction exists", () => {
  panel({ heading: {}, indexes: [{ code: "j1", aspect: "jurisdiction", segment: "transaction", label: "jurisdiction", value: "Texas, Harris County" }] }, "title");
  expect(screen.getByText("No titles found.")).toBeVisible();
  expect(screen.queryByRole("article")).toBeNull();
});

it("keeps a secondary title labeled when the primary title is absent", () => {
  panel({ heading: { secondary_titles: ["", "  ", "Addendum"] } }, "title");
  expect(screen.queryByText("Primary Title", { exact: true })).toBeNull();
  expect(screen.getByRole("article")).toHaveTextContent("Secondary Title");
  expect(screen.getByRole("button", { name: "Titles" }).parentElement?.lastElementChild).toHaveTextContent("1");
});
