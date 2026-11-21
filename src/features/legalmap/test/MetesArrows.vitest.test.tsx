import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MetesMap } from "../component/MetesMap";
import { buildMatrix } from "../data/metesData";
import { legalMapColors } from "../style/legalMapStyles";
import type { MetesLine, MetesScene } from "../type/metes.types";

const rectangle = "NORTH 100 FEET; EAST 50 FEET; SOUTH 100 FEET; WEST 50 FEET TO THE POINT OF BEGINNING.";

describe("Metes direction arrows", () => {
  it.each([
    [10, 0, 0], [10, 10, 45], [0, 10, 90], [-10, 10, 135],
    [-10, 0, 180], [-10, -10, -135], [0, -10, -90], [10, -10, -45],
  ])("follows the ordered endpoints for (%s, %s)", (x, y, angle) => {
    const item: MetesLine = { kind: "line", label: "Course 1", detail: "Source course", sequence: 1,
      from: { x: 20, y: 30 }, to: { x: 20 + x, y: 30 + y }, bearing: "", distance: "10 m", confirmed: true };
    const scene: MetesScene = { title: "Parcel", items: [item], courses: [], notes: [], closed: false, method: "source", completion: "open" };
    const original = JSON.stringify(scene);
    const { container } = render(<MetesMap scenes={[scene]} />);
    const arrow = container.querySelector("[data-survey-arrow]")!;
    expect(arrow).not.toBeNull();
    const transform = arrow.getAttribute("transform")!.match(/-?\d+(?:\.\d+)?(?:e[+-]?\d+)?/g)!.map(Number);
    expect(transform[0]).toBeCloseTo(20 + x / 2);
    expect(transform[1]).toBeCloseTo(30 + y / 2);
    expect(transform[2]).toBeCloseTo(angle);
    expect(arrow).toHaveAttribute("stroke", legalMapColors.parcelLine);
    expect(arrow).toHaveAttribute("aria-hidden", "true");
    expect(arrow).toHaveAttribute("pointer-events", "none");
    expect(container.querySelector("[data-survey-line]")).toHaveAttribute("x2", String(item.to.x));
    expect(JSON.stringify(scene)).toBe(original);
  });

  it.each([1, -1])("follows the curve tangent for turn %s", turn => {
    const arc = { center: { x: 0, y: 0 }, radius: 10, sweep: Math.PI * 1.5, turn };
    const item: MetesLine = { kind: "line", label: "Course 1", detail: "Source curve", sequence: 1,
      from: { x: 10, y: 0 }, to: { x: 0, y: -10 * turn }, bearing: "Curve", distance: "47.12 m", confirmed: false, arc };
    const scene: MetesScene = { title: "Curve", items: [item], courses: [], notes: [], closed: false, method: "source", completion: "open" };
    const { container } = render(<MetesMap scenes={[scene]} />);
    const arrow = container.querySelector("[data-survey-arrow]")!;
    expect(arrow).not.toBeNull();
    const transform = arrow.getAttribute("transform")!.match(/-?\d+(?:\.\d+)?(?:e[+-]?\d+)?/g)!.map(Number);
    expect(transform[0]).toBeCloseTo(-Math.SQRT1_2 * 10);
    expect(transform[1]).toBeCloseTo(Math.SQRT1_2 * 10 * turn);
    expect(transform[2]).toBeCloseTo(225 * turn);
    expect(arrow).toHaveAttribute("stroke", legalMapColors.unconfirmed);
    expect(container.querySelector("[data-survey-arc]")).toHaveAttribute("d", `M 10 0 A 10 10 0 1 ${turn === 1 ? 1 : 0} 0 ${-10 * turn}`);
  });

  it("retains tie and synthetic styles, points, fill and course ordering across redraws", () => {
    const scene = buildMatrix({ type: "metes_bounds", source: "EAST 20 FEET TO THE POINT OF BEGINNING; " + rectangle.slice(0, rectangle.indexOf("WEST")) }, "Parcel");
    const { container, rerender } = render(<MetesMap scenes={[scene]} />);
    expect(container.querySelectorAll("[data-survey-arrow]")).toHaveLength(scene.items.length);
    for (const line of container.querySelectorAll("[data-survey-line]")) {
      const arrow = line.parentElement!.querySelector("[data-survey-arrow]")!;
      expect(arrow).toHaveAttribute("stroke", line.getAttribute("stroke"));
      expect(arrow).not.toHaveAttribute("stroke-dasharray");
    }
    expect(container.querySelector('[data-survey-tie="true"]')).toHaveAttribute("stroke-dasharray", "1 5");
    expect(container.querySelector('[data-unconfirmed="true"]')).toHaveAttribute("stroke-dasharray", "6 4");
    expect(container.querySelector("[data-boundary-fill]")).not.toBeNull();
    const vertices = [...container.querySelectorAll("[data-survey-point]")].map(node => node.getAttribute("data-survey-point"));
    rerender(<MetesMap scenes={[scene, { ...scene, title: "Second parcel" }]} />);
    expect(container.querySelectorAll("[data-survey-arrow]")).toHaveLength(scene.items.length * 2);
    expect([...container.querySelectorAll('[data-survey-group="1"] [data-survey-point]')].map(node => node.getAttribute("data-survey-point"))).toEqual(vertices);
    rerender(<MetesMap scenes={[buildMatrix({ type: "metes_bounds", source: rectangle }, "Parcel")]} />);
    expect(container.querySelectorAll("[data-survey-arrow]")).toHaveLength(4);
    expect(container.querySelector('[data-survey-tie="true"]')).toBeNull();
  });
});
