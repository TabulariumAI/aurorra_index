import { fireEvent, render, screen, within } from "@testing-library/react";
import { expect, it } from "vitest";
import { LegalMapContent } from "../component/LegalMapContent";
import { quarterFixture } from "./surveyFixture";

it("shows every nonblank PLSS field below the matching map without column headers or source explanations", () => {
  render(<LegalMapContent legal={{ ...quarterFixture, groups: [{ ...quarterFixture.groups![0], elements: [
    ...quarterFixture.groups![0].elements!,
    { aspect: "county", value: "WAYNE", explanation: "County stated in the description." },
    { aspect: "state", value: "MICHIGAN" },
    { aspect: "acreage", value: " " },
  ] }] }} />);
  expect(screen.queryByRole("tablist", { name: "Map details" })).toBeNull();
  const panel = screen.getByRole("region", { name: "Details" });
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

it("retains source data when PLSS or Plat cannot draw an outline", () => {
  render(<LegalMapContent legal={{ groups: [
    { type: "lot_block", elements: [{ aspect: "condominium_unit", value: "Unit 7" }] },
    { type: "plss", elements: [{ aspect: "township", value: "18" }] },
  ] }} />);
  expect(screen.getByRole("table", { name: "Details" })).toHaveTextContent("Unit 7");
  fireEvent.click(screen.getByRole("tab", { name: "PLSS" }));
  expect(screen.queryByRole("img")).toBeNull();
  expect(screen.getByRole("table", { name: "Details" })).toHaveTextContent("18");
  expect(screen.getByRole("alert", { name: "Parcel 1" })).toHaveTextContent("Cannot map");
});
