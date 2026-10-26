import { act, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { LegalMapContent } from "../component/LegalMapContent";

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

it("uses shared base sizes for lot and block labels inside the fitted drawing", () => {
  render(<LegalMapContent legal={{ groups: [{ type: "lot_block", elements: [
    { aspect: "lot", value: "1, 2, 3, 4" }, { aspect: "block", value: "12 / 13 / 14 / 15" },
  ] }] }} />);
  for (const label of document.querySelectorAll("[data-legal-map-lot], [data-legal-map-block-label]")) {
    expect(label).toHaveStyle({ fontSize: "16px" });
  }
  expect(document.querySelector("[data-legal-map-fit]")).not.toBeNull();
  expect(document.querySelector("[data-legal-map-grid]")).toHaveStyle({ overflow: "visible" });
});

it("hides a label that cannot fit and restores it when space becomes available, preserving its data", () => {
  let resize: () => void;
  let height = 24;
  vi.stubGlobal("ResizeObserver", class {
    constructor(private callback: () => void) {}
    observe(node: Element) { if (node.firstElementChild?.hasAttribute("data-legal-map-block")) resize = this.callback; }
    disconnect() {}
  });
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
    const size = this.hasAttribute("data-map-label") ? 64 : height;
    return { x: 0, y: 0, left: 0, top: 0, right: 120, bottom: size, width: 120, height: size, toJSON() {} };
  });
  const value = "TOWNSHIP NO. 11, SUB NO. 37, ORIGINAL ONE HUNDRED ACRE NO. 442";
  render(<LegalMapContent legal={{ groups: [{ type: "lot_block", elements: [{ aspect: "lot", value }] }] }} />);
  const label = document.querySelector<HTMLElement>("[data-legal-map-lot] [data-map-label]")!;
  expect(label).toHaveStyle({ visibility: "hidden" });
  expect(screen.getByRole("table", { name: "Details" })).toHaveTextContent(value);
  height = 160;
  act(() => resize!());
  expect(label).toHaveStyle({ visibility: "visible" });
});
