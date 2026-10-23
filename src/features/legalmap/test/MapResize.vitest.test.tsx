import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { LegalMapContent } from "../component/LegalMapContent";
import { incompleteFixture, surveyFixture } from "./surveyFixture";
import { useMapStore } from "../store/mapStore";

let measure: () => void;
let height: number;
let mapHeight: number;
let drawingHeight: number;

beforeEach(() => {
  height = 700;
  mapHeight = 0;
  drawingHeight = 0;
  useMapStore.setState({ detailsRatio: null });
  document.documentElement.style.fontSize = "16px";
  vi.stubGlobal("ResizeObserver", class {
    constructor(private callback: () => void) {}
    observe(node: Element) { if (node.classList.contains("legal-map-content")) measure = this.callback; }
    disconnect() {}
  });
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
    const size = this.classList.contains("legal-map-content") ? height
      : this.classList.contains("legal-map-column") ? mapHeight
      : this.hasAttribute("data-legal-map-drawing") ? drawingHeight
      : this.classList.contains("legal-map-info") ? 203.2
      : this.getAttribute("role") === "separator" ? 6
      : this.getAttribute("role") === "tabpanel" ? 147.2 : 0;
    return { x: 0, y: 0, top: 0, left: 0, right: 800, bottom: size, width: 800, height: size, toJSON() {} };
  });
});

it("reserves drawing and annotation space before allowing the details area to grow", () => {
  mapHeight = 384;
  drawingHeight = 128;
  render(<LegalMapContent legal={surveyFixture} />);
  act(() => measure());
  const divider = screen.getByRole("separator");
  expect(divider).toHaveAttribute("aria-valuemax", "286");
  fireEvent.keyDown(divider, { key: "End" });
  expect(Number.parseFloat(screen.getByRole("tabpanel", { name: "Boundary Calls" }).style.height)).toBeCloseTo(286);
});

it("allows available acreage to grow when an incomplete boundary has no drawing", () => {
  mapHeight = 500;
  render(<LegalMapContent legal={{ groups: [incompleteFixture.groups![0]] }} />);
  act(() => measure());
  const divider = screen.getByRole("separator");
  expect(divider).toHaveAttribute("aria-valuemax", "382");
  fireEvent.keyDown(divider, { key: "End" });
  expect(Number.parseFloat(screen.getByRole("tabpanel", { name: "Acreage" }).style.height)).toBeCloseTo(382);
});

afterEach(() => {
  document.documentElement.style.fontSize = "";
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

it("keeps the summary outside the resize area and links the divider to both panels", () => {
  render(<LegalMapContent legal={surveyFixture} />);
  const divider = screen.getByRole("separator", { name: "Resize map and details" });
  const summary = document.querySelector<HTMLElement>(".legal-map-summary")!;
  expect(divider.parentElement).not.toContainElement(summary);
  expect(divider).toHaveAttribute("aria-orientation", "horizontal");
  expect(divider).toHaveAttribute("tabindex", "0");
  expect(divider).toHaveStyle({ cursor: "row-resize", touchAction: "none" });
  expect(divider.style.background).toBe("var(--accent-surface)");
  expect(divider).toHaveStyle({ minHeight: "6px", flexBasis: "6px" });
  expect(divider.firstElementChild).toHaveStyle({ width: "4rem", height: "4px" });
  expect(divider.getAttribute("aria-controls")!.split(" ")).toEqual([
    screen.getByRole("tabpanel", { name: "Metes & Bounds" }).id,
    screen.getByRole("tabpanel", { name: "Boundary Calls" }).id,
  ]);
});

it("resizes using the keyboard, clamps both ends and recomputes bounds on viewport changes", () => {
  render(<LegalMapContent legal={surveyFixture} />);
  act(() => measure());
  const divider = screen.getByRole("separator");
  const panel = screen.getByRole("tabpanel", { name: "Boundary Calls" });
  expect(divider).toHaveAttribute("aria-valuemin", "128");
  expect(divider).toHaveAttribute("aria-valuemax", "382");
  expect(divider).toHaveAttribute("aria-valuenow", "147");
  fireEvent.keyDown(divider, { key: "ArrowUp" });
  expect(Number.parseFloat(panel.style.height)).toBeCloseTo(163.2);
  fireEvent.keyDown(divider, { key: "ArrowDown" });
  expect(Number.parseFloat(panel.style.height)).toBeCloseTo(147.2);
  fireEvent.keyDown(divider, { key: "End" });
  expect(Number.parseFloat(panel.style.height)).toBeCloseTo(382);
  fireEvent.keyDown(divider, { key: "ArrowUp" });
  expect(Number.parseFloat(panel.style.height)).toBeCloseTo(382);
  fireEvent.keyDown(divider, { key: "Home" });
  expect(Number.parseFloat(panel.style.height)).toBeCloseTo(128);
  fireEvent.keyDown(divider, { key: "ArrowDown" });
  expect(Number.parseFloat(panel.style.height)).toBeCloseTo(128);
  fireEvent.keyDown(divider, { key: "End" });
  height = 520;
  act(() => measure());
  expect(divider).toHaveAttribute("aria-valuemax", "202");
  expect(Number.parseFloat(panel.style.height)).toBeCloseTo(202);
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
  expect(Number.parseFloat(screen.getByRole("tabpanel", { name: "Details" }).style.height)).toBeCloseTo(382);
});

it("restores the saved percentage after reopening and adapts it to the available height", () => {
  const first = render(<LegalMapContent legal={surveyFixture} />);
  act(() => measure());
  fireEvent.keyDown(screen.getByRole("separator"), { key: "End" });
  const ratio = useMapStore.getState().detailsRatio;
  expect(ratio).toBeCloseTo((382 + 56) / (700 - 6));
  first.unmount();
  render(<LegalMapContent legal={surveyFixture} />);
  act(() => measure());
  expect(Number.parseFloat(screen.getByRole("tabpanel", { name: "Boundary Calls" }).style.height)).toBeCloseTo(382);
  height = 1000;
  act(() => measure());
  expect(Number.parseFloat(screen.getByRole("tabpanel", { name: "Boundary Calls" }).style.height)).toBeCloseTo(ratio! * (1000 - 6) - 56);
  expect(useMapStore.getState().detailsRatio).toBe(ratio);
});
