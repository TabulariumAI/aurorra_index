import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LegalMapContent } from "../component/LegalMapContent";
import { normalizeLegalData } from "../data/legalData";
import { buildBoundary, buildPlss } from "../data/surveyData";
import { curveFixture, sectionFixture } from "./caseFixture";

describe("reported map regressions", () => {
  it("keeps address text inside Google without an external heading or details", () => {
    const address = "10346 Country Lane, Beach Park, IL 60087";
    render(<LegalMapContent legal={{ parcels_num: 1 }} addressMaps={[{ address, content: <iframe title="Address map" /> }]} />);
    expect(screen.getByTitle("Address map")).toBeVisible();
    expect(screen.queryByRole("heading")).toBeNull();
    expect(screen.queryByText(address)).toBeNull();
    expect(screen.queryByRole("table")).toBeNull();
    expect(screen.queryByRole("separator")).toBeNull();
  });

  it.each([1, 9, 10, 15, 36])("reads numeric section %s from its explicit field", section => {
    const scene = buildPlss({ type: "plss", elements: [{ aspect: "section", value: String(section) }] }, "Parcel");
    expect(scene.issue).toBeUndefined();
    expect(scene.items.find(item => item.kind === "rect" && item.role === "section" && item.label === String(section))).toMatchObject({ highlighted: true });
    expect(scene.items.filter(item => item.kind === "rect" && item.role === "area")).toHaveLength(1);
  });

  it.each(["0", "37", "unknown"])("rejects an invalid explicit section %s", value => {
    expect(buildPlss({ type: "plss", elements: [{ aspect: "section", value }] }, "Parcel").issue).toMatch(/no section/);
  });

  it("combines Sections 9 and 10 in one map for the supplied one-parcel payload", () => {
    const original = JSON.stringify(sectionFixture);
    render(<LegalMapContent legal={sectionFixture} />);
    fireEvent.click(screen.getByRole("tab", { name: "PLSS" }));
    expect(screen.getAllByRole("img", { name: /schematic/ })).toHaveLength(1);
    expect(screen.queryByRole("alert")).toBeNull();
    for (const section of [9, 10]) {
      expect(document.querySelectorAll(`[data-survey-section-area="${section}"]`)).toHaveLength(1);
      expect(document.querySelector(`[data-survey-section-area="${section}"]`)).toHaveAttribute("fill", "#f3edcf");
    }
    expect(screen.getAllByRole("table", { name: "Details" })).toHaveLength(2);
    expect(JSON.stringify(sectionFixture)).toBe(original);
  });

  it("keeps PLSS groups in separate maps for two parcels", () => {
    render(<LegalMapContent legal={{ ...sectionFixture, parcels_num: 2 }} />);
    fireEvent.click(screen.getByRole("tab", { name: "PLSS" }));
    expect(screen.getAllByRole("img", { name: /schematic/ })).toHaveLength(2);
  });

  it("retains aliquots when their section is supplied as a separate numeric field", () => {
    const scene = buildPlss(curveFixture.groups![0], "Parcel");
    expect(scene.issue).toBeUndefined();
    expect(scene.items.filter(item => item.kind === "rect" && item.role === "area")).toHaveLength(3);
    expect(scene.items.filter(item => item.kind === "rect" && item.role === "division")).toHaveLength(6);
  });

  it.each(["A", "Tract B"])("renders tract %s at the block level, retaining its lots and legend", value => {
    const legal = { parcels_num: 1, groups: [{ type: "lot_block", elements: [
      { aspect: "subdivision", value: "Chestnut Hill" }, { aspect: "unit", value: "1" },
      { aspect: "tract", value }, { aspect: "lot", value: "3" },
    ] }] };
    const view = normalizeLegalData(legal);
    expect(view.presentLayers.has("tract")).toBe(true);
    render(<LegalMapContent legal={legal} />);
    const label = document.querySelector("[data-legal-map-tract-label]");
    expect(label).toHaveTextContent(value.replace(/^Tract /, ""));
    expect(label!.closest("[data-legal-map-block]")).toContainElement(document.querySelector("[data-legal-map-lot]"));
    expect(within(document.querySelector<HTMLElement>(".legal-map-legend")!).getByText("Tract")).toBeVisible();
    expect(screen.getByRole("table", { name: "Details" })).toHaveTextContent(value);
  });

  it("keeps Block and Tract identifiers together without merging distinct tracts", () => {
    render(<LegalMapContent legal={{ parcels_num: 2, groups: ["A", "B"].map(tract => ({ type: "lot_block", elements: [
      { aspect: "block", value: "4" }, { aspect: "tract", value: tract }, { aspect: "lot", value: "7" },
    ] })) }} />);
    expect(document.querySelectorAll("[data-legal-map-tract-label]")).toHaveLength(2);
    for (const block of document.querySelectorAll("[data-legal-map-block]")) {
      expect(block.querySelector("[data-legal-map-block-label]")).toHaveTextContent("4");
      expect(block.querySelector("[data-legal-map-tract-label]")).not.toBeNull();
    }
  });

  it("retains all six Bennington distances and draws the unresolved return as unconfirmed", () => {
    const group = sectionFixture.groups!.find(group => group.type === "metes_bounds")!;
    const original = JSON.stringify(group);
    const scene = buildBoundary(group, "Parcel");
    expect(scene.courses).toHaveLength(6);
    expect(scene.courses!.map(course => course.distance)).toEqual(["1181.05 feet", "627.00 feet", "617.00 feet", "648.83 feet", "217.00 feet", "350.00 feet"]);
    render(<LegalMapContent legal={{ parcels_num: 1, groups: [group] }} />);
    const rows = within(screen.getByRole("table", { name: "Boundary Calls" })).getAllByRole("row");
    expect(rows).toHaveLength(7);
    expect(rows.at(-1)).toHaveTextContent("350.00 ft");
    expect(rows.at(-1)).toHaveTextContent("Unconfirmed");
    expect(rows.at(-1)).toHaveTextContent("6 → 2");
    expect(document.querySelectorAll("[data-survey-line]")).toHaveLength(6);
    expect(document.querySelector("[data-survey-line][data-unconfirmed]")).not.toBeNull();
    expect(document.querySelector("[data-boundary-fill]")).toBeNull();
    expect(JSON.stringify(group)).toBe(original);
  });

  it("retains every measured curve and later course in the supplied Parcel A source", () => {
    const group = curveFixture.groups!.find(group => group.type === "metes_bounds")!;
    const scene = buildBoundary(group, "Parcel");
    expect(scene.courses).toHaveLength(27);
    expect(scene.courses!.map(course => course.distance)).toContain("218.96 feet");
    expect(scene.courses!.map(course => course.distance)).not.toContain("21'");
    expect(scene.courses!.map(course => course.distance)).not.toContain("756.71 feet");
    expect(scene.courses!.slice(0, 4).every(course => course.confirmed)).toBe(true);
    expect(scene.courses!.slice(4).every(course => !course.confirmed)).toBe(true);
    expect(scene.beginning).toBe(15);
    render(<LegalMapContent legal={{ parcels_num: 1, groups: [group] }} />);
    expect(document.querySelectorAll("[data-survey-line]")).toHaveLength(27);
    expect(document.querySelectorAll("[data-survey-arc]")).toHaveLength(12);
    expect(document.querySelectorAll("[data-survey-line][data-unconfirmed]").length).toBeGreaterThan(0);
    expect(screen.getByRole("table", { name: "Boundary Calls" })).toHaveTextContent("77.94 ft");
    expect(document.querySelector("[data-boundary-fill]")).toBeNull();
    expect(document.querySelector("[data-survey-label]")).not.toBeNull();
  });

  it.each(["left", "right"])("places a %s curve from its source radius and arc length", direction => {
    const scene = buildBoundary({ type: "metes_bounds", source: `BEGINNING AT A PIN; NORTH 100 FEET TO THE P.C. OF A CURVE TO THE ${direction} HAVING A RADIUS OF 100 FEET; THENCE ALONG SAID CURVE 157.07963267949 FEET TO THE P.T.; THENCE EAST 50 FEET.` }, "Parcel");
    const lines = scene.items.filter(item => item.kind === "line");
    expect(lines).toHaveLength(3);
    expect(lines[1].to.x).toBeCloseTo(direction === "right" ? 30.48 : -30.48, 6);
    expect(lines[1].to.y).toBeCloseTo(-60.96, 6);
    expect(lines[2].from).toEqual(lines[1].to);
    expect(lines[2].to.x - lines[2].from.x).toBeCloseTo(15.24, 6);
  });

  it("continues a split curve through the source True Point of Beginning", () => {
    const scene = buildBoundary({ type: "metes_bounds", source: "NORTH 100 FEET TO THE P.C. OF A CURVE TO THE RIGHT HAVING A RADIUS OF 100 FEET; THENCE ALONG SAID CURVE 78.539816339745 FEET TO THE TRUE POINT OF BEGINNING; THENCE CONTINUING ALONG SAID CURVE 78.539816339745 FEET TO THE P.T.; THENCE EAST 50 FEET." }, "Parcel");
    const lines = scene.items.filter(item => item.kind === "line");
    expect(lines).toHaveLength(4);
    expect(lines[2].to.x).toBeCloseTo(30.48, 6);
    expect(lines[2].to.y).toBeCloseTo(-60.96, 6);
    expect(scene.beginning).toBe(2);
    expect(scene.courses!.slice(1).every(course => !course.confirmed)).toBe(true);
    expect(scene.closed).not.toBe(true);
  });
});
