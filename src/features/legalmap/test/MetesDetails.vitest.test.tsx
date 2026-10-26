import { fireEvent, render, screen, within } from "@testing-library/react";
import { expect, it } from "vitest";
import { LegalMapContent } from "../component/LegalMapContent";
import { buildBoundary, parseBearing } from "../data/surveyData";
import { curveFixture, sectionFixture } from "./caseFixture";
import { frontageFixture } from "./presentationFixture";

it.each([
  ["NORTH 00 DEGREES 22 MINUTES 00 SECONDS WEST", "627.00 FEET", "N 00°22′00″ W", "627.00 ft"],
  ["SOUTH 71 3/4 DEGREES EAST", "100 FOOT", "S 71 3/4° E", "100 ft"],
  ["N 67 DEG. 05' 05\" E", "30 METRES", "N 67°05′05″ E", "30 m"],
  ["SOUTH", "12 INCHES", "S", "12 in"],
  ["WEST", "20 YARDS", "W", "20 yd"],
  ["EAST", "00'", "E", "00 ft"],
])("abbreviates %s and %s without changing the measurements", (bearing, distance, label, length) => {
  const legal = { parcels_num: 1, groups: [{ type: "metes_bounds", elements: [
    { aspect: "bearings", value: bearing }, { aspect: "distances", value: distance },
  ] }] };
  const original = JSON.stringify(legal);
  render(<LegalMapContent legal={legal} />);
  const cells = screen.getByRole("table", { name: "Boundary Calls" }).querySelectorAll("tbody td");
  expect(cells[2]).toHaveTextContent(label);
  expect(cells[3]).toHaveTextContent(length);
  expect(JSON.stringify(legal)).toBe(original);
});

it("abbreviates extracted measurements when they cannot form a boundary", () => {
  render(<LegalMapContent legal={{ parcels_num: 1, groups: [{ type: "metes_bounds", elements: [
    { aspect: "bearings", value: "EASTERLY SIDE OF EAST 150TH STREET" },
    { aspect: "distances", value: "40 FEET FRONT; 115 FEET DEEP" },
  ] }] }} />);
  expect(screen.getByText("40 ft FRONT; 115 ft DEEP")).toBeVisible();
  expect(screen.getByText("E SIDE OF E 150TH STREET")).toBeVisible();
  expect(screen.queryByRole("table")).toBeNull();
});

it.each([
  ["NORTH 0 FEET; EAST 50 FEET.", 0, "Distance is zero."],
  ["NORTH 91 DEGREES EAST 100 FEET; SOUTH 20 FEET.", 0, "Bearing is unreadable."],
  ["NORTH 100; EAST 20 FEET.", 0, "Distance is missing or unreadable."],
  ["NORTH 100 FEET; THENCE ALONG A CURVE TO THE RIGHT 50 FEET; EAST 30 FEET.", 1, "Curve geometry is incomplete."],
  ["NORTH 100 FEET; NORTH 91 DEGREES EAST 20 FEET; EAST 30 FEET.", 2, "Position depends on an earlier unconfirmed course: Bearing is unreadable."],
  ["NORTH 100 FEET; EAST 50 FEET; SOUTH 100 FEET; WEST 50 FEET; EAST 20 FEET.", 4, "Course follows the closed parcel."],
])("explains the specific unconfirmed cause in %s", async (source, index, reason) => {
  const legal = { parcels_num: 1, groups: [{ type: "metes_bounds", source }] };
  const scene = buildBoundary(legal.groups[0], "Parcel");
  expect(scene.courses![index]).toMatchObject({ confirmed: false, issue: reason });
  render(<LegalMapContent legal={legal} />);
  const row = screen.getByRole("table", { name: "Boundary Calls" }).querySelectorAll("tbody tr")[index];
  const status = within(row as HTMLElement).getByRole("button", { name: "Unconfirmed" });
  fireEvent.focus(status);
  expect(await screen.findByRole("tooltip")).toHaveTextContent(reason);
  fireEvent.keyDown(status, { key: "Escape" });
  expect(screen.queryByRole("tooltip")).toBeNull();
  expect(screen.queryByRole("columnheader", { name: "Issue" })).toBeNull();
});

it("gives the supplied commencement offset and unreadable return separate reasons", () => {
  const scene = buildBoundary(sectionFixture.groups.find(group => group.type === "metes_bounds")!, "Parcel");
  expect(scene.courses![0]).toMatchObject({ confirmed: false, issue: "Commencement offset; not a boundary course." });
  expect(scene.courses!.at(-1)).toMatchObject({ confirmed: false, issue: "Bearing is unreadable." });
  expect(scene.courses!.slice(1, -1).every(course => course.confirmed)).toBe(true);
});

it("explains every provisional curve position in the supplied case", () => {
  const scene = buildBoundary(curveFixture.groups.find(group => group.type === "metes_bounds")!, "Parcel");
  expect(scene.courses!.slice(4).every(course => !course.confirmed && Boolean(course.issue))).toBe(true);
  expect(scene.courses!.slice(0, 4).every(course => course.confirmed && !course.issue)).toBe(true);
});

it("keeps malformed source punctuation unreadable after display formatting", () => {
  expect(parseBearing('South. 89 degrees 48: 00" West')).toBeNull();
});

