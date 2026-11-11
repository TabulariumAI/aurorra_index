import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { buildMatrix } from "../data/metesData";
import { LegalMapContent } from "../component/LegalMapContent";
import { presentationFixture, interruptedFixture, zeroFixture, closureFixture } from "./presentationFixture";

it("preserves the six extracted courses, filled parcel, commencement tie and start labels", () => {
  const original = JSON.stringify(presentationFixture);
  const scene = buildMatrix(presentationFixture.groups[0], "Parcel 1");
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

it("illustrates readable source courses and retains the unreadable course as unassigned", () => {
  const scene = buildMatrix(interruptedFixture.groups[0], "Parcel 1");
  expect(scene.closed).toBe(true);
  expect(scene.completion).toBe("partial");
  expect(scene.courses).toHaveLength(7);
  expect(scene.items.map(item => item.confirmed)).toEqual([true, true, true, true, true, false]);
  expect(scene.courses.at(-1)).toMatchObject({ unassigned: true, confirmed: false, issue: "Bearing is unreadable." });
  render(<LegalMapContent legal={interruptedFixture} />);
  expect(document.querySelectorAll('[data-survey-line][data-unconfirmed="true"]')).toHaveLength(1);
  expect(screen.getByRole("table", { name: "Boundary Calls" })).toHaveTextContent("Unassigned");
  expect(document.querySelector("[data-boundary-fill]")).not.toBeNull();
});

it("does not create a spurious South course from possessive source text", () => {
  const scene = buildMatrix({ type: "metes_bounds", source: "BEGINNING AT A PIN; NORTH 100 FEET TO OWNER'S 42-10 TRACT; EAST 50 FEET; SOUTH 100 FEET; WEST 50 FEET TO THE PLACE OF BEGINNING." }, "Parcel");
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

it("retains an unreadable extracted bearing separately from the illustrated outline", () => {
  const scene = buildMatrix({ type: "metes_bounds", elements: [
    { aspect: "bearings", value: "NORTH; NORTH 89 DEGREES 67 MINUTES EAST; SOUTH; WEST" },
    { aspect: "distances", value: "100 FEET; 50 FEET; 100 FEET; 50 FEET" },
  ] }, "Parcel");
  expect(scene.completion).toBe("partial");
  expect(scene.courses).toHaveLength(5);
  expect(scene.courses.every(course => !course.confirmed)).toBe(true);
  expect(scene.courses.at(-1)).toMatchObject({ distance: "50 FEET", unassigned: true, issue: "Bearing is unreadable." });
  expect(scene.items).toHaveLength(4);
});

it("renders unconfirmed acreage-template calls instead of an empty measurements card", () => {
  render(<LegalMapContent legal={{ parcels_num: 2, groups: [presentationFixture.groups[0], { type: "metes_bounds", elements: [{ aspect: "acreage", value: "2 ACRES" }] }] }} />);
  const tables = screen.getAllByRole("table", { name: "Boundary Calls" });
  expect(tables).toHaveLength(2);
  expect(tables[1].querySelectorAll("tbody tr")).toHaveLength(4);
  expect([...tables[1].querySelectorAll("tbody tr")].every(row => row.textContent?.includes("Unconfirmed"))).toBe(true);
  expect(screen.queryByRole("region", { name: "Parcel 2 extracted measurements" })).toBeNull();
});

it.each(["0 ft", "00'", "0.0 feet", "0 metres"])("retains a zero source distance as unassigned: %s", distance => {
  const scene = buildMatrix({ type: "metes_bounds", source: `BEGINNING AT A PIN; NORTH 100 FEET; EAST ${distance}; SOUTH 100 FEET; WEST 50 FEET.` }, "Parcel");
  expect(scene.courses.find(course => course.distance === distance)).toMatchObject({ confirmed: false, unassigned: true, issue: "Distance is zero." });
  expect(scene.items.some(item => item.distance === distance)).toBe(false);
  expect(scene.completion).toBe("partial");
});

it("retains every zero metadata distance as unassigned beside the illustrated boundary", () => {
  const original = JSON.stringify(zeroFixture);
  const scene = buildMatrix(zeroFixture.groups[0], "Parcel");
  expect(scene.courses.every(course => !course.confirmed)).toBe(true);
  expect(scene.courses.filter(course => course.distance === "00'")).toHaveLength(3);
  expect(scene.courses.filter(course => course.distance === "00'").every(course => course.unassigned && course.issue === "Distance is zero.")).toBe(true);
  render(<LegalMapContent legal={zeroFixture} />);
  const rows = screen.getByRole("table", { name: "Boundary Calls" }).querySelectorAll("tbody tr");
  expect(rows).toHaveLength(9);
  for (const row of [...rows].filter(row => row.textContent!.includes("00 ft"))) {
    expect(row).toHaveTextContent("Unassigned");
    expect(row.lastElementChild).toHaveTextContent(/^Unconfirmed$/);
  }
  expect(document.querySelectorAll('[data-survey-line][data-unconfirmed="true"]')).toHaveLength(6);
  expect(JSON.stringify(zeroFixture)).toBe(original);
});

it("continues to confirm a positive distance smaller than one thousandth of a foot", () => {
  const scene = buildMatrix({ type: "metes_bounds", source: "NORTH 0.0001 FEET; EAST 1 FOOT." }, "Parcel");
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

it.each([true, false])("uses the supplied reconstruction and retains original measurements with source=%s", withSource => {
  const legal = { ...closureFixture, groups: [{ ...closureFixture.groups[0], source: withSource ? closureFixture.groups[0].source : undefined }] };
  const original = JSON.stringify(legal);
  const scene = buildMatrix(legal.groups[0], "Parcel");
  expect(scene).toMatchObject({ closed: true, beginning: 1, completion: withSource ? "partial" : "measured" });
  expect(scene.calculatedAcres).toBeCloseTo(30.210, 3);
  expect(scene.courses).toHaveLength(withSource ? 10 : 9);
  expect(scene.courses.find(course => course.distance === "4726 in")).toBeDefined();
  expect(scene.courses[scene.ending! - 1].target).toBe(2);
  expect(scene.items.filter(item => !item.confirmed)).toHaveLength(withSource ? 1 : 8);
  render(<LegalMapContent legal={legal} />);
  const plotted = document.querySelectorAll("[data-survey-line]");
  expect(plotted).toHaveLength(withSource ? 10 : 8);
  expect(plotted[0]).toHaveAttribute("data-survey-tie", "true");
  expect(plotted[scene.ending! - 1]).toHaveAttribute("x2", String(scene.items[scene.ending! - 1].to.x));
  expect(document.querySelector("[data-boundary-fill]")).not.toBeNull();
  expect(screen.getByRole("table", { name: "Boundary Calls" }).querySelectorAll("tbody tr")).toHaveLength(withSource ? 10 : 9);
  expect(screen.getByRole("note")).toHaveTextContent(withSource ? /synthetic closing border/i : /excluded as unassigned/i);
  expect(screen.getByText("POC")).toBeVisible();
  expect(screen.getByText("POB")).toBeVisible();
  expect(JSON.stringify(legal)).toBe(original);
});

it.each(["", "EAST 20 FEET; ", "EAST 20 FEET; NORTH 20 FEET; "])("retains an explicitly delimited parcel and later calls after prefix %s", prefix => {
  const scene = buildMatrix({ type: "metes_bounds", source: prefix.replace(/;\s*$/, " TO THE POINT OF BEGINNING; ") + "NORTH 100 FEET; EAST 50 FEET; SOUTH 100 FEET; WEST 50 FEET TO THE POINT OF BEGINNING; NORTH 20 FEET; EAST 10 FEET." }, "Parcel");
  expect(scene.closed).toBe(true);
  expect(scene.courses!.slice(-2).map(course => course.confirmed)).toEqual([false, false]);
  expect(scene.courses!.slice(0, scene.beginning).every(course => course.confirmed)).toBe(true);
  expect(scene.courses!.slice(scene.beginning, -2).every(course => course.confirmed)).toBe(true);
});

it("does not use a later long course to inflate tolerance for an earlier open traverse", () => {
  const scene = buildMatrix({ type: "metes_bounds", source: "NORTH 100 FEET; EAST 50 FEET; SOUTH 100 FEET; WEST 50.301 FEET; EAST 10000 FEET." }, "Parcel");
  expect(scene.closed).not.toBe(true);
  expect(scene.issue).toMatch(/remains open/i);
  expect(scene.courses!.every(course => course.confirmed)).toBe(true);
});
