import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LegalMapContent } from "../component/LegalMapContent";
import * as metesData from "../data/metesData";
import type { BoundaryInput, ReconstructedBoundary } from "../type/metes.types";
import { curveFixture } from "./caseFixture";
import { reconstructionFixtures } from "./reconstructionFixture";

const { buildMatrix, reconstructBoundary } = metesData;
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = "BEGINNING at a pin; THENCE NORTH 100 FEET; THENCE EAST 50 FEET; THENCE SOUTH 100 FEET; THENCE WEST 50 FEET to the point of beginning.";

const cases: { name: string; input: BoundaryInput; expected: ReconstructedBoundary }[] = JSON.parse(readFileSync(path.join(root, "test/metesMath.json"), "utf8"));
function boundaryValues(boundary: ReconstructedBoundary) {
  return {
    beginning: boundary.beginning, closed: boundary.closed, method: boundary.method, completion: boundary.completion,
    closureMetres: boundary.closureMetres, calculatedAcres: boundary.calculatedAcres,
    courses: boundary.courses.map(course => ({ angle: course.angle, metres: course.metres, synthetic: course.synthetic, issue: course.issue })),
  };
}

describe("isolated supplied Metes reconstruction", () => {
  it.each(cases)("matches the supplied calculation for $name", ({ input, expected }) => {
    const original = JSON.stringify(input);
    expect(boundaryValues(reconstructBoundary(input))).toEqual(boundaryValues(expected));
    expect(JSON.stringify(input)).toBe(original);
  });
  it("owns parsing, reconstruction and coordinates in one Metes data file", () => {
    for (const file of ["boundaryGeometry.ts", "boundaryMatrix.ts", "boundaryReconstruction.ts"]) {
      expect(existsSync(path.join(root, "data", file))).toBe(false);
    }
    const data = readFileSync(path.join(root, "data/metesData.ts"), "utf8");
    expect(data).not.toMatch(/from ["'][^"']*(?:boundaryGeometry|boundaryMatrix|boundaryReconstruction|plssData|platData)/);
    const drawer = readFileSync(path.join(root, "component/MetesMap.tsx"), "utf8");
    expect(drawer).not.toMatch(/reconstructBoundary|solveMatrix|parseBearing|parseDistance/);
  });

  it("retains the existing curve scene", () => {
    expect(JSON.parse(JSON.stringify(buildMatrix(curveFixture.groups.find(group => group.type === "metes_bounds")!, "Parcel")))).toEqual(JSON.parse(readFileSync(path.join(root, "test/curveContract.json"), "utf8")));
  });

  it("keeps a measured source rectangle confirmed", () => {
    const result = reconstructBoundary({ source, bearings: [], distances: [] });
    expect(result).toMatchObject({ beginning: 0, closed: true, method: "source", completion: "measured" });
    expect(result.courses).toHaveLength(4);
    expect(result.courses.every(course => course.issue === undefined)).toBe(true);
    expect(result.calculatedAcres).toBeCloseTo(5000 / 43560, 12);
    expect(result.closureMetres).toBeLessThan(1e-12);
  });

  it("preserves the source sides and adds exactly one unconfirmed closing border", () => {
    const result = reconstructBoundary({ source: source.slice(0, source.indexOf("THENCE WEST")), bearings: [], distances: [] });
    expect(result).toMatchObject({ closed: true, completion: "partial" });
    expect(result.courses.map(course => course.distance)).toEqual(["100 FEET", "50 FEET", "100 FEET", "15.240000000000 m"]);
    expect(result.courses.slice(0, 3).every(course => !course.issue)).toBe(true);
    expect(result.courses[3]).toMatchObject({ synthetic: true, issue: expect.stringMatching(/synthetic closing border/i) });
    expect(result.closureMetres).toBeCloseTo(15.24, 12);
  });

  it("retains measured misclosure when schematic completion is disabled", () => {
    const result = reconstructBoundary({ source: source.replace("WEST 50 FEET", "WEST 49 FEET"), bearings: [], distances: [], allowSchematic: false });
    expect(result).toMatchObject({ closed: false, completion: "open" });
    expect(result.courses).toHaveLength(4);
    expect(result.closureMetres).toBeCloseTo(0.3048, 12);
  });

  it("retains source cardinal calls without THENCE", () => {
    const result = reconstructBoundary({ source: source.replaceAll("THENCE ", ""), bearings: [], distances: [] });
    expect(result.closed).toBe(true);
    expect(result.courses.map(course => course.distance)).toEqual(["100 FEET", "50 FEET", "100 FEET", "50 FEET"]);
  });

  it("reads inline pairs from both extracted fields", () => {
    const result = reconstructBoundary({ bearings: ["NORTH 40 FEET; EAST 30 FEET"], distances: ["SOUTH 53.13010235415598 DEGREES WEST 50 FEET"] });
    expect(result.closed).toBe(true);
    expect(result.courses).toHaveLength(3);
    expect(result.courses.every(course => course.issue)).toBe(true);
  });

  it("keeps unsupported extracted associations unconfirmed", () => {
    const result = reconstructBoundary({ bearings: ["NORTH; EAST; SOUTH; WEST"], distances: ["100 FEET; 50 FEET; 100 FEET; 50 FEET"] });
    expect(result.closed).toBe(true);
    expect(result.courses.every(course => /source evidence not available/.test(course.issue!))).toBe(true);
  });

  it.each(["closing", "acreage", "partial", "source"])("draws the prepared %s parcel without a second solver", name => {
    const original = JSON.stringify(reconstructionFixtures[name]);
    const scene = buildMatrix(reconstructionFixtures[name], "Parcel");
    render(<LegalMapContent legal={{ parcels_num: 1, groups: [reconstructionFixtures[name]] }} />);
    expect(scene.closed).toBe(true);
    expect(document.querySelectorAll("[data-survey-line]")).toHaveLength(scene.items.length);
    expect(document.querySelectorAll('[data-survey-line][data-unconfirmed="true"]')).toHaveLength(scene.items.filter(line => !line.confirmed).length);
    expect(document.querySelector("[data-boundary-fill]")).not.toBeNull();
    expect(screen.queryByRole("alert")).toBeNull();
    expect(JSON.stringify(reconstructionFixtures[name])).toBe(original);
  });
});
