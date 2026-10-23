import { fireEvent, render, screen, within } from "@testing-library/react";
import { expect, it } from "vitest";
import { LegalMapContent } from "../component/LegalMapContent";
import { incompleteFixture, quarterFixture, surveyFixture } from "./surveyFixture";

it("omits Boundary Calls when neither parcel has paired courses and opens available acreage", () => {
  const group = { ...incompleteFixture.groups![0], elements: incompleteFixture.groups![0].elements!.filter(element => element.aspect !== "easement") };
  render(<LegalMapContent legal={{ groups: [group, group] }} />);
  expect(within(screen.getByRole("tablist", { name: "Map details" })).getAllByRole("tab").map(tab => tab.textContent)).toEqual(["Acreage"]);
  expect(screen.getByRole("tab", { name: "Acreage" })).toHaveAttribute("aria-selected", "true");
  expect(screen.getByLabelText("Parcel 1 acreage")).toHaveTextContent("1.589 ACRES");
  expect(screen.getByLabelText("Parcel 2 acreage")).toHaveTextContent("1.589 ACRES");
  expect(screen.queryByRole("table")).toBeNull();
  expect(screen.getAllByRole("alert")).toHaveLength(2);
});

it("unmounts the data panel and splitter when no tab has displayable data", () => {
  const group = { ...incompleteFixture.groups![0], elements: incompleteFixture.groups![0].elements!.filter(element => ["bearings", "distances"].includes(element.aspect!)) };
  const { rerender } = render(<LegalMapContent legal={surveyFixture} />);
  rerender(<LegalMapContent legal={{ groups: [group] }} />);
  expect(screen.queryByRole("tablist", { name: "Map details" })).toBeNull();
  expect(document.querySelector("[data-legal-map-info]")).toBeNull();
  expect(screen.queryByRole("separator")).toBeNull();
  expect(screen.getByRole("tab", { name: "Metes & Bounds" })).toBeVisible();
  expect(screen.getByRole("alert", { name: "Metes & Bounds" })).toHaveTextContent("5 bearings and 8 distances cannot be paired");
  expect(screen.queryByRole("heading", { name: /^Parcel \d+$/ })).toBeNull();
});

it.each(["PLSS", "Metes & Bounds"])("omits single-parcel headings and captions in %s", view => {
  const groups = surveyFixture.groups!.filter(group => group.type === (view === "PLSS" ? "plss" : "metes_bounds"));
  render(<LegalMapContent legal={{ ...surveyFixture, groups }} />);
  expect(screen.getByRole("img", { name: `${view} schematic` })).toBeVisible();
  expect(screen.queryByRole("heading", { name: /^Parcel \d+$/ })).toBeNull();
  expect(screen.queryByText(/^Parcel \d+$/)).toBeNull();
});

