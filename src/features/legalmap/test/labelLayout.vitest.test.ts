import { describe, expect, it } from "vitest";
import { placeLabels } from "../data/labelLayout";

const bounds = { x: 0, y: 0, width: 320, height: 240 };

describe("survey label placement", () => {
  it.each([0, 45, 90, 135, 180, 225, 270, 315])("separates clustered POC and POB at %s degrees", angle => {
    const radians = angle * Math.PI / 180;
    const targets = [
      { point: { x: 150, y: 120 }, width: 36, height: 20 },
      { point: { x: 150 + Math.cos(radians) * 4, y: 120 + Math.sin(radians) * 4 }, width: 36, height: 20 },
    ];
    const obstacles = targets.map(({ point }) => ({ x: point.x - 10, y: point.y - 26, width: 20, height: 20 }));
    obstacles.push({ x: 125, y: 125, width: 20, height: 20 });
    const input = { targets, bounds, obstacles, segments: [{ from: targets[0].point, to: targets[1].point }], parcel: [] };
    const original = JSON.stringify(input);
    const positions = placeLabels(input);
    expect(positions).toHaveLength(2);
    const boxes = positions.map(position => position.box);
    for (const [index, box] of boxes.entries()) {
      expect(box.x).toBeGreaterThanOrEqual(bounds.x);
      expect(box.y).toBeGreaterThanOrEqual(bounds.y);
      expect(box.x + box.width).toBeLessThanOrEqual(bounds.width);
      expect(box.y + box.height).toBeLessThanOrEqual(bounds.height);
      for (const obstacle of [...obstacles, ...boxes.filter((_, other) => other !== index)]) {
        expect(box.x + box.width <= obstacle.x || obstacle.x + obstacle.width <= box.x || box.y + box.height <= obstacle.y || obstacle.y + obstacle.height <= box.y).toBe(true);
      }
    }
    expect(placeLabels(input)).toEqual(positions);
    expect(JSON.stringify(input)).toBe(original);
  });

  it("keeps labels clear of boundary segments, reference lines, and controls", () => {
    const segments = [
      { from: { x: 50, y: 0 }, to: { x: 50, y: 240 } },
      { from: { x: 0, y: 100 }, to: { x: 320, y: 100 } },
    ];
    const positions = placeLabels({
      targets: [{ point: { x: 50, y: 100 }, width: 36, height: 20 }], bounds,
      obstacles: [{ x: 100, y: 0, width: 220, height: 60 }], segments, parcel: [],
    });
    const { box } = positions[0];
    expect(box.x + box.width < 50 || box.x > 50).toBe(true);
    expect(box.y + box.height < 100 || box.y > 100).toBe(true);
    expect(box.y >= 60 || box.x + box.width <= 100).toBe(true);
  });

  it("prefers positions outside the parcel", () => {
    const { box } = placeLabels({
      targets: [{ point: { x: 120, y: 120 }, width: 36, height: 20 }], bounds, obstacles: [], segments: [],
      parcel: [{ x: 60, y: 60 }, { x: 260, y: 60 }, { x: 260, y: 200 }, { x: 60, y: 200 }],
    })[0];
    const center = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
    expect(center.x <= 60 || center.x >= 260 || center.y <= 60 || center.y >= 200).toBe(true);
  });

  it("uses outer callouts and leaders when the nearby positions are occupied", () => {
    const targets = [
      { point: { x: 250, y: 150 }, width: 36, height: 20 },
      { point: { x: 251, y: 151 }, width: 36, height: 20 },
    ];
    const positions = placeLabels({
      targets, bounds: { x: 0, y: 0, width: 500, height: 300 },
      obstacles: [{ x: 130, y: 30, width: 240, height: 240 }], segments: [], parcel: [],
    });
    for (const { box, leader } of positions) {
      expect(box.x + box.width <= 130 || box.x >= 370 || box.y + box.height <= 30 || box.y >= 270).toBe(true);
      expect(leader).not.toBeNull();
      expect(leader!.x).toBeGreaterThanOrEqual(box.x);
      expect(leader!.x).toBeLessThanOrEqual(box.x + box.width);
      expect(leader!.y).toBeGreaterThanOrEqual(box.y);
      expect(leader!.y).toBeLessThanOrEqual(box.y + box.height);
    }
  });
});
