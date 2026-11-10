import type { MatrixCourse } from "../type/metes.types";

type Point = { x: number; y: number };
type Shape = { courses: MatrixCourse[]; key: string };

function shapeKey(courses: MatrixCourse[], tolerance: number): string | null {
  if (courses.length < 3 || courses.some(course => course.angle === null || course.metres === null || course.metres <= 0)) return null;
  let points: Point[] = [{ x: 0, y: 0 }];
  for (const course of courses) {
    const point = points.at(-1)!;
    const angle = course.angle! * Math.PI / 180;
    points.push({ x: point.x + Math.sin(angle) * course.metres!, y: point.y - Math.cos(angle) * course.metres! });
  }
  if (Math.hypot(points.at(-1)!.x, points.at(-1)!.y) > tolerance) return null;
  points[points.length - 1] = points[0];
  points = points.filter((point, index) => index === points.length - 1 || Math.hypot(point.x - points[index + 1].x, point.y - points[index + 1].y) > tolerance);
  if (points.length < 4) return null;
  points[points.length - 1] = points[0];
  const cross = (a: Point, b: Point, c: Point) => (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
  const scale = courses.reduce((sum, course) => sum + course.metres!, 0);
  const epsilon = Number.EPSILON * scale ** 2 * courses.length;
  const area = points.slice(0, -1).reduce((sum, point, index) => sum + point.x * points[index + 1].y - points[index + 1].x * point.y, 0);
  if (Math.abs(area) <= epsilon) return null;
  for (let left = 0; left < points.length - 1; left += 1) {
    for (let right = left + 1; right < points.length - 1; right += 1) {
      const a = points[left], b = points[left + 1], c = points[right], d = points[right + 1];
      const abC = cross(a, b, c), abD = cross(a, b, d), cdA = cross(c, d, a), cdB = cross(c, d, b);
      const adjacent = right === left + 1 || (left === 0 && right === points.length - 2);
      if (adjacent) {
        if (Math.abs(abC) <= epsilon && Math.abs(abD) <= epsilon) {
          const first = right === left + 1 ? { x: b.x - a.x, y: b.y - a.y } : { x: a.x - b.x, y: a.y - b.y };
          const second = { x: d.x - c.x, y: d.y - c.y };
          if (first.x * second.x + first.y * second.y < -epsilon) return null;
        }
        continue;
      }
      const on = (p: Point, q: Point, r: Point, product: number) => Math.abs(product) <= epsilon
        && r.x >= Math.min(p.x, q.x) - Number.EPSILON * scale && r.x <= Math.max(p.x, q.x) + Number.EPSILON * scale
        && r.y >= Math.min(p.y, q.y) - Number.EPSILON * scale && r.y <= Math.max(p.y, q.y) + Number.EPSILON * scale;
      if ((abC * abD < 0 && cdA * cdB < 0) || on(a, b, c, abC) || on(a, b, d, abD) || on(c, d, a, cdA) || on(c, d, b, cdB)) return null;
    }
  }
  const minX = Math.min(...points.map(point => point.x));
  const minY = Math.min(...points.map(point => point.y));
  const vertices = points.map(point => `${Math.round((point.x - minX) / scale * 1e12)}:${Math.round((point.y - minY) / scale * 1e12)}`);
  return vertices.slice(0, -1).map((vertex, index) => [vertex, vertices[index + 1]].sort().join(">")).sort().join(";");
}

function findShapes(courses: MatrixCourse[], tolerance: number): Shape[] {
  const key = shapeKey(courses, tolerance);
  if (key !== null) return [{ courses, key }];
  if (courses.some(course => course.angle === null || course.metres === null || course.metres <= 0)) return [];
  const end = courses.reduce((point, course) => ({
    x: point.x + Math.sin(course.angle! * Math.PI / 180) * course.metres!,
    y: point.y - Math.cos(course.angle! * Math.PI / 180) * course.metres!,
  }), { x: 0, y: 0 });
  // Changing course order cannot change the sum of its vectors.
  if (Math.hypot(end.x, end.y) > tolerance) return [];
  if (courses.every(course => Math.abs(Math.sin((course.angle! - courses[0].angle!) * Math.PI / 180)) <= Number.EPSILON * courses.length)) return [];
  const shapes = new Map<string, Shape>();
  const visit = (ordered: MatrixCourse[], remaining: MatrixCourse[]) => {
    if (shapes.size > 1) return;
    if (remaining.length === 0) {
      const candidate = shapeKey(ordered, tolerance);
      if (candidate !== null && !shapes.has(candidate)) shapes.set(candidate, { courses: ordered, key: candidate });
      return;
    }
    const seen = new Set<string>();
    for (const [index, course] of remaining.entries()) {
      const measurement = `${course.angle}:${course.metres}`;
      if (seen.has(measurement)) continue;
      seen.add(measurement);
      visit([...ordered, course], remaining.filter((_, next) => next !== index));
      if (shapes.size > 1) return;
    }
  };
  // Rotation does not create a different outline.
  visit([courses[0]], courses.slice(1));
  return [...shapes.values()];
}

function completeCourses(input: MatrixCourse[], ratio: number, tieLength: number): MatrixCourse[] {
  let courses = input;
  const missing = courses.filter(course => (course.missingDistance || course.missingBearing && course.metres !== null && course.metres > 0) && !course.issue);
  if (missing.length === 1 && courses.every(course => course === missing[0] || (course.angle !== null && course.metres !== null && course.metres > 0))) {
    const course = missing[0];
    const gap = courses.filter(item => item !== course).reduce((point, item) => ({
      x: point.x - Math.sin(item.angle! * Math.PI / 180) * item.metres!,
      y: point.y + Math.cos(item.angle! * Math.PI / 180) * item.metres!,
    }), { x: 0, y: 0 });
    const length = Math.hypot(gap.x, gap.y);
    const angle = (Math.atan2(gap.x, -gap.y) * 180 / Math.PI + 360) % 360;
    const perimeter = tieLength + length + courses.reduce((sum, item) => item === course ? sum : sum + item.metres!, 0);
    const aligned = course.angle === null || Math.abs(Math.sin((course.angle - angle) * Math.PI / 180)) * length <= perimeter * ratio
      && Math.cos((course.angle - angle) * Math.PI / 180) > 0;
    if (length > 0 && aligned) {
      const calculated = { ...course, metres: length,
        issue: `Calculated ${course.missingBearing ? "bearing" : "distance"} to connect the next known section; calculated length ${length.toFixed(3)} m.${course.distance ? ` Supplied distance: ${course.distance}.` : ""}` };
      if (course.missingBearing) {
        calculated.angle = angle;
        const degrees = angle <= 90 ? angle : angle <= 180 ? 180 - angle : angle <= 270 ? angle - 180 : 360 - angle;
        const seconds = Math.round(degrees * 360000);
        calculated.bearing = `${angle < 90 || angle >= 270 ? "N" : "S"} ${Math.floor(seconds / 360000)}°${Math.floor(seconds / 6000) % 60}′${((seconds % 6000) / 100).toFixed(2)}″ ${angle <= 180 ? "E" : "W"} (calculated)`;
      }
      if (course.missingDistance) calculated.distance = `${length} m`;
      courses = courses.map(item => item === course ? calculated : item);
    }
  }
  return courses;
}

export function solveMatrix(input: MatrixCourse[], ratio: number, tieLength: number): { courses: MatrixCourse[]; closed: boolean; issue?: string } {
  let courses = completeCourses(input, ratio, tieLength);
  const tolerance = (tieLength + courses.reduce((sum, course) => sum + (course.metres === null ? 0 : course.metres), 0)) * ratio;
  let shapes = findShapes(courses, tolerance);
  if (shapes.length === 0 && input.filter(course => course.missingBearing || course.missingDistance).length <= 1
    && input.every(course => !course.issue && (course.angle !== null || course.missingBearing)
      && (course.metres !== null && course.metres > 0 || course.missingDistance))) {
    const indices = input.flatMap((course, index) => course.metres !== null ? [index] : []);
    const directions = input.every(course => course.angle !== null && course.metres !== null)
      ? input.map(course => ({ x: Math.sin(course.angle! * Math.PI / 180), y: -Math.cos(course.angle! * Math.PI / 180) })) : null;
    const results = new Map<string, Shape>();
    const pair = (index: number, remaining: MatrixCourse[], candidate: MatrixCourse[]) => {
      if (results.size > 1) return;
      if (index === indices.length) {
        const completed = completeCourses(candidate, ratio, tieLength);
        const candidateTolerance = (tieLength + completed.reduce((sum, course) => sum + (course.metres === null ? 0 : course.metres), 0)) * ratio;
        for (const shape of findShapes(completed, candidateTolerance)) if (!results.has(shape.key)) results.set(shape.key, shape);
        return;
      }
      if (directions) {
        const pending = indices.slice(index);
        const assigned = directions.reduce((point, direction, position) => pending.includes(position) ? point : ({
          x: point.x + direction.x * candidate[position].metres!, y: point.y + direction.y * candidate[position].metres!,
        }), { x: 0, y: 0 });
        const lengths = remaining.map(course => course.metres!).sort((left, right) => left - right);
        // Sorted products bound every remaining assignment on each axis.
        for (const axis of ["x", "y"] as const) {
          const coefficients = pending.map(position => directions[position][axis]).sort((left, right) => left - right);
          const minimum = coefficients.reduce((sum, coefficient, position) => sum + coefficient * lengths[lengths.length - position - 1], assigned[axis]);
          const maximum = coefficients.reduce((sum, coefficient, position) => sum + coefficient * lengths[position], assigned[axis]);
          if (minimum > tolerance || maximum < -tolerance) return;
        }
      }
      const seen = new Set<number>();
      for (const [position, measurement] of remaining.entries()) {
        if (seen.has(measurement.metres!)) continue;
        seen.add(measurement.metres!);
        const next = [...candidate];
        const original = input[indices[index]];
        next[indices[index]] = original.metres === measurement.metres ? original : {
          ...original, distance: measurement.distance, metres: measurement.metres,
          detail: `${original.bearing} · ${measurement.distance}`,
          ...(original.paired ? { issue: `Bearing-distance pairing was rearranged to close the boundary; original distance: ${original.distance}.` } : {}),
        };
        pair(index + 1, remaining.filter((_, item) => item !== position), next);
        if (results.size > 1) return;
      }
    };
    if (indices.length > 1) pair(0, indices.map(index => input[index]), input);
    shapes = [...results.values()];
  }
  if (shapes.length > 1) {
    const issue = "Multiple valid boundary shapes; the measurements do not identify a unique outline.";
    return { courses: courses.map(course => ({ ...course, issue })), closed: false, issue };
  }
  if (shapes.length === 1) courses = shapes[0].courses;
  return { courses, closed: shapes.length === 1 };
}
