import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { LegalMapContent } from "../component/LegalMapContent";

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); document.documentElement.style.fontSize = ""; });
beforeEach(() => vi.stubGlobal("ResizeObserver", class { observe() {} disconnect() {} }));

it("remeasures the whole plat when the drawing viewport grows or shrinks", () => {
  let resize: () => void;
  let height = 300;
  vi.stubGlobal("ResizeObserver", class {
    constructor(private callback: () => void) {}
    observe(node: Element) { if (node.hasAttribute("data-legal-map-fit")) resize = this.callback; }
    disconnect() {}
  });
  vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(800);
  vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockImplementation(function (this: HTMLElement) { return this.hasAttribute("data-legal-map-fit") ? height : 600; });
  vi.spyOn(HTMLElement.prototype, "offsetWidth", "get").mockReturnValue(800);
  vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockReturnValue(600);
  render(<LegalMapContent legal={{ parcels_num: 1, groups: [{ type: "lot_block", elements: [{ aspect: "lot", value: "21" }] }] }} />);
  const drawing = document.querySelector<HTMLElement>("[data-legal-map-grid]")!;
  expect(drawing.style.transform).toContain("scale(0.5)");
  height = 600;
  act(() => resize());
  expect(drawing.style.transform).toContain("scale(1)");
  height = 150;
  act(() => resize());
  expect(drawing.style.transform).toContain("scale(0.25)");
});

it("keeps narrow-panel drawings at their existing natural width and restores fitting after widening", () => {
  let resize: () => void;
  let width = 800;
  vi.stubGlobal("ResizeObserver", class {
    constructor(private callback: () => void) {}
    observe(node: Element) { if (node.hasAttribute("data-legal-map-fit")) resize = this.callback; }
    disconnect() {}
  });
  document.documentElement.style.fontSize = "16px";
  vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockImplementation(() => width);
  vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(300);
  vi.spyOn(HTMLElement.prototype, "offsetWidth", "get").mockImplementation(function (this: HTMLElement) { return Number.parseFloat(this.style.width); });
  vi.spyOn(HTMLElement.prototype, "offsetHeight", "get").mockReturnValue(600);
  render(<LegalMapContent legal={{ groups: [{ type: "lot_block", elements: [{ aspect: "lot", value: "24" }] }] }} />);
  const viewport = document.querySelector<HTMLElement>("[data-legal-map-fit]")!;
  const drawing = document.querySelector<HTMLElement>("[data-legal-map-grid]")!;
  expect(drawing.style.transform).toContain("scale(0.5)");
  expect(viewport).toHaveAttribute("data-plat-scroll", "false");
  width = 280;
  act(() => resize());
  expect(viewport).toHaveAttribute("data-plat-scroll", "true");
  expect(viewport).toHaveAttribute("tabindex", "0");
  expect(viewport).toHaveStyle({ overflowX: "auto", overflowY: "hidden", flex: "0 0 auto" });
  expect(viewport).toHaveStyle({ minHeight: "600px" });
  expect(viewport.parentElement).toHaveStyle({ minHeight: "600px" });
  expect(drawing).toHaveStyle({ width: "480px", position: "relative", left: "0", top: "0", transform: "none" });
  viewport.scrollLeft = 100;
  width = 800;
  act(() => resize());
  expect(viewport).toHaveAttribute("data-plat-scroll", "false");
  expect(viewport).toHaveAttribute("tabindex", "-1");
  expect(viewport).toHaveStyle({ minHeight: "0" });
  expect(viewport.parentElement).toHaveStyle({ minHeight: "6rem" });
  expect(drawing).toHaveStyle({ width: "800px", position: "absolute", left: "50%", top: "50%" });
  expect(drawing.style.transform).toContain("scale(0.5)");
  expect(viewport.scrollLeft).toBe(0);
  document.documentElement.style.fontSize = "";
});

it.each([1, 0.5])("keeps acreage pointers in drawing coordinates at scale %s", scale => {
  vi.spyOn(HTMLElement.prototype, "offsetWidth", "get").mockReturnValue(400);
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
    const box = this.hasAttribute("data-lot-acreage") ? { x: 40, y: 20, width: 200, height: 20 }
      : this.hasAttribute("data-lot-slot") ? { x: 200, y: 100, width: 160, height: 160 }
      : { x: 0, y: 0, width: 400, height: 400 };
    return { x: box.x * scale, y: box.y * scale, width: box.width * scale, height: box.height * scale, left: box.x * scale, top: box.y * scale, right: (box.x + box.width) * scale, bottom: (box.y + box.height) * scale, toJSON() {} };
  });
  render(<LegalMapContent legal={{ parcels_num: 1, groups: [{ type: "lot_block", elements: [{ aspect: "lot", value: "7" }, { aspect: "acreage", value: "1 ACRE" }] }] }} />);
  expect(document.querySelector("[data-acreage-point]")).toHaveAttribute("cx", "220");
  expect(document.querySelector("[data-acreage-point]")).toHaveAttribute("cy", "140");
});