it.each(["bearings", "distances"])("reads both measurements from either end of %s entries", aspect => {
  const group = { type: "metes_bounds", elements: [{ aspect, value: 'NORTH 100 FEET; 50 FEET EAST; SOUTH 100 FEET; 50 FEET WEST' }] };
  const original = JSON.stringify(group);
  const scene = buildBoundary(group, "Parcel");
  expect(scene.courses).toHaveLength(4);
  expect(scene.courses!.map(course => parseBearing(course.bearing))).toEqual([0, 90, 180, 270]);
  expect(scene.courses!.map(course => course.distance)).toEqual(["100 FEET", "50 FEET", "100 FEET", "50 FEET"]);
  expect(scene.closed).toBe(true);
  expect(scene.items.filter(item => item.kind === "line")).toHaveLength(4);
  expect(JSON.stringify(group)).toBe(original);
});

it.each(["bearings", "distances"])("distinguishes DMS angles from embedded lengths in %s", aspect => {
  const scene = buildBoundary({ type: "metes_bounds", elements: [{ aspect, value: 'NORTH 12°34\'56" EAST 123.45 FEET; 67.89 METERS SOUTH 23°45\'12" WEST' }] }, "Parcel");
  expect(scene.courses).toHaveLength(2);
  expect(scene.courses!.map(course => course.distance)).toEqual(["123.45 FEET", "67.89 METERS"]);
  expect(scene.courses!.every(course => course.confirmed)).toBe(true);
});

it.each(["bearings", "distances"])("retains repeated courses in embedded %s JSON arrays", aspect => {
  const scene = buildBoundary({ type: "metes_bounds", elements: [{ aspect, value: JSON.stringify(["NORTH 40 FEET", "60 FEET NORTH", "EAST 50 FEET", "100 FEET SOUTH", "WEST 50 FEET"]) }] }, "Parcel");
  expect(scene.courses).toHaveLength(5);
  expect(scene.courses!.map(course => course.distance)).toEqual(["40 FEET", "60 FEET", "50 FEET", "100 FEET", "50 FEET"]);
  expect(scene.closed).toBe(true);
});

it.each(["bearings", "distances"])("preserves bearing punctuation and thousands separators in %s", aspect => {
  const scene = buildBoundary({ type: "metes_bounds", elements: [{ aspect, value: 'NORTH 12°34\'56", EAST 1,000 FEET; 200 FEET WEST' }] }, "Parcel");
  expect(scene.courses).toHaveLength(2);
  expect(scene.courses!.map(course => course.distance)).toEqual(["1,000 FEET", "200 FEET"]);
  expect(scene.courses!.every(course => course.confirmed)).toBe(true);
});

it("combines embedded and separate fields once without duplicating courses", () => {
  const scene = buildBoundary({ type: "metes_bounds", elements: [
    { aspect: "bearings", value: "NORTH 100 FEET; EAST 50 FEET; SOUTH; WEST" },
    { aspect: "distances", value: "100 FEET; 50 FEET; 100 FEET SOUTH; 50 FEET WEST" },
  ] }, "Parcel");
  expect(scene.courses).toHaveLength(4);
  expect(scene.closed).toBe(true);
  expect(scene.courses!.every(course => course.confirmed)).toBe(true);
});

it("retains the four frontage rows and draws only the supplied N/S directions as schematic", () => {
  const original = JSON.stringify(frontageFixture);
  const scene = buildBoundary(frontageFixture.groups[0], "Parcel");
  expect(scene.courses).toHaveLength(4);
  expect(scene.courses!.map(course => course.distance)).toEqual(["40 FEET", "140.44 FEET", "140.50 FEET", "40 FEET"]);
  expect(scene.courses!.every(course => !course.confirmed && Boolean(course.issue))).toBe(true);
  expect(scene.closed).not.toBe(true);
  expect(scene.schematic).toBe(true);
  const lines = scene.items.filter(item => item.kind === "line");
  expect(lines.map(line => line.sequence)).toEqual([2, 3]);
  expect(lines[0].to.y - lines[0].from.y).toBeCloseTo(-140.44 * 0.3048);
  expect(lines[1].to.y - lines[1].from.y).toBeCloseTo(140.50 * 0.3048);
  render(<LegalMapContent legal={frontageFixture} />);
  const rows = screen.getByRole("table", { name: "Boundary Calls" }).querySelectorAll("tbody tr");
  expect(rows).toHaveLength(4);
  expect(rows[0]).toHaveTextContent("FRONT");
  expect(rows[3]).toHaveTextContent("REAR");
  expect(rows[1].children[2]).toHaveTextContent(/^N$/);
  expect(rows[2].children[2]).toHaveTextContent(/^S$/);
  expect(document.querySelectorAll('[data-survey-line][data-unconfirmed="true"][stroke-dasharray="6 4"]')).toHaveLength(2);
  expect(document.querySelector("[data-boundary-fill]")).toBeNull();
  expect(JSON.stringify(frontageFixture)).toBe(original);
});

it("retains unreadable embedded bearings and zero distances for review", () => {
  const scene = buildBoundary({ type: "metes_bounds", elements: [{ aspect: "bearings", value: "NORTH 100 FEET; NORTH 91 DEGREES EAST 25 FEET; EAST 0 FEET; SOUTH 50 FEET" }] }, "Parcel");
  expect(scene.courses).toHaveLength(4);
  expect(scene.courses!.map(course => course.confirmed)).toEqual([true, false, false, false]);
  expect(scene.courses![1].distance).toBe("25 FEET");
  expect(scene.courses![1].issue).toBe("Bearing is unreadable.");
  expect(scene.courses![2].issue).toBe("Distance is zero.");
});
