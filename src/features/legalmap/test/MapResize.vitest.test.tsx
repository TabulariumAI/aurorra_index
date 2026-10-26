import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { LegalMapContent } from "../component/LegalMapContent";
import { useMapStore } from "../store/mapStore";
import { incompleteFixture, surveyFixture } from "./surveyFixture";

let measure: () => void;
let height: number;

beforeEach(() => {
  height = 700;
  useMapStore.setState({ detailsRatio: null });
  document.documentElement.style.fontSize = "16px";
  vi.stubGlobal("ResizeObserver", class {
    constructor(private callback: () => void) {}
    observe(node: Element) { if (node.classList.contains("legal-map-content")) measure = this.callback; }
    disconnect() {}
  });
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
    const size = this.classList.contains("legal-map-content") ? height
      : this.classList.contains("legal-map-info") ? this.querySelector("[role=tablist]") ? 203.2 : 147.2
      : this.getAttribute("role") === "separator" ? 6
      : ["tabpanel", "region"].includes(this.getAttribute("role")!) ? 147.2 : 0;
    return { x: 0, y: 0, top: 0, left: 0, right: 800, bottom: size, width: 800, height: size, toJSON() {} };
  });
});

it("shows available acreage without a blank map or splitter when no boundary can be drawn", () => {
  render(<LegalMapContent legal={{ groups: [{ ...incompleteFixture.groups![0], elements: incompleteFixture.groups![0].elements!.filter(element => element.aspect === "acreage") }] }} />);
  expect(screen.queryByRole("separator")).toBeNull();
  expect(document.querySelector(".legal-map-column")).toBeNull();
  expect(screen.getByRole("region", { name: "Acreage" })).toHaveStyle({ flex: "1 1 0", height: "auto" });
  expect(screen.getByRole("alert")).toBeVisible();
});

it("reserves one map viewport when all Lot Block parcels share its scroller", () => {
  render(<LegalMapContent legal={{ parcels_num: 2, groups: ["6", "7"].map(value => ({ type: "lot_block", elements: [{ aspect: "lot", value }] })) }} />);
  act(() => measure());
  expect(screen.getByRole("separator")).toHaveAttribute("aria-valuemax", "438");
});

afterEach(() => {
  document.documentElement.style.fontSize = "";
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

it("keeps the chosen proportion across detail tabs and remeasures the PLSS data panel", () => {
  render(<LegalMapContent legal={surveyFixture} />);
  act(() => measure());
  fireEvent.keyDown(screen.getByRole("separator"), { key: "End" });
  fireEvent.click(screen.getByRole("tab", { name: "Acreage" }));
  expect(Number.parseFloat(screen.getByRole("tabpanel", { name: "Acreage" }).style.height)).toBeCloseTo(382);
  const before = measure;
  fireEvent.click(screen.getByRole("tab", { name: "PLSS" }));
  expect(measure).not.toBe(before);
  act(() => measure());
  expect(screen.getByRole("separator")).toBeVisible();
  expect(Number.parseFloat(screen.getByRole("region", { name: "Details" }).style.height)).toBeCloseTo(438);
});
