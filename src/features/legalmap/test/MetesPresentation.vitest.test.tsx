import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { buildBoundary } from "../data/surveyData";
import { LegalMapContent } from "../component/LegalMapContent";
import { presentationFixture, interruptedFixture, zeroFixture, closureFixture } from "./presentationFixture";

it("preserves the six extracted courses, filled parcel, commencement tie and start labels", () => {
  const original = JSON.stringify(presentationFixture);
  const scene = buildBoundary(presentationFixture.groups[0], "Parcel 1");
  expect(scene.courses).toHaveLength(6);
  expect(scene.issue).toBeUndefined();
  expect(scene.beginning).toBe(1);
  expect(scene.closed).toBe(true);
  render(<LegalMapContent legal={presentationFixture} />);
  expect(document.querySelectorAll("[data-survey-line]")).toHaveLength(6);
  expect(document.querySelectorAll("[data-boundary-fill]")).toHaveLength(1);
  expect(document.querySelectorAll('[data-survey-line][data-survey-tie="true"]')).toHaveLength(1);
  expect(screen.getByText("POC")).toBeVisible();
  expect(screen.getByText("POB")).toBeVisible();
  expect(screen.getByRole("table", { name: "Boundary Calls" }).querySelectorAll("tbody tr")).toHaveLength(6);
  expect(JSON.stringify(presentationFixture)).toBe(original);
});

it("continues later readable calls as unconfirmed geometry after an unreadable bearing", () => {
  const scene = buildBoundary(interruptedFixture.groups[0], "Parcel 1");
  expect(scene.courses).toHaveLength(6);
  const lines = scene.items.filter(item => item.kind === "line");
  expect(lines).toHaveLength(5);
  expect(lines.map(line => line.confirmed)).toEqual([true, true, false, false, false]);
  expect(scene.closed).not.toBe(true);
  render(<LegalMapContent legal={interruptedFixture} />);
  expect(document.querySelectorAll('[data-survey-line][data-unconfirmed="true"]')).toHaveLength(3);
  expect([...document.querySelectorAll("[data-survey-vertex]")].map(node => node.textContent)).toEqual(["1", "2", "3", "4", "5", "6", "7"]);
  expect(screen.getByText(/schematic/i)).toBeVisible();
});

it("does not create a spurious South course from possessive source text", () => {
  const scene = buildBoundary({ type: "metes_bounds", source: "BEGINNING AT A PIN; NORTH 100 FEET TO OWNER'S 42-10 TRACT; EAST 50 FEET; SOUTH 100 FEET; WEST 50 FEET TO THE PLACE OF BEGINNING." }, "Parcel");
  expect(scene.courses).toHaveLength(4);
  expect(scene.courses?.map(course => course.bearing)).toEqual(["NORTH", "EAST", "SOUTH", "WEST"]);
  expect(scene.closed).toBe(true);
});

it("keeps a known commencement tie distinct even when a later call is incomplete", () => {
  const legal = { parcels_num: 1, groups: [{ type: "metes_bounds", source: "COMMENCING AT A PIN; EAST 20 FEET TO THE TRUE POINT OF BEGINNING; NORTH 100 FEET; NORTH 45 DEGREES EAST TO A PIN; SOUTH 100 FEET; WEST 50 FEET." }] };
  render(<LegalMapContent legal={legal} />);
  const tie = document.querySelector('[data-survey-line][data-survey-tie="true"]');
  expect(tie).toHaveAttribute("stroke-dasharray", "1 5");
  expect(document.querySelectorAll('[data-survey-line][data-unconfirmed="true"]')).toHaveLength(2);
  expect(screen.getByText("Tie line")).toBeVisible();
  expect(screen.getByText("POB")).toBeVisible();
});

it("renders available extracted measurements instead of empty boundary-table headers", () => {
  render(<LegalMapContent legal={{ parcels_num: 2, groups: [10, 14].map(parcel => ({
    type: "metes_bounds", source: "Along the easterly side of the adjoining street.",
    elements: [{ aspect: "bearings", value: "EASTERLY SIDE OF THE STREET", explanation: `Parcel ${parcel}, page 9: street frontage.` }, { aspect: "distances", value: "40 FEET FRONT; 115 FEET DEEP" }],
  })) }} />);
  expect(screen.queryAllByRole("table", { name: "Boundary Calls" })).toHaveLength(0);
  expect(screen.getAllByText("40 ft FRONT; 115 ft DEEP")).toHaveLength(2);
  expect(screen.getAllByText("Sorry, this parcel’s boundary couldn’t be drawn from the available details.")).toHaveLength(2);
  expect(screen.getByRole("heading", { name: "Parcel 10" })).toBeVisible();
  expect(screen.getByRole("heading", { name: "Parcel 14" })).toBeVisible();
  expect(document.querySelector(".legal-map-column")).toBeNull();
  expect(screen.queryByRole("separator")).toBeNull();
  expect(screen.getByRole("region", { name: "Boundary Calls" })).toHaveStyle({ flex: "1 1 0", height: "auto" });
});