it("shows every nonblank PLSS field below the matching map without column headers or source explanations", () => {
  render(<LegalMapContent legal={{ ...quarterFixture, groups: [{ ...quarterFixture.groups![0], elements: [
    ...quarterFixture.groups![0].elements!,
    { aspect: "county", value: "WAYNE", explanation: "County stated in the description." },
    { aspect: "state", value: "MICHIGAN" },
    { aspect: "acreage", value: " " },
  ] }] }} />);
  const tabs = screen.getByRole("tablist", { name: "Map details" });
  expect(within(tabs).getAllByRole("tab").map(tab => tab.textContent)).toEqual(["Details"]);
  const panel = screen.getByRole("tabpanel", { name: "Details" });
  const table = within(panel).getByRole("table", { name: "Details" });
  expect(within(table).getAllByRole("rowheader").map(node => node.textContent)).toEqual(["Aliquots", "Township", "Range", "County", "State"]);
  expect(table).toHaveTextContent("SW1/4 of Section 4");
  expect(table).toHaveTextContent("TOWN 3 SOUTH");
  expect(table).toHaveTextContent("RANGE 9 EAST");
  expect(within(table).queryAllByRole("columnheader")).toHaveLength(0);
  expect(table).not.toHaveTextContent("County stated in the description.");
  expect(table).not.toHaveTextContent("Acreage");
  expect(panel).toHaveStyle({ height: "9.2rem", overflowY: "auto" });
  expect(document.querySelector(".legal-map-column")!.compareDocumentPosition(table) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(screen.getByRole("separator")).toBeVisible();
});

it("preserves multiple PLSS parcels in their own data tables without merging fields", () => {
  render(<LegalMapContent legal={{ groups: [4, 12].map(section => ({ type: "plss", elements: [
    { aspect: "aliquots", value: `NE1/4 of Section ${section}` },
    { aspect: "township", value: String(section) },
  ] })) }} />);
  for (const [index, section] of [4, 12].entries()) {
    expect(screen.getByRole("img", { name: `Parcel ${index + 1} schematic` })).toBeVisible();
    const table = screen.getByRole("table", { name: `Parcel ${index + 1} details` });
    expect(table.querySelector("caption")).toHaveTextContent(`Parcel ${index + 1}`);
    expect(table).toHaveTextContent(`NE1/4 of Section ${section}`);
    expect(table).not.toHaveTextContent(`NE1/4 of Section ${section === 4 ? 12 : 4}`);
  }
});

it.each(["PLSS", "Metes & Bounds"])("honors an explicit single-parcel count across multiple %s groups", view => {
  const group = view === "PLSS" ? quarterFixture.groups![0] : surveyFixture.groups![1];
  render(<LegalMapContent legal={{ parcels_num: 1, groups: [group, group] }} />);
  expect(screen.getAllByRole("img", { name: `${view} schematic` })).toHaveLength(2);
  expect(screen.getAllByRole("table", { name: view === "PLSS" ? "Details" : "Boundary Calls" })).toHaveLength(2);
  expect(screen.queryByText(/^Parcel \d+$/)).toBeNull();
});

it("shows Plat fields in Details, excludes references, and changes data with the selected view", () => {
  render(<LegalMapContent legal={{ groups: [
    { type: "lot_block", elements: [
      { aspect: "subdivision", value: "RIVER GLEN" },
      { aspect: "lot", value: "1031", explanation: "Lot stated in the description." },
      { aspect: "block", value: " " },
    ] },
    ...quarterFixture.groups!, ...surveyFixture.groups!.filter(group => group.type === "metes_bounds"),
    { type: "plat_reference", elements: [{ aspect: "plat_book", value: "57" }] },
  ] }} addressMap={{ address: "123 Main Street", content: <div>Address map content</div> }} />);
  const plat = screen.getByRole("table", { name: "Details" });
  expect(within(plat).getAllByRole("rowheader").map(node => node.textContent)).toEqual(["Subdivision", "Lot"]);
  expect(plat).toHaveTextContent("1031");
  expect(within(plat).queryAllByRole("columnheader")).toHaveLength(0);
  expect(plat).not.toHaveTextContent("Lot stated in the description.");
  expect(plat).not.toHaveTextContent("Plat Book");
  fireEvent.click(screen.getByRole("tab", { name: "PLSS" }));
  expect(screen.getByRole("table", { name: "Details" })).toHaveTextContent("SW1/4 of Section 4");
  expect(screen.getByRole("table", { name: "Details" })).not.toHaveTextContent("RIVER GLEN");
  fireEvent.click(screen.getByRole("tab", { name: "Metes & Bounds" }));
  expect(screen.queryByRole("tab", { name: "Details" })).toBeNull();
  expect(screen.getByRole("table", { name: "Boundary Calls" })).toBeVisible();
  fireEvent.click(screen.getByRole("tab", { name: "Address" }));
  expect(screen.queryByRole("tablist", { name: "Map details" })).toBeNull();
  expect(screen.queryByRole("separator")).toBeNull();
});

it("retains source data when PLSS or Plat cannot draw an outline", () => {
  render(<LegalMapContent legal={{ groups: [
    { type: "lot_block", elements: [{ aspect: "condominium_unit", value: "Unit 7" }] },
    { type: "plss", elements: [{ aspect: "township", value: "18" }] },
  ] }} />);
  expect(screen.getByRole("table", { name: "Details" })).toHaveTextContent("Unit 7");
  fireEvent.click(screen.getByRole("tab", { name: "PLSS" }));
  expect(screen.queryByRole("img")).toBeNull();
  expect(screen.getByRole("table", { name: "Details" })).toHaveTextContent("18");
  expect(screen.getByRole("alert", { name: "PLSS" })).toHaveTextContent("Cannot map");
});
