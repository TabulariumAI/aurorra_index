import { fireEvent, render, screen, within } from "@testing-library/react";
import { expect, it } from "vitest";
import { LegalMapContent } from "../component/LegalMapContent";
import { surveyStyles } from "../style/surveyStyles";
import { incompleteFixture, invalidFixture, surveyFixture } from "./surveyFixture";

it("reports unpaired courses without individual success statuses or an invented map", () => {
  render(<LegalMapContent legal={invalidFixture} />);
  expect(screen.getByRole("alert", { name: "Metes & Bounds" })).toHaveTextContent("Cannot map: 6 bearings and 4 distances cannot be paired.");
  expect(screen.queryByRole("table")).toBeNull();
  expect(screen.queryByText(/^(Valid|Invalid)$/)).toBeNull();
  expect(screen.queryByRole("img")).toBeNull();
  fireEvent.click(screen.getByRole("tab", { name: "PLSS" }));
  expect(screen.getByRole("img", { name: "PLSS schematic" })).toBeVisible();
});

it.each([false, true])("preserves parcel identity before excluding unpaired courses: %s", reverse => {
  const groups = reverse ? [...incompleteFixture.groups!].reverse() : incompleteFixture.groups!;
  const unmapped = `Parcel ${reverse ? 2 : 1}`;
  const mapped = `Parcel ${reverse ? 1 : 2}`;
  render(<LegalMapContent legal={{ ...incompleteFixture, groups }} />);
  const notice = screen.getByRole("alert", { name: unmapped });
  expect(notice).toHaveTextContent("Cannot map: 5 bearings and 8 distances cannot be paired.");
  expect(screen.getAllByRole("img")).toHaveLength(1);
  const drawing = screen.getByRole("img", { name: `${mapped} schematic` });
  const map = drawing.closest("section")!;
  expect(within(map).getByRole("heading", { name: mapped })).toBeVisible();
  expect(map).not.toContainElement(notice);
  const table = screen.getByRole("table", { name: "Boundary Calls" });
  expect(table.querySelector("caption")).toHaveTextContent(mapped);
  expect(table.querySelectorAll("tbody tr")).toHaveLength(9);
  expect(table.querySelector("tbody tr")).toHaveTextContent("1 → 2");
  expect(table.querySelector("tbody tr")).toHaveTextContent("71.16 ft");
  expect(screen.queryByRole("table", { name: "Bearings" })).toBeNull();
  expect(screen.queryByRole("table", { name: "Distances" })).toBeNull();
  expect(screen.queryByRole("columnheader", { name: "Status" })).toBeNull();
  const calls = screen.getByRole("tabpanel", { name: "Boundary Calls" });
  expect(calls).not.toHaveTextContent("Cannot map");
  expect(calls).not.toHaveTextContent(unmapped);
  fireEvent.click(screen.getByRole("tab", { name: "Acreage" }));
  expect(screen.getByLabelText(`${unmapped} acreage`)).toHaveTextContent("1.589 ACRES, MORE OR LESS");
  expect(screen.getByLabelText(`${mapped} acreage`)).toHaveTextContent("2.005 ACRES OF LAND, MORE OR LESS");
  fireEvent.click(screen.getByRole("tab", { name: "Easement" }));
  expect(screen.getByLabelText(`${unmapped} easement details`)).toHaveTextContent("EASEMENTS OF RECORD");
});

it("refreshes failed and mapped parcels without changing their source positions", () => {
  const { rerender } = render(<LegalMapContent legal={incompleteFixture} />);
  expect(screen.getByRole("alert", { name: "Parcel 1" })).toHaveTextContent("5 bearings and 8 distances cannot be paired");
  expect(screen.getByRole("img", { name: "Parcel 2 schematic" })).toBeVisible();
  rerender(<LegalMapContent legal={{ groups: [incompleteFixture.groups![1], incompleteFixture.groups![1]] }} />);
  expect(screen.queryByRole("alert", { name: "Parcel 1" })).toBeNull();
  expect(screen.getByRole("img", { name: "Parcel 1 schematic" })).toBeVisible();
  expect(screen.getByRole("img", { name: "Parcel 2 schematic" })).toBeVisible();
  expect(screen.getAllByRole("table", { name: "Boundary Calls" }).map(table => table.querySelector("caption")!.textContent)).toEqual(["Parcel 1", "Parcel 2"]);
  rerender(<LegalMapContent legal={{ groups: [incompleteFixture.groups![0]] }} />);
  expect(screen.queryByRole("img")).toBeNull();
  expect(screen.queryByRole("table")).toBeNull();
  expect(screen.getByRole("tab", { name: "Metes & Bounds" })).toBeVisible();
});