it("retains readable extracted courses and their numbers when one metadata bearing is unreadable", () => {
  const scene = buildBoundary({ type: "metes_bounds", elements: [
    { aspect: "bearings", value: "NORTH; NORTH 89 DEGREES 67 MINUTES EAST; SOUTH; WEST" },
    { aspect: "distances", value: "100 FEET; 50 FEET; 100 FEET; 50 FEET" },
  ] }, "Parcel");
  expect(scene.courses).toHaveLength(4);
  expect(scene.items.filter(item => item.kind === "line").map(item => [item.sequence, item.confirmed])).toEqual([[1, true], [3, false], [4, false]]);
  expect(scene.closed).not.toBe(true);
});

it("does not render an empty measurements card for a group with acreage only", () => {
  render(<LegalMapContent legal={{ parcels_num: 2, groups: [presentationFixture.groups[0], { type: "metes_bounds", elements: [{ aspect: "acreage", value: "2 ACRES" }] }] }} />);
  expect(screen.getAllByRole("table", { name: "Boundary Calls" })).toHaveLength(1);
  expect(screen.queryByRole("region", { name: "Parcel 2 extracted measurements" })).toBeNull();
});

it.each(["0 ft", "00'", "0.0 feet", "0 metres"])("never confirms a zero source distance: %s", distance => {
  const scene = buildBoundary({ type: "metes_bounds", source: `BEGINNING AT A PIN; NORTH 100 FEET; EAST ${distance}; SOUTH 100 FEET; WEST 50 FEET.` }, "Parcel");
  expect(scene.courses?.map(course => course.confirmed)).toEqual([true, false, true, true]);
  expect(scene.items.filter(item => item.kind === "line").map(item => item.confirmed)).toEqual([true, false, true, true]);
  expect(scene.courses?.[1].distance).toBe(distance);
});

it("marks every zero metadata distance unconfirmed while retaining positive distances and original text", () => {
  const original = JSON.stringify(zeroFixture);
  const scene = buildBoundary(zeroFixture.groups[0], "Parcel");
  expect(scene.courses?.map(course => course.confirmed)).toEqual([true, false, true, true, false, true, true, false]);
  render(<LegalMapContent legal={zeroFixture} />);
  const rows = screen.getByRole("table", { name: "Boundary Calls" }).querySelectorAll("tbody tr");
  expect(rows).toHaveLength(8);
  for (const index of [1, 4, 7]) {
    expect(rows[index]).toHaveTextContent("00 ft");
    expect(rows[index].lastElementChild).toHaveTextContent(/^Unconfirmed$/);
  }
  expect(document.querySelectorAll('[data-survey-line][data-unconfirmed="true"]')).toHaveLength(3);
  expect(JSON.stringify(zeroFixture)).toBe(original);
});

it("continues to confirm a positive distance smaller than one thousandth of a foot", () => {
  const scene = buildBoundary({ type: "metes_bounds", source: "NORTH 0.0001 FEET; EAST 1 FOOT." }, "Parcel");
  expect(scene.courses?.map(course => course.confirmed)).toEqual([true, true]);
});

it.each([
  { name: "unreadable bearings", legal: interruptedFixture },
  { name: "zero distances", legal: zeroFixture },
])("highlights only unconfirmed table rows for $name", ({ legal }) => {
  const { rerender } = render(<LegalMapContent legal={legal} />);
  const table = screen.getByRole("table", { name: "Boundary Calls" });
  for (const row of table.querySelectorAll("tbody tr")) {
    if (row.lastElementChild!.textContent === "Unconfirmed") expect(row).toHaveStyle({ background: "#fff7ed" });
    else expect(row).not.toHaveStyle({ background: "#fff7ed" });
  }
  expect(table.querySelector("thead tr")).not.toHaveStyle({ background: "#fff7ed" });
  rerender(<LegalMapContent legal={presentationFixture} />);
  for (const row of screen.getByRole("table", { name: "Boundary Calls" }).querySelectorAll("tbody tr")) {
    expect(row.lastElementChild).toHaveTextContent(/^Confirmed$/);
    expect(row).not.toHaveStyle({ background: "#fff7ed" });
  }
});

