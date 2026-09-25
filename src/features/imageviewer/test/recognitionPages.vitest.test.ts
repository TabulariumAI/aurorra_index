import { describe, expect, it } from "vitest";
import { resolveImagePage } from "../data/recognitionPages";

describe("recognition page mapping", () => {
  it.each([
    [1, [1]],
    [2, [1, 2, 30]],
    [3, [1, 2, 3, 4, 5, 28, 29, 30]],
    [4, [1, 2, 3, 4, 5, 6, 7, 8, 26, 27, 28, 29, 30]],
    [5, [...Array.from({ length: 12 }, (_, i) => i + 1), ...Array.from({ length: 8 }, (_, i) => i + 23)]],
    [6, Array.from({ length: 30 }, (_, i) => i + 1)],
  ] as const)("maps every selected page and rejects omitted pages at level %s", (level, selected) => {
    const choices = [{ service: "Recognition", level }];
    for (let page = 1; page <= 30; page++) {
      const position = (selected as readonly number[]).indexOf(page);
      if (position >= 0) expect(resolveImagePage(page, 30, choices)).toBe(position + 1);
      else expect(() => resolveImagePage(page, 30, choices)).toThrow(expect.objectContaining({ code: "image_page_unavailable" }));
    }
  });

  it.each([1, 2, 3, 4, 5, 6])("does not duplicate overlapping ranges at level %s", (level) => {
    for (let total = 1; total <= 30; total++) {
      const limit = [0, 1, 3, 8, 13, 20, 30][level];
      if (total > limit) continue;
      for (let page = 1; page <= total; page++) {
        expect(resolveImagePage(page, total, [{ service: "Recognition", level }])).toBe(page);
      }
    }
  });

  it("maps the last three pages of the 20-page Level3 document", () => {
    const choices = [{ service: "Recognition", level: 3 }];
    expect([18, 19, 20].map(page => resolveImagePage(page, 20, choices))).toEqual([6, 7, 8]);
    for (let page = 6; page <= 17; page++) {
      expect(() => resolveImagePage(page, 20, choices)).toThrow(expect.objectContaining({ code: "image_page_unavailable" }));
    }
  });

  it.each([0, -1, 21, 1.5, NaN])("rejects invalid source page %s", (page) => {
    expect(() => resolveImagePage(page, 20, [{ service: "Recognition", level: 3 }])).toThrow();
  });

  it.each([null, [], "{bad", [{ service: "Recognition", level: 7 }]])("rejects unavailable recognition choices: %j", (choices) => {
    expect(() => resolveImagePage(1, 20, choices)).toThrow(expect.objectContaining({ code: "invalid_recognition_choice" }));
  });

  it("accepts persisted numeric string levels and JSON choices", () => {
    expect(resolveImagePage(20, 20, JSON.stringify([{ service: "Recognition", level: "3" }]))).toBe(8);
  });
});