it("places the full-width Summary before maps and remaining details, without References", () => {
  render(<LegalMapContent legal={{ summary: "Parcel summary.", groups: [
    { type: "lot_block", elements: [{ aspect: "lot", value: "8" }] },
    { type: "metes_bounds", elements: [{ aspect: "bearings", value: "N; E" }, { aspect: "distances", value: "100; 50" }, { aspect: "acreage", value: "2 acres" }] },
    { type: "plss", elements: [{ aspect: "aliquots", value: "NE1/4 of Section 12" }] },
    { type: "plat_reference", elements: [{ aspect: "plat_book", value: "42" }] },
  ] }} addressMap={{ address: "123 Main Street", content: <div>Address content</div> }} />);
  const root = document.querySelector(".legal-map")!;
  const summary = document.querySelector(".legal-map-summary")!;
  const maps = document.querySelector(".legal-map-column")!;
  const content = document.querySelector(".legal-map-content")!;
  expect(root.firstElementChild).toBe(summary);
  expect(content.firstElementChild).toBe(maps);
  expect(summary.nextElementSibling).toBe(content);
  expect(root).toHaveStyle({ display: "flex", flexDirection: "column", overflow: "hidden" });
  expect(within(screen.getByRole("tablist", { name: "Map views" })).getAllByRole("tab").map(tab => tab.textContent)).toEqual(["Lot & block", "Address", "Metes & Bounds", "PLSS"]);
  expect(screen.queryByRole("table", { name: "Reference" })).not.toBeInTheDocument();
  expect(screen.queryByRole("heading", { name: "Reference" })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("tab", { name: "Metes & Bounds" }));
  expect(maps).toHaveStyle({ minHeight: "16rem" });
  expect(content).toHaveStyle({ display: "flex", minHeight: 0 });
  expect(maps).toHaveStyle({ maxHeight: "56rem" });
  fireEvent.click(screen.getByRole("tab", { name: "Acreage" }));
  expect(maps.compareDocumentPosition(screen.getByText("2 acres")) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  fireEvent.click(screen.getByRole("tab", { name: "Boundary Calls" }));
  expect(screen.getByRole("table", { name: "Boundary Calls" })).toBeVisible();
  expect(maps).not.toContainElement(screen.getByRole("table", { name: "Boundary Calls" }));
  expect(surveyStyles.list).toMatchObject({ flex: "1 1 0", overflow: "hidden" });
});

it("places every boundary table after all drawings when several boundaries exist", () => {
  const boundary = { type: "metes_bounds", elements: [{ aspect: "bearings", value: "N; E" }, { aspect: "distances", value: "100; 50" }] };
  render(<LegalMapContent legal={{ groups: [boundary, boundary] }} />);
  const maps = document.querySelector(".legal-map-column")!;
  expect(screen.getAllByRole("img")).toHaveLength(2);
  const tables = screen.getAllByRole("table", { name: "Boundary Calls" });
  expect(tables).toHaveLength(2);
  for (const table of tables) {
    expect(maps).not.toContainElement(table);
    expect(maps.compareDocumentPosition(table) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  }
});


it("keeps table height fixed while rows scroll inside the table area", () => {
  render(<LegalMapContent legal={{ groups: [{ type: "metes_bounds", elements: [
    { aspect: "bearings", value: "N; E; S; W; N; E; S; W" },
    { aspect: "distances", value: "100; 50; 100; 50; 100; 50; 100; 50" },
  ] }] }} />);
  const table = screen.getByRole("table", { name: "Boundary Calls" });
  expect(table.querySelectorAll("tbody tr")).toHaveLength(8);
  const panel = screen.getByRole("tabpanel", { name: "Boundary Calls" });
  expect(panel.style.height).toBe("9.2rem");
  expect(panel.style.overflowY).toBe("auto");
  expect(document.querySelector<HTMLElement>(".legal-map")!.style.overflow).toBe("hidden");
});

it("uses one fixed details panel with only the selected section mounted", () => {
  render(<LegalMapContent legal={surveyFixture} />);
  const info = document.querySelector<HTMLElement>(".legal-map-info")!;
  expect(info.style.overflowY).not.toBe("auto");
  expect(info.style.height).toBe("");
  expect(info.style.flex).toBe("0 1 auto");
  expect(info).not.toHaveAttribute("tabindex");
  expect(screen.getByRole("tablist", { name: "Map details" })).toBeVisible();
  const drawing = screen.getByRole("img", { name: "Metes & Bounds schematic" });
  const panelId = screen.getByRole("tabpanel", { name: "Boundary Calls" }).id;
  for (const name of ["Boundary Calls", "Acreage", "Easement"]) {
    fireEvent.click(screen.getByRole("tab", { name }));
    const panel = screen.getByRole("tabpanel", { name });
    expect(panel.id).toBe(panelId);
    expect(panel).toHaveStyle({ height: "9.2rem", overflowY: "auto" });
    expect(panel.querySelector('[role="region"]')).toBeNull();
    expect(screen.getByRole("img", { name: "Metes & Bounds schematic" })).toBe(drawing);
    expect(screen.queryByRole("table", { name: "Boundary Calls" }) !== null).toBe(name === "Boundary Calls");
    expect(screen.queryByLabelText("Reported acreage") !== null).toBe(name === "Acreage");
    expect(screen.queryByLabelText("Easement details") !== null).toBe(name === "Easement");
  }
});

it("uses the Batch underline style for details and retains the existing map pills", () => {
  render(<LegalMapContent legal={surveyFixture} />);
  for (const name of ["Boundary Calls", "Acreage", "Easement"]) {
    const tab = screen.getByRole("tab", { name });
    expect(tab).toHaveStyle({ background: "transparent", borderRadius: 0, minHeight: "2.75rem", fontWeight: 700 });
    expect(tab.style.borderBottom).toBe(`2px solid ${name === "Boundary Calls" ? "var(--primary-dark)" : "transparent"}`);
  }
  fireEvent.click(screen.getByRole("tab", { name: "Acreage" }));
  expect(screen.getByRole("tab", { name: "Acreage" }).style.borderBottom).toBe("2px solid var(--primary-dark)");
  expect(screen.getByRole("tab", { name: "Boundary Calls" }).style.borderBottom).toBe("2px solid transparent");
  expect(screen.getByRole("tab", { name: "Metes & Bounds" })).toHaveStyle({ height: "2rem" });
});

it("navigates details with the existing tab keys independently of map views", () => {
  render(<LegalMapContent legal={surveyFixture} />);
  screen.getByRole("tab", { name: "Boundary Calls" }).focus();
  for (const [key, name] of [["ArrowRight", "Acreage"], ["End", "Easement"], ["ArrowRight", "Boundary Calls"], ["ArrowLeft", "Easement"], ["Home", "Boundary Calls"]]) {
    fireEvent.keyDown(document.activeElement!, { key });
    const tab = screen.getByRole("tab", { name });
    expect(tab).toHaveFocus();
    expect(tab).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel", { name })).toHaveAttribute("aria-labelledby", tab.id);
    expect(screen.getByRole("tab", { name: "Metes & Bounds" })).toHaveAttribute("aria-selected", "true");
  }
});

it("updates detail availability after metadata changes and shows the selected map data", () => {
  const { rerender } = render(<LegalMapContent legal={surveyFixture} />);
  fireEvent.click(screen.getByRole("tab", { name: "Easement" }));
  const legal = { ...surveyFixture, groups: surveyFixture.groups!.map(group => ({ ...group, elements: group.elements!.filter(element => element.aspect !== "easement") })) };
  rerender(<LegalMapContent legal={legal} />);
  expect(screen.queryByRole("tab", { name: "Easement" })).toBeNull();
  expect(screen.getByRole("tab", { name: "Boundary Calls" })).toHaveAttribute("aria-selected", "true");
  fireEvent.click(screen.getByRole("tab", { name: "PLSS" }));
  expect(screen.getByRole("tab", { name: "Details" })).toHaveAttribute("aria-selected", "true");
  expect(screen.getByRole("table", { name: "Details" })).toHaveTextContent("Aliquots");
  expect(screen.queryByRole("tabpanel", { name: "Boundary Calls" })).toBeNull();
});