it.each([true, false])("preserves the screenshot parcel and separates its extra course with source=%s", withSource => {
  const legal = { ...closureFixture, groups: [{ ...closureFixture.groups[0], source: withSource ? closureFixture.groups[0].source : undefined }] };
  const original = JSON.stringify(legal);
  const scene = buildBoundary(legal.groups[0], "Parcel");
  expect(scene.closed).toBe(true);
  expect(scene.beginning).toBe(1);
  expect(scene.courses).toHaveLength(9);
  expect(scene.courses!.map(course => course.confirmed)).toEqual([true, true, true, true, true, true, true, true, false]);
  expect(scene.courses![7].target).toBe(2);
  expect(scene.courses![8].distance).toBe("4726 in");
  const lines = scene.items.filter(item => item.kind === "line");
  const boundary = lines.slice(1, 8);
  const origin = boundary[0].from;
  const acres = Math.abs(boundary.reduce((sum, line) => sum + (line.from.x - origin.x) * (line.to.y - origin.y) - (line.to.x - origin.x) * (line.from.y - origin.y), 0)) / 2 / 4046.8564224;
  expect(acres).toBeCloseTo(30.210, 3);
  render(<LegalMapContent legal={legal} />);
  const plotted = [...document.querySelectorAll("[data-survey-line]")];
  expect(plotted).toHaveLength(9);
  expect(plotted[0]).toHaveAttribute("data-survey-tie", "true");
  expect(plotted[0]).toHaveAttribute("stroke-dasharray", "1 5");
  expect(plotted[7]).toHaveAttribute("x2", String(origin.x));
  expect(plotted[7]).toHaveAttribute("y2", String(origin.y));
  expect(plotted[8]).toHaveAttribute("data-unconfirmed", "true");
  expect(plotted[8]).toHaveAttribute("stroke-dasharray", "6 4");
  expect(plotted[8]).toHaveAttribute("x2", String(lines[8].to.x));
  expect(plotted[8]).toHaveAttribute("y2", String(lines[8].to.y));
  const fill = document.querySelector("[data-boundary-fill]");
  expect(fill).not.toBeNull();
  expect(fill).not.toHaveAttribute("d", expect.stringContaining(String(lines[8].to.y)));
  expect(document.querySelector('[data-survey-point="10"]')).not.toBeNull();
  const rows = screen.getByRole("table", { name: "Boundary Calls" }).querySelectorAll("tbody tr");
  expect(rows[0]).toHaveTextContent("Tie");
  expect(rows[7]).toHaveTextContent("8 → 2");
  expect(rows[8]).toHaveTextContent("9 → 10");
  expect(rows[8].lastElementChild).toHaveTextContent(/^Unconfirmed$/);
  expect(rows[8]).toHaveStyle({ background: "#fff7ed" });
  expect(screen.getByRole("note")).toHaveTextContent(/additional courses.*closed parcel/i);
  expect(screen.getByText("POC")).toBeVisible();
  expect(screen.getByText("POB")).toBeVisible();
  expect(JSON.stringify(legal)).toBe(original);
  expect(screen.getByText("POC")).toHaveAttribute("text-anchor", "start");
});

it.each(["", "EAST 20 FEET; ", "EAST 20 FEET; NORTH 20 FEET; "])("retains closed geometry and marks all following courses unconfirmed after prefix %s", prefix => {
  const scene = buildBoundary({ type: "metes_bounds", source: prefix + "NORTH 100 FEET; EAST 50 FEET; SOUTH 100 FEET; WEST 50 FEET; NORTH 20 FEET; EAST 10 FEET." }, "Parcel");
  expect(scene.closed).toBe(true);
  expect(scene.courses!.slice(-2).map(course => course.confirmed)).toEqual([false, false]);
  expect(scene.courses!.slice(0, -2).every(course => course.confirmed)).toBe(true);
});

it("does not use a later long course to inflate tolerance for an earlier open traverse", () => {
  const scene = buildBoundary({ type: "metes_bounds", source: "NORTH 100 FEET; EAST 50 FEET; SOUTH 100 FEET; WEST 50.301 FEET; EAST 10000 FEET." }, "Parcel");
  expect(scene.closed).not.toBe(true);
  expect(scene.issue).toBeUndefined();
  expect(scene.courses!.every(course => course.confirmed)).toBe(true);
});
