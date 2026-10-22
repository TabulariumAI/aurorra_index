type Point = { x: number; y: number };
type Box = Point & { width: number; height: number };
export type LabelPosition = { box: Box; leader: Point | null };

function segmentHits(from: Point, to: Point, box: Box): boolean {
  let start = 0;
  let end = 1;
  for (const [origin, delta, minimum, maximum] of [
    [from.x, to.x - from.x, box.x, box.x + box.width],
    [from.y, to.y - from.y, box.y, box.y + box.height],
  ]) {
    if (delta === 0) {
      if (origin < minimum || origin > maximum) return false;
    } else {
      const first = (minimum - origin) / delta;
      const last = (maximum - origin) / delta;
      start = Math.max(start, Math.min(first, last));
      end = Math.min(end, Math.max(first, last));
      if (start > end) return false;
    }
  }
  return true;
}

function insideParcel(point: Point, parcel: Point[]): boolean {
  let inside = false;
  for (let index = 0, previous = parcel.length - 1; index < parcel.length; previous = index++) {
    const from = parcel[previous];
    const to = parcel[index];
    if ((from.y > point.y) !== (to.y > point.y) && point.x < (to.x - from.x) * (point.y - from.y) / (to.y - from.y) + from.x) inside = !inside;
  }
  return inside;
}

export function placeLabels({ targets, bounds, obstacles, segments, parcel }: {
  targets: { point: Point; width: number; height: number }[];
  bounds: Box;
  obstacles: Box[];
  segments: { from: Point; to: Point }[];
  parcel: Point[];
}): LabelPosition[] {
  if (targets.length === 0) return [];
  const candidates = targets.map(({ point, width, height }) => {
    const positions: Point[] = [];
    for (const offset of [12, 24, 40, 64, 96]) {
      for (const [x, y] of [[0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1]]) {
        positions.push({ x: point.x + x * (width / 2 + offset) - width / 2, y: point.y + y * (height / 2 + offset) - height / 2 });
      }
    }
    for (let x = bounds.x + 4; x + width <= bounds.x + bounds.width - 4; x += 12) {
      positions.push({ x, y: bounds.y + 4 }, { x, y: bounds.y + bounds.height - height - 4 });
    }
    for (let y = bounds.y + 4; y + height <= bounds.y + bounds.height - 4; y += 12) {
      positions.push({ x: bounds.x + 4, y }, { x: bounds.x + bounds.width - width - 4, y });
    }
    return positions.flatMap(position => {
      const box = { ...position, width, height };
      if (box.x < bounds.x || box.y < bounds.y || box.x + width > bounds.x + bounds.width || box.y + height > bounds.y + bounds.height) return [];
      const clearance = { x: box.x - 4, y: box.y - 4, width: width + 8, height: height + 8 };
      if (obstacles.some(obstacle => clearance.x < obstacle.x + obstacle.width && clearance.x + clearance.width > obstacle.x && clearance.y < obstacle.y + obstacle.height && clearance.y + clearance.height > obstacle.y)
        || segments.some(segment => segmentHits(segment.from, segment.to, clearance))) return [];
      const leader = { x: Math.max(box.x, Math.min(point.x, box.x + width)), y: Math.max(box.y, Math.min(point.y, box.y + height)) };
      const distance = Math.hypot(leader.x - point.x, leader.y - point.y);
      return [{ box, leader: distance > 16 ? leader : null, distance, inside: Number(insideParcel({ x: box.x + width / 2, y: box.y + height / 2 }, parcel)) }];
    });
  });
  let best: LabelPosition[] | undefined;
  let bestInside = Infinity;
  let bestDistance = Infinity;
  for (const first of candidates[0]) {
    for (const second of targets.length === 2 ? candidates[1] : [null]) {
      if (second && (!(first.box.x + first.box.width + 4 <= second.box.x || second.box.x + second.box.width + 4 <= first.box.x || first.box.y + first.box.height + 4 <= second.box.y || second.box.y + second.box.height + 4 <= first.box.y)
        || (first.leader && segmentHits(targets[0].point, first.leader, second.box))
        || (second.leader && segmentHits(targets[1].point, second.leader, first.box)))) continue;
      const inside = first.inside + (second ? second.inside : 0);
      const distance = first.distance + (second ? second.distance : 0);
      if (inside < bestInside || (inside === bestInside && distance < bestDistance)) {
        best = [first, ...(second ? [second] : [])].map(({ box, leader }) => ({ box, leader }));
        bestInside = inside;
        bestDistance = distance;
      }
    }
  }
  if (!best) throw new Error("Survey labels do not fit the drawing.");
  return best;
}
