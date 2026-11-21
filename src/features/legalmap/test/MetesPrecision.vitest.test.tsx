import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { MetesDetails } from "../component/MetesDetails";
import { buildMatrix, formatMeasure, parseBearing, parseDistance, reconstructBoundary } from "../data/metesData";
import { reconstructionFixtures } from "./reconstructionFixture";

it.each([
  ["N 90.000000000000° E", true, "N 90° E"],
  ["S 0.000000000000° E", true, "S 0° E"],
  ["N 12.345678901234° W", true, "N 12.35° W"],
  ["N 89.999999999999° E", true, "N 90° E"],
  ["1695.787773796427 m", false, "1695.79 m"],
  ["100.584000000000 m", false, "100.58 m"],
  ["10.200000000000 m", false, "10.2 m"],
  ["10.000000000000 m", false, "10 m"],
  ["0.004900000000 m", false, "0 m"],
])("limits generated display precision for %s", (source, angular, expected) => {
  expect(formatMeasure(source, angular, true)).toBe(expected);
  expect(formatMeasure(source, angular)).toBe(source);
});

it.each(["acreage", "partial", "closing"])("formats only generated rows in the %s construction without mutating its geometry", name => {
  const group = reconstructionFixtures[name];
  const scene = buildMatrix(group, "Parcel");
  const original = JSON.stringify(scene);
  const boundary = reconstructBoundary({ source: group.source!, bearings: [], distances: [],
    acreage: group.elements?.filter(element => element.aspect === "acreage").map(element => element.value!).join("; ") });
  render(<MetesDetails scenes={[scene]} active="Boundary Calls" showParcels={false} />);
  const rows = screen.getByRole("table", { name: "Boundary Calls" }).querySelectorAll("tbody tr");
  expect(rows).toHaveLength(boundary.courses.length);
  for (const [index, course] of boundary.courses.entries()) {
    expect(scene.courses[index].bearing).toBe(course.bearing);
    expect(scene.courses[index].distance).toBe(course.distance);
    expect(scene.courses[index].synthetic).toBe(course.synthetic);
    if (course.synthetic) {
      expect(rows[index].children[2].textContent).not.toMatch(/\d+\.\d{3}/);
      expect(rows[index].children[3].textContent).not.toMatch(/\d+\.\d{3}/);
      expect(rows[index].children[2].textContent).not.toMatch(/\.\d*0°/);
      expect(rows[index].children[3].textContent).not.toMatch(/\.\d*0 m/);
      expect(rows[index]).toHaveTextContent("Unconfirmed");
      expect(scene.items[index].bearing).toBe(course.bearing);
      expect(scene.items[index].distance).toBe(course.distance);
    } else {
      expect(rows[index].children[2]).toHaveTextContent(formatMeasure(course.bearing, true));
      expect(rows[index].children[3]).toHaveTextContent(formatMeasure(course.distance!, false));
    }
  }
  expect(JSON.stringify(scene)).toBe(original);
  expect(scene.calculatedAcres).toBe(boundary.calculatedAcres);
  expect(scene.closureMetres).toBe(boundary.closureMetres);
});

it("retains source precision beside generated rows and during parsing", () => {
  const bearing = "NORTH 12.345678901234 DEGREES EAST";
  const distance = "627.001234567890 FEET";
  const group = { type: "metes_bounds", source: `BEGINNING at a pin; THENCE ${bearing} ${distance}.`, elements: [{ aspect: "acreage", value: "1 ACRE" }] };
  const original = JSON.stringify(group);
  const scene = buildMatrix(group, "Parcel");
  render(<MetesDetails scenes={[scene]} active="Boundary Calls" showParcels={false} />);
  const rows = screen.getByRole("table", { name: "Boundary Calls" }).querySelectorAll("tbody tr");
  expect(rows).toHaveLength(4);
  expect(rows[0].children[2]).toHaveTextContent("N 12.345678901234° E");
  expect(rows[0].children[3]).toHaveTextContent("627.001234567890 ft");
  expect(scene.courses[0].synthetic).toBeUndefined();
  expect(scene.courses.slice(1).every(course => course.synthetic)).toBe(true);
  expect(parseBearing(bearing)).toBe(12.345678901234);
  expect(parseDistance(distance)).toBe(627.001234567890 * 0.3048);
  expect(JSON.stringify(group)).toBe(original);
});

it("preserves precision on unconfirmed extracted measurements", () => {
  const scene = buildMatrix({ type: "metes_bounds", elements: [
    { aspect: "bearings", value: "N 12.345678901234° E" },
    { aspect: "distances", value: "627.001234567890 FEET" },
  ] }, "Parcel");
  render(<MetesDetails scenes={[scene]} active="Boundary Calls" showParcels={false} />);
  const row = screen.getByRole("table", { name: "Boundary Calls" }).querySelector("tbody tr")!;
  expect(row.children[2]).toHaveTextContent("N 12.345678901234° E");
  expect(row.children[3]).toHaveTextContent("627.001234567890 ft");
  expect(row).toHaveTextContent("Unconfirmed");
  expect(scene.courses[0].synthetic).toBeUndefined();
});
