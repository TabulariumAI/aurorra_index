import type { LegalGroup } from "aurora-core";
import { getElements, getNotes } from "./legalData";
import type { BoundaryCourse, BoundaryInput, MatrixCourse, MetesLine, MetesPoint, MetesScene, ReconstructedBoundary, SurveyCourse } from "../type/metes.types";
const measureAbbr: Record<string, string> = {
  NORTH: "N", SOUTH: "S", EAST: "E", WEST: "W", NORTHEAST: "NE", NORTHWEST: "NW", SOUTHEAST: "SE", SOUTHWEST: "SW",
  NORTHERLY: "N", SOUTHERLY: "S", EASTERLY: "E", WESTERLY: "W",
  FEET: "ft", FOOT: "ft", FT: "ft", METERS: "m", METER: "m", METRES: "m", METRE: "m",
  INCHES: "in", INCH: "in", YARDS: "yd", YARD: "yd", CHAINS: "ch", CHAIN: "ch",
  RODS: "rd", ROD: "rd", LINKS: "lk", LINK: "lk", MILES: "mi", MILE: "mi",
};
const measurePattern = new RegExp("\\b(?:" + Object.keys(measureAbbr).join("|") + ")\\b", "gi");
export function formatMeasure(source: string, angular: boolean): string {
  const value = source.replace(measurePattern, word => measureAbbr[word.toUpperCase()])
    .replace(/\b(?:DEGREES?|DEG)\b\.?/gi, "°").replace(/\b(?:MINUTES?|MIN)\b\.?/gi, "′").replace(/\b(?:SECONDS?|SEC)\b\.?/gi, "″");
  return angular ? value.replace(/''|[″”"]/g, "″").replace(/[′’']/g, "′").replace(/[º˚]/g, "°").replace(/(\d)\s*O(?=\s*\d)/gi, "$1°").replace(/\s*([°′″])/g, "$1").replace(/([°′″])\s+(?=\d)/g, "$1")
    : value.replace(/(\d)\s*'/g, "$1 ft").replace(/(\d)\s*"/g, "$1 in");
}
export function parseBearing(source: string): number | null {
  const value = formatMeasure(source, true).trim().toUpperCase().replace(/,/g, " ").replace(/′/g, "'").replace(/″/g, '"');
  const cardinal: Record<string, number> = { N: 0, NE: 45, E: 90, SE: 135, S: 180, SW: 225, W: 270, NW: 315 };
  if (Object.hasOwn(cardinal, value))
    return cardinal[value];
  const match = value.match(/^([NS])\s*(\d+(?:\.\d+)?)(?:\s+(\d+)\s*\/\s*(\d+))?\s*°?\s*(?:(\d+(?:\.\d+)?)\s*')?\s*(?:(\d+(?:\.\d+)?)\s*")?\s*([EW])$/);
  if (!match)
    return null;
  const numerator = Number(match[3] ?? 0);
  const denominator = Number(match[4] ?? 1);
  const minutes = Number(match[5] ?? 0);
  const seconds = Number(match[6] ?? 0);
  if (denominator === 0 || numerator >= denominator || minutes >= 60 || seconds >= 60)
    return null;
  const angle = Number(match[2]) + numerator / denominator + minutes / 60 + seconds / 3600;
  if (angle > 90)
    return null;
  return match[1] === "N" ? (match[7] === "E" ? angle : (360 - angle) % 360)
    : match[7] === "E" ? 180 - angle : 180 + angle;
}
const units: Record<string, number> = {
  feet: 0.3048, foot: 0.3048, ft: 0.3048, "'": 0.3048,
  meters: 1, meter: 1, metres: 1, metre: 1, m: 1,
  inches: 0.0254, inch: 0.0254, in: 0.0254, '"': 0.0254,
  yards: 0.9144, yard: 0.9144, yd: 0.9144,
  chains: 20.1168, chain: 20.1168, ch: 20.1168,
  rods: 5.0292, rod: 5.0292, rd: 5.0292, links: 0.201168, link: 0.201168, lk: 0.201168,
  miles: 1609.344, mile: 1609.344, mi: 1609.344,
};
const number = "(?:\\d+(?:,\\d{3})*(?:\\.\\d+)?|\\.\\d+)";
const unit = "(?:FEET|FOOT|FT\\.?|METERS?|METRES?|M|INCH(?:ES)?|IN|YARDS?|YD|CHAINS?|CH|RODS?|RD|LINKS?|LK|MILES?|MI|['\"])(?![A-Z])";
// Preserve compound measurements for validation instead of drawing a valid prefix.
const distancePattern = new RegExp("(?<![-\\w.,])-?" + number + "\\s*" + unit + "(?:\\s*-?" + number + "\\s*" + unit + ")*", "i");
const lengthPattern = new RegExp("^" + number + "\\s*(?:(?:FEET|FOOT|FT\\.?|')\\s*" + number + "\\s*(?:INCH(?:ES)?|IN|\")(?![A-Z])|" + unit + ")$", "i");
const bearingPattern = new RegExp("(?<![\\w'’])(?:NORTH|SOUTH|N|S)\\.?\\s*\\d+(?:\\.\\d+)?(?:\\s+\\d+\\s*\\/\\s*\\d+)?\\s*(?:DEGREES?|DEG\\.?|[°º˚]|O(?=\\s*\\d))?(?:\\s*\\d+(?:\\.\\d+)?\\s*(?:MINUTES?|MIN\\.?|['′’:]))?(?:\\s*\\d+(?:\\.\\d+)?\\s*(?:SECONDS?|SEC\\.?|[\"″”]|''))?\\s*,?\\s*(?:EAST|WEST|E|W)\\b"
  + "|(?<![\\w'’])(?:NORTH|SOUTH|EAST|WEST|[NSEW])(?=\\s+-?" + number + "(?![\\d.]|\\s*/)(?!\\s*(?:DEGREES?|DEG\\.?|[°º˚])))", "gi");
const angularStart = /^\s*(?:NORTH|SOUTH|[NS])\s*\d/i;
export function parseDistance(source: string): number | null {
  if (!lengthPattern.test(source.trim()))
    return null;
  const length = [...source.matchAll(new RegExp("(" + number + ")\\s*(" + unit + ")", "gi"))]
    .reduce((sum, match) => sum + Number(match[1].replaceAll(",", "")) * units[match[2].toLowerCase().replace(/\.$/, "")], 0);
  return Number.isFinite(length) ? length : null;
}
function sameDistance(left: number | null, right: number | null): boolean {
  return left !== null && right !== null && Math.abs(left - right) <= Number.EPSILON * Math.max(1, Math.abs(left), Math.abs(right)) * 4;
}
function readList(values: string[], distances: boolean): string[] {
  const entries: string[] = [];
  for (const value of values) {
    if (value.trim().startsWith("[")) {
      let parsed: unknown;
      try {
        parsed = JSON.parse(value);
      }
      catch {
        entries.push(value);
        continue;
      }
      if (!Array.isArray(parsed) || parsed.some(item => typeof item !== "string" && !(distances && typeof item === "number"))) {
        entries.push(value);
        continue;
      }
      entries.push(...parsed.map(String));
    }
    else {
      const spans = [...value.matchAll(bearingPattern), ...value.matchAll(new RegExp(distancePattern.source, "gi"))];
      let start = 0;
      for (const match of value.matchAll(/,(?!\s*\d+(?:\.\d+)?\s*(?:MIN(?:UTES)?|SEC(?:ONDS)?|[\x27\x22′″]))|[;\n|]|\band\b/gi)) {
        if (spans.some(span => match.index! > span.index! && match.index! < span.index! + span[0].length))
          continue;
        entries.push(value.slice(start, match.index).trim());
        start = match.index! + match[0].length;
      }
      entries.push(value.slice(start).trim());
    }
  }
  return entries;
}
function readSource(source: string, pattern = bearingPattern): (BoundaryCourse & {
  start: number;
})[] {
  const records = [...source.matchAll(/\([^)]*\)/g)];
  const events = [
    ...[...source.matchAll(pattern)].map(match => {
      if (/^(?:NORTH|SOUTH|N|S)$/i.test(match[0]) && /^\s*\d+(?:\.\d+)?\s*["°º˚'′″]/.test(source.slice(match.index! + match[0].length))) {
        const angular = /^(?:NORTH|SOUTH|N|S)\s*\d[^;\n]*?\b(?:EAST|WEST|E|W)\b/i.exec(source.slice(match.index!));
        if (angular) {
          angular.index = match.index!;
          match = angular;
        }
      }
      return { kind: "bearing" as const, match };
    }),
    ...[...source.matchAll(/\b(?:THENCE\s+)?(?:CONTINUING\s+ALONG|ALONG)\s+(?:SAID|A)\s+CURVE\b/gi)].map(match => ({ kind: "curve" as const, match })),
  ];
  for (const match of source.matchAll(/(?:\bTHENCE\s+|(?:^|[;\n])\s*(?:SUBSTANTIALLY\s+)?)(?:DUE\s+)?(NORTH|SOUTH|EAST|WEST)\b/gi)) {
    const start = match.index! + match[0].lastIndexOf(match[1]);
    if (events.some(event => event.match.index! <= start && event.match.index! + event.match[0].length > start))
      continue;
    // Keep missing cardinal distances and malformed angular calls in their source positions.
    const angular = source.slice(start).split(/[;\n]/)[0].match(/^(?:NORTH|SOUTH)\s*\d.*?\b(?:EAST|WEST|[EW])\b/i);
    const cardinal = /^[\s\S]+/.exec(angular?.[0] ?? match[1])!;
    cardinal.index = start;
    events.push({ kind: "bearing", match: cardinal });
  }
  const ordered = events.filter(event => !records.some(record => event.match.index! > record.index! && event.match.index! < record.index! + record[0].length))
    .sort((left, right) => left.match.index! - right.match.index!);
  const courses = ordered.flatMap((event, index) => {
    const localBefore = source.slice(index === 0 ? 0 : ordered[index - 1].match.index! + ordered[index - 1].match[0].length, event.match.index)
      .split(/[;\n]|\bTHENCE\b/i).at(-1)!;
    if (/\b(?:BEARS|BEARING|SAID\s+LINE\s+BEING)\s*(?:DUE\s*)?$/i.test(localBefore)
      || /\bFROM\s+WHICH\b.*\bBEARS\b/i.test(localBefore))
      return [];
    const end = ordered[index + 1]?.match.index ?? source.length;
    const clause = source.slice(event.match.index! + event.match[0].length, end);
    const distance = clause.split(/[;\n]|\bTHENCE\b/i)[0].match(distancePattern)?.[0];
    return [{ start: event.match.index!, kind: event.kind, bearing: event.match[0], distance, clause, detail: source.slice(event.match.index, end) }];
  });
  const offset = source.slice(0, ordered[0]?.match.index ?? source.length)
    .match(new RegExp("(" + number + "\\s*" + unit + ")\\s+(EASTERLY|WESTERLY|NORTHERLY|SOUTHERLY)\\s+FROM\\b", "i"));
  return offset ? [{ start: offset.index!, kind: "bearing", bearing: offset[2], distance: offset[1], clause: "", detail: offset[0],
    issue: "Commencement offset; not a boundary course." }, ...courses] : courses;
}
export function parseStreetRelativeBoundary(group: LegalGroup): BoundaryCourse[] | null {
  const clauses = [...new Set(readList([
      group.source ?? "",
      ...getElements(group).filter(element => element.aspect === "bearings" || element.aspect === "distances").map(element => element.value ?? ""),
    ], false).map(value => value.replace(/\s+/g, " ").trim().replace(/\.$/, "")))];
  const directions = clauses.map(value => value.match(/^(NORTH|SOUTH|EAST|WEST)(?:WARD|ERLY)\s+AT\s+RIGHT\s+ANGLES\s+TO\s+(.+)$/i)).filter(match => match !== null);
  const direction = directions[0];
  if (!direction)
    return null;
  const heading = parseBearing(direction[1])!;
  if (directions.some(match => parseBearing(match[1]) !== heading || match[2].toUpperCase() !== direction[2].toUpperCase()))
    return null;
  const sides = clauses.map(value => value.match(/^(NORTH|SOUTH|EAST|WEST|[NSEW])(?:ERLY)?\s+SIDE\s+OF\s+(.+)$/i))
    .filter((match): match is RegExpMatchArray => match !== null && match[2].toUpperCase() === direction[2].toUpperCase());
  if (!sides.length || sides.some(side => parseBearing(side[1]) !== heading))
    return null;
  const dimensions = { frontage: new Map<number, string>(), depth: new Map<number, string>() };
  const dimensionPattern = new RegExp("^(" + distancePattern.source + ")\\s+(FRONTAGE|FRONT|DEPTH|DEEP)$", "i");
  for (const value of clauses.filter(value => /\b(?:FRONTAGE|FRONT|DEPTH|DEEP)$/i.test(value))) {
    const match = value.match(dimensionPattern);
    if (!match)
      return null;
    const length = parseDistance(match[1]);
    if (length === null || length <= 0)
      return null;
    dimensions[/^FRONT/i.test(match[2]) ? "frontage" : "depth"].set(length, match[1]);
  }
  if (dimensions.frontage.size !== 1 || dimensions.depth.size !== 1)
    return null;
  const distances = [...dimensions.frontage.values(), ...dimensions.depth.values()];
  return [0, 1, 2, 3].map(index => ({
    kind: "bearing", bearing: ["N", "E", "S", "W"][(heading / 90 + index + 3) % 4],
    distance: distances[index % 2], clause: "",
    detail: `${distances[0]} frontage · ${distances[1]} depth · ${direction[0]}`,
  }));
}
function matrixAngle(value: string): number | null {
  return parseBearing(value.replace(/\b(?:SUBSTANTIALLY|DUE)\b/gi, "").replace(/\s+/g, " ").trim());
}
function matrixEntry(value: string): MatrixCourse {
  const angular = value.match(/\b(?:NORTH|SOUTH|[NS])\s*\d[^;]*?\b(?:EAST|WEST|[EW])\b/i);
  const distance = [...value.matchAll(new RegExp(distancePattern.source, "gi"))].find(match => !angular
    || match.index! < angular.index! || match.index! >= angular.index! + angular[0].length);
  const bearing = distance ? (value.slice(0, distance.index).trim() + " " + value.slice(distance.index! + distance[0].length).trim()).trim() : value.trim();
  const label = bearing.replace(/^APPROXIMATELY\s*$/i, "").trim();
  const angle = matrixAngle(label);
  const rawDistance = distance?.[0] ?? (angle === null && /^\s*-?(?:\d|\.\d)/.test(value) ? value.trim() : undefined);
  const metres = rawDistance === undefined ? null : parseDistance(rawDistance);
  return {
    kind: "bearing", bearing: rawDistance === value.trim() ? "" : label, distance: rawDistance, clause: "", detail: value,
    angle, metres,
    paired: angle !== null && rawDistance !== undefined,
    missingBearing: label === "" && metres !== null, missingDistance: rawDistance === undefined && angle !== null,
  };
}
function fieldCourses(bearings: string[], distances: string[], source = ""): MatrixCourse[] {
  const fields = [bearings, distances].map((values, index) => readList(values, index === 1).map(matrixEntry)).map(field => {
    const units = new Set(field.flatMap(course => course.metres !== null && course.distance
      ? [course.distance.match(new RegExp(unit + "$", "i"))?.[0].toUpperCase().replace(/\.$/, "")] : []).filter(Boolean));
    const inherited = units.size === 1 ? [...units][0] : undefined;
    const entries = inherited ? field.map(course => course.distance && new RegExp("^" + number + "$", "i").test(course.distance)
      ? { ...course, distance: `${course.distance} ${inherited}`, metres: parseDistance(`${course.distance} ${inherited}`) } : course) : field;
    return entries.some(course => course.angle !== null || course.distance !== undefined || angularStart.test(course.bearing)) ? entries : [];
  });
  if (fields.every(field => field.every(course => course.angle === null && !angularStart.test(course.bearing))))
    return [];
  const rows: {
    course: MatrixCourse;
    order: number;
  }[] = [];
  const separate = fields.findIndex(field => field.length > 0 && field.every(course => course.angle !== null && course.distance === undefined));
  const used = new Set<MatrixCourse>();
  // An explicit source association can identify a gap in unequal measurement lists.
  const associations = readSource(source, new RegExp(bearingPattern.source + "|(?<![\\w'’])(?:NORTH|SOUTH|EAST|WEST)(?![\\w'’])", "gi"));
  for (const [fieldIndex, field] of fields.entries()) {
    for (const [index, course] of field.entries()) {
      if (used.has(course))
        continue;
      const other = fields[1 - fieldIndex];
      let match: MatrixCourse | undefined;
      if (course.angle !== null && course.distance === undefined) {
        const verified = associations.filter(item => matrixAngle(item.bearing) === course.angle && item.distance !== undefined)
          .flatMap(item => other.filter(candidate => !used.has(candidate) && sameDistance(candidate.metres, parseDistance(item.distance!))
          && (candidate.bearing === "" || candidate.angle === course.angle)));
        if (new Set(verified).size === 1)
          match = verified[0];
      }
      const same = other[index];
      if (!match && same && !used.has(same)
        && (course.bearing === "" || same.bearing === "" || course.angle !== null && course.angle === same.angle)
        && (course.distance === undefined || same.distance === undefined || sameDistance(course.metres, same.metres)))
        match = same;
      if (!match && course.distance === undefined && course.angle !== null)
        match = other.find(candidate => !used.has(candidate) && candidate.bearing === "" && candidate.distance !== undefined);
      if (!match && course.bearing === "" && course.distance !== undefined)
        match = other.find(candidate => !used.has(candidate) && candidate.angle !== null && candidate.distance === undefined);
      used.add(course);
      const order = separate < 0 ? (fieldIndex === 0 ? index : fields[0].length + index)
        : fieldIndex === separate && match ? other.indexOf(match) : index;
      if (match) {
        used.add(match);
        const bearing = course.bearing === "" ? match : course;
        const distance = course.distance === undefined ? match : course;
        const association = associations.find(item => matrixAngle(item.bearing) === bearing.angle && item.distance !== undefined && sameDistance(parseDistance(item.distance), distance.metres));
        rows.push({ order, course: { ...bearing, distance: distance.distance, metres: distance.metres,
            paired: bearing.paired || distance.paired || association !== undefined,
            missingBearing: bearing.bearing === "", missingDistance: distance.distance === undefined,
            detail: `${course.detail} · ${match.detail}`,
            clause: association?.clause ?? "" } });
      }
      else
        rows.push({ order, course: { ...course } });
    }
  }
  return rows.sort((left, right) => left.order - right.order).map(row => row.course);
}
function isComplete(course: MatrixCourse): course is SurveyCourse {
  return course.kind === "bearing" && course.angle !== null && course.metres !== null && course.metres > 0;
}
type SourceSequence = {
  courses: SurveyCourse[];
  beginning: number;
};
function fromSource(source: string): SourceSequence {
  const courses: SurveyCourse[] = [];
  const starts: number[] = [];
  for (const { start, ...entry } of readSource(source)) {
    const parsed: MatrixCourse = { ...entry, angle: entry.kind === "bearing" ? parseBearing(entry.bearing) : null,
      metres: entry.distance === undefined ? null : parseDistance(entry.distance), paired: true, missingBearing: false, missingDistance: false };
    if (isComplete(parsed)) { courses.push(parsed); starts.push(start); }
  }
  let beginning = courses[0]?.issue === "Commencement offset; not a boundary course." ? 1 : 0;
  const explicit = /\bTHENCE\s+FROM\s+(?:SAID|THIS|THE)\s*["“]?(?:TRUE\s+)?(?:(?:PLACE|POINT)\s+OF\s+)?BEGINNING\b/i.exec(source)?.index;
  const markers = [...source.matchAll(/\b(?:TRUE\s+)?(?:PLACE|POINT)\s+OF\s+BEGINNING\b/gi)].map(marker => marker.index);
  for (const marker of [...(explicit === undefined ? [] : [explicit]), ...markers].sort((left, right) => left - right)) {
    const count = starts.filter(start => start < marker).length;
    if (count === 0 || count === courses.length) continue;
    if (geometry(courses.slice(beginning, count), 1 / 5000).closed) {
      courses.splice(count);
      break;
    }
    beginning = count;
  }
  return { courses, beginning };
}

function fieldCounts(input: BoundaryInput): {
  bearings: number;
  distances: number;
} {
  const courses = fieldCourses(input.bearings, input.distances);
  return { bearings: courses.filter(course => course.angle !== null).length, distances: courses.filter(course => course.metres !== null).length };
}
function pointVectors(courses: SurveyCourse[]) {
  const points = [{ x: 0, y: 0 }];
  for (const c of courses) {
    const a = c.angle * Math.PI / 180;
    const last = points[points.length - 1];
    points.push({ x: last.x + c.metres * Math.sin(a), y: last.y - c.metres * Math.cos(a) });
  }
  return points;
}
function cross(a: {
  x: number;
  y: number;
}, b: {
  x: number;
  y: number;
}, c: {
  x: number;
  y: number;
}) {
  return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
}
function crosses(a: {
  x: number;
  y: number;
}, b: {
  x: number;
  y: number;
}, c: {
  x: number;
  y: number;
}, d: {
  x: number;
  y: number;
}, eps: number): boolean {
  const abC = cross(a, b, c), abD = cross(a, b, d), cdA = cross(c, d, a), cdB = cross(c, d, b);
  const on = (p: {
    x: number;
    y: number;
  }, q: {
    x: number;
    y: number;
  }, r: {
    x: number;
    y: number;
  }) => Math.abs(cross(p, q, r)) <= eps &&
    r.x >= Math.min(p.x, q.x) - 1e-8 && r.x <= Math.max(p.x, q.x) + 1e-8 &&
    r.y >= Math.min(p.y, q.y) - 1e-8 && r.y <= Math.max(p.y, q.y) + 1e-8;
  // Nonadjacent segment touches, T-junctions and overlapping edges invalidate a simple polygon.
  return (abC > eps && abD < -eps || abC < -eps && abD > eps) &&
    (cdA > eps && cdB < -eps || cdA < -eps && cdB > eps) ||
    on(a, b, c) || on(a, b, d) || on(c, d, a) || on(c, d, b);
}
function geometry(courses: SurveyCourse[], closureRatio: number, acreage?: number) {
  const p = pointVectors(courses);
  const end = p[p.length - 1];
  const residual = Math.hypot(end.x, end.y);
  const perimeter = courses.reduce((s, c) => s + c.metres, 0);
  const areaM2 = Math.abs(p.slice(0, -1).reduce((s, pt, i) => s + pt.x * p[i + 1].y - p[i + 1].x * pt.y, 0) / 2);
  const areaAcres = areaM2 / 4046.8564224;
  const epsilon = Math.max(1e-12, perimeter * perimeter * 1e-12);
  const degenerate = areaM2 <= epsilon;
  const edges = p.length - 1;
  let selfCrossing = false;
  for (let i = 0; i < edges; i++)
    for (let j = i + 2; j < edges; j++) {
      if (i === 0 && j === edges - 1)
        continue;
      if (crosses(p[i], p[i + 1], p[j], p[j + 1], epsilon))
        selfCrossing = true;
    }
  // The caller can select a tighter threshold; cap permissive ratios.
  const tolerance = Math.max(.006096, perimeter * Math.min(Math.max(closureRatio, 0), 1 / 2000));
  const acreageDeviation = acreage && acreage > 0 ? Math.abs(areaAcres / acreage - 1) : 0;
  return { residual, perimeter, areaAcres, acreageDeviation,
    valid: courses.length >= 3 && !degenerate && !selfCrossing,
    closed: courses.length >= 3 && !degenerate && !selfCrossing && residual <= tolerance };
}
function acreageValue(source?: string): number | undefined {
  const values = [...(source ?? "").matchAll(/(?<![\d.,-])((?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?)\s*(?:ACRES?|AC\b)/gi)]
    .map(match => Number(match[1].replaceAll(",", ""))).filter(value => value > 0 && Number.isFinite(value));
  return new Set(values).size === 1 ? values[0] : undefined;
}
type Choice = {
  courses: SurveyCourse[];
  beginning: number;
  edits: number;
  omitted: number[];
  calculatedAcres: number;
  residual: number;
  score: number;
};
function choose(input: SurveyCourse[], ratio: number, acres: number | undefined, tieHint: number | undefined, allowRePair: boolean): Choice | null {
  const choices: Choice[] = [];
  const maxTie = Math.min(12, Math.max(0, input.length - 3));
  for (let start = 0; start <= maxTie; start++) {
    if (tieHint !== undefined && start !== tieHint)
      continue;
    const base = input.slice();
    const test = (cs: SurveyCourse[], edits: number, omitted: number[] = []) => {
      const g = geometry(cs.slice(start), ratio, acres);
      if (!g.closed)
        return;
      const penalty = g.acreageDeviation > .20 ? 50 * g.acreageDeviation : g.acreageDeviation;
      const score = edits * 4 + omitted.length * 6 + start * .2 + penalty + g.residual / Math.max(.001, g.perimeter);
      choices.push({ courses: cs, beginning: start, edits, omitted, calculatedAcres: g.areaAcres, residual: g.residual, score });
    };
    test(base, 0);
    if (!allowRePair || tieHint !== undefined)
      continue; // Do not revise explicit source pairings.
    // Extracted-only lists can contain unrelated measurements. Exclude at most
    // two interior calls if the remaining ordered courses make a measured polygon.
    if (base.length <= 16 && base.length - start >= 5) {
      for (let i = start; i < base.length; i++) {
        const once = base.filter((_, index) => index !== i);
        if (once.length - start >= 3)
          test(once, 0, [i]);
        if (base.length - start < 6)
          continue;
        for (let j = i + 1; j < base.length; j++) {
          const twice = base.filter((_, index) => index !== i && index !== j);
          if (twice.length - start >= 3)
            test(twice, 0, [i, j]);
        }
      }
    }
    // When extracted pairing fails, perform a bounded single-distance transposition.
    // Keep direction order. Never change measured values.
    if (choices.some(x => x.beginning === start && x.edits === 0))
      continue;
    if (base.length > 16)
      continue;
    for (let i = start; i < base.length; i++)
      for (let j = i + 1; j < base.length; j++) {
        if (base[i].metres === base[j].metres)
          continue;
        const cs = base.map(c => ({ ...c }));
        const di = cs[i].distance, mi = cs[i].metres;
        cs[i].distance = cs[j].distance;
        cs[i].metres = cs[j].metres;
        cs[j].distance = di;
        cs[j].metres = mi;
        cs[i].issue = cs[j].issue = "Distance association inferred geometrically; verify source.";
        test(cs, 1);
      }
  }
  choices.sort((a, b) => a.score - b.score || a.beginning - b.beginning);
  const first = choices[0];
  if (!first)
    return null;
  // Geometry alone is insufficient to select between similarly good re-pairings.
  if (first.edits > 0) {
    const equivalent = choices.some(other => other !== first && other.edits === first.edits &&
      Math.abs(other.score - first.score) < .01);
    if (equivalent)
      return null;
  }
  return first;
}
/** Convert a coordinate displacement into a visibly synthetic bearing-distance course. */
function syntheticCourse(dx: number, dy: number, explanation: string): SurveyCourse | null {
  const metres = Math.hypot(dx, dy);
  if (metres < 1e-10 || !Number.isFinite(metres))
    return null;
  const ns = dy <= 0 ? "N" : "S", ew = dx >= 0 ? "E" : "W";
  const quadrant = Math.atan2(Math.abs(dx), Math.abs(dy)) * 180 / Math.PI;
  const bearing = `${ns} ${quadrant.toFixed(12)}° ${ew}`;
  const angle = parseBearing(bearing);
  if (angle === null)
    return null;
  return { kind: "bearing", bearing, distance: `${metres.toFixed(12)} m`, angle, metres,
    detail: explanation, clause: "", paired: false, missingBearing: false, missingDistance: false,
    synthetic: true, issue: explanation };
}
type PartialCandidate = {
  courses: SurveyCourse[];
  beginning: number;
  residual: number;
  areaAcres: number;
  deviation: number;
  score: number;
};
/** Retain measured edges and add precisely ONE synthetic border if this makes a simple polygon. */
function completeWithUnconfirmedEdge(base: SurveyCourse[], ratio: number, acres: number | undefined, tieHint: number | undefined): PartialCandidate | null {
  const candidates: PartialCandidate[] = [];
  const maxTie = Math.min(12, Math.max(0, base.length - 2));
  for (let start = 0; start <= maxTie; start++) {
    if (tieHint !== undefined && start !== tieHint)
      continue;
    const measured = base.slice(start);
    if (measured.length < 2)
      continue;
    const pts = pointVectors(measured), end = pts[pts.length - 1];
    const residual = Math.hypot(end.x, end.y);
    const totalLength = measured.reduce((sum, c) => sum + c.metres, 0);
    // An invented side longer than the surveyed path is usually less informative
    // than an explicitly synthetic area-only template.
    if (!Number.isFinite(totalLength) || totalLength <= 0 || residual >= totalLength * .95)
      continue;
    const closing = syntheticCourse(-end.x, -end.y, "UNCONFIRMED: Synthetic closing border; no source measurement supports this line.");
    if (!closing)
      continue;
    const g = geometry([...measured, closing], ratio, acres);
    if (!g.closed)
      continue; // The added edge must actually terminate at POB.
    const deviation = acres && acres > 0 ? g.acreageDeviation : 0;
    // Avoid misleading shapes when a known acreage rejects the candidate.
    if (acres && deviation > .35)
      continue;
    const score = deviation * 8 + residual / totalLength * 2 + start * .025 + 1 / measured.length;
    candidates.push({ courses: [...base, closing], beginning: start, residual, areaAcres: g.areaAcres, deviation, score });
  }
  candidates.sort((a, b) => a.score - b.score || a.beginning - b.beginning);
  return candidates[0] ?? null;
}
/** Preserve a single source-confirmed side and infer three other sides from stated area. */
function oneCourseSchematic(measured: SurveyCourse, acres: number): ReconstructedBoundary | null {
  if (!Number.isFinite(measured.metres) || measured.metres <= 0 || !Number.isFinite(acres) || acres <= 0)
    return null;
  const pts = pointVectors([measured]), delta = pts[1];
  const width = acres * 4046.8564224 / measured.metres;
  if (!Number.isFinite(width) || width <= 0)
    return null;
  // Rotate the measured direction 90 degrees; other sides are wholly inferred.
  const x = delta.x, y = delta.y, wx = y / measured.metres * width, wy = -x / measured.metres * width;
  const message = "UNCONFIRMED: Area-derived side; no bearing or distance in the source supports this line.";
  const invented = [syntheticCourse(wx, wy, message), syntheticCourse(-x, -y, message), syntheticCourse(-wx, -wy, message)];
  if (invented.some(c => c === null))
    return null;
  const courses = [measured, ...invented.filter((c): c is SurveyCourse => c !== null)];
  const g = geometry(courses, 1 / 5000, acres);
  if (!g.valid || g.residual > .000001)
    return null;
  return { courses, beginning: 0, closed: true, method: "source", completion: "partial", closureMetres: undefined,
    calculatedAcres: g.areaAcres, issue: "PARTIALLY UNCONFIRMED: Only one source-supported border; the other three are fabricated using stated acreage." };
}
/** A completely made-up area-based outline. No segment is represented as observed. */
function acreageSchematic(acres: number | undefined, input: BoundaryInput, reason: string): ReconstructedBoundary | null {
  if (!acres || !Number.isFinite(acres) || acres <= 0)
    return null;
  const side = Math.sqrt(acres * 4046.8564224);
  if (!Number.isFinite(side) || side <= 0)
    return null;
  const deltas: [
    [
      number,
      number
    ],
    [
      number,
      number
    ],
    [
      number,
      number
    ],
    [
      number,
      number
    ]
  ] = [[side, 0], [0, side], [-side, 0], [0, -side]];
  const courses = deltas.map(([dx, dy]) => syntheticCourse(dx, dy, "UNCONFIRMED: Area-derived schematic border; not a measured course."))
    .filter((x): x is SurveyCourse => x !== null);
  const g = geometry(courses, 1 / 5000, acres);
  if (!g.closed)
    return null;
  const count = fieldCounts(input);
  const evidence = count.bearings || count.distances ? ` Extracted measurements: ${count.bearings} bearings, ${count.distances} distances; association unresolved.` : "";
  return { courses, beginning: 0, closed: true, method: "synthetic", completion: "synthetic",
    closureMetres: undefined, calculatedAcres: acres,
    issue: `Entire polygon is Unconfirmed - acreage-based illustration, NOT a source-verified boundary. ${reason}${evidence}` };
}
export function reconstructBoundary(input: BoundaryInput): ReconstructedBoundary {
  const ratio = input.closureRatio ?? 1 / 5000;
  const acres = acreageValue(input.acreage);
  const source = input.source ?? "";
  const original = fromSource(source);
  const field = fieldCourses(input.bearings, input.distances, source).filter(isComplete);
  const hasSource = original.courses.length >= 3;
  const base = hasSource ? original.courses : field;
  const method: ReconstructedBoundary["method"] = hasSource ? "source" : field.length ? "extracted" : "none";
  const allowSchematic = input.allowSchematic !== false;
  const hint = hasSource && original.beginning > 0 ? original.beginning : undefined;
  if (base.length) {
    const matched = choose(base, ratio, acres, hint, !hasSource);
    if (matched) {
      let issue: string | undefined;
      if (!hasSource)
        issue = "Boundary inferred from extracted measurements; source pairing and tie lines unverified.";
      else if (matched.beginning > 0 && hint === undefined)
        issue = "Tie inferred from closure; source did not explicitly identify its position.";
      if (matched.edits)
        issue = "Bearing-distance associations inferred from geometry; verification required.";
      if (matched.omitted.length)
        issue = (issue ? issue + " " : "") + `${matched.omitted.length} extracted course(s) were excluded as unassigned; source review required.`;
      if (hasSource && field.some(f => !original.courses.some(c => Math.abs(c.angle - f.angle) < 1e-7 && Math.abs(c.metres - f.metres) < .001)))
        issue = "Extracted bearing-distance association contradicts the legal description; source measurements used.";
      const dev = acres && acres > 0 ? Math.abs(matched.calculatedAcres / acres - 1) : 0;
      if (dev > .10)
        issue = (issue ? issue + " " : "") + "Calculated acreage differs materially from stated acreage.";
      const courses = matched.courses.map((c, i) => !hasSource ? { ...c, issue: c.issue ?? (i < matched.beginning ?
          "Unconfirmed tie: inferred from closure, not source-supported." : "Unconfirmed extracted association: source evidence not available.") } :
        i < matched.beginning && hint === undefined ? { ...c, issue: c.issue ?? "Unconfirmed tie: inferred from closure, not source-supported." } : c);
      return { courses, beginning: matched.beginning, closed: true, issue, method, completion: "measured",
        closureMetres: matched.residual, calculatedAcres: matched.calculatedAcres };
    }
    const g = geometry(base.slice(hint ?? 0), ratio, acres);
    if (allowSchematic) {
      const candidate = completeWithUnconfirmedEdge(base, ratio, acres, hint);
      if (candidate) {
        const courses = candidate.courses.map((c, i) => hasSource || c.synthetic ? c : { ...c, issue: c.issue ??
            (i < candidate.beginning ? "Unconfirmed: tie inferred from geometry." : "Unconfirmed: extracted pairing not source-verified.") });
        const issue = `PARTIALLY UNCONFIRMED: Synthetic closing border inserted; measured misclosure ${candidate.residual.toFixed(4)} m. ` +
          (hasSource ? "Source courses unchanged." : "Extracted bearing-distance associations require verification.");
        return { courses, beginning: candidate.beginning, closed: true, method, completion: "partial",
          issue, closureMetres: candidate.residual, calculatedAcres: candidate.areaAcres };
      }
      const template = acreageSchematic(acres, input, "Measured courses cannot form a credible simple polygon.");
      if (template)
        return template;
    }
    return { courses: base, beginning: hint ?? 0, closed: false, method, completion: "open",
      closureMetres: g.residual, calculatedAcres: g.areaAcres,
      issue: "Boundary remains open or geometrically invalid; source measurements preserved without forced closure." };
  }
  if (allowSchematic) {
    // Use a real source-backed side when it is the only course in the source.
    if (original.courses.length === 1 && /\bTHENCE\b/i.test(source) && acres
      && !/\b(?:TO|AT|AND)\s+(?:THE\s+)?TRUE\s+(?:PLACE|POINT)\s+OF\s+BEGINNING\b/i.test(source)) {
      const one = oneCourseSchematic(original.courses[0], acres);
      if (one)
        return one;
    }
    const template = acreageSchematic(acres, input, "Source-supported course pairing is missing or incomplete.");
    if (template)
      return template;
  }
  return { courses: [], beginning: 0, closed: false, method, completion: "open",
    issue: "Insufficient paired boundary measurements and acreage for a schematic." };
}
function drawBoundary(group: LegalGroup, title: string, boundary: ReconstructedBoundary): MetesScene {
  const { courses, ...construction } = boundary;
  const scene: MetesScene = { ...construction, title, items: [], notes: getNotes(getElements(group).filter(element => element.value?.trim())), courses: [] };
  let point: MetesPoint = { x: 0, y: 0 };
  let heading: number | undefined;
  let curve: {
    radius: number;
    turn: number;
  } | undefined;
  let positionIssue: string | undefined;
  let anchor: MetesPoint = point;
  for (const [index, course] of courses.entries()) {
    if (course.unassigned) {
      scene.courses.push({ bearing: course.bearing, distance: course.distance, confirmed: false, issue: course.issue, unassigned: true });
      continue;
    }
    const { clause, metres, angle } = course;
    let issue = positionIssue ? [course.issue, "Position depends on an earlier unconfirmed course: " + positionIssue].filter(Boolean).join(" ") : course.issue;
    let to: MetesPoint | undefined;
    let arc: MetesLine["arc"];
    if (course.kind === "curve") {
      if (curve && heading !== undefined && metres !== null) {
        issue = "Curve-based position requires review.";
        const sweep = metres / curve.radius;
        const center: MetesPoint = { x: point.x + curve.turn * curve.radius * Math.cos(heading), y: point.y + curve.turn * curve.radius * Math.sin(heading) };
        heading += curve.turn * sweep;
        to = { x: center.x - curve.turn * curve.radius * Math.cos(heading), y: center.y - curve.turn * curve.radius * Math.sin(heading) };
        arc = { ...curve, center, sweep };
        scene.issue ??= "Unconfirmed boundary: curve-based positions require review.";
      }
      else {
        issue = "Curve geometry is incomplete.";
        scene.issue ??= "Boundary needs review: a curve requires source geometry.";
      }
      positionIssue = issue;
    }
    else {
      if (angle === null || metres === null) {
        scene.issue ??= angle === null ? "Boundary needs review: a bearing is unreadable." : "Boundary needs review: a distance is missing or unreadable.";
        issue = angle === null ? "Bearing is unreadable." : "Distance is missing or unreadable.";
        if (metres !== null && /\b(?:PLACE|POINT)\s+OF\s+BEGINNING\b/i.test(clause))
          to = anchor;
        positionIssue = issue;
      }
      else {
        heading = angle * Math.PI / 180;
        to = { x: point.x + Math.sin(heading) * metres, y: point.y - Math.cos(heading) * metres };
      }
    }
    if (metres === 0)
      issue = "Distance is zero.";
    const bearing = course.kind === "curve" ? curve ? "Curve " + (curve.turn === 1 ? "right" : "left") : "Curve" : course.bearing;
    const confirmed = issue === undefined;
    scene.courses.push({ bearing, distance: course.distance, confirmed, ...(issue ? { issue } : {}), ...(to === anchor ? { target: scene.beginning !== undefined ? scene.beginning + 1 : 1 } : {}) });
    if (to && course.distance) {
      scene.items.push({ kind: "line", label: "Course " + scene.courses.length, detail: course.detail, sequence: scene.courses.length, from: point, to, bearing, distance: course.distance, confirmed, ...(arc ? { arc } : {}) });
      point = to;
    }
    else {
      scene.schematic = true;
    }
    if (index + 1 === scene.beginning)
      anchor = point;
    if (course.kind === "bearing") {
      const turn = clause.match(/\bCURVE\s+TO\s+THE\s+(LEFT|RIGHT)\b/i);
      const radius = clause.match(new RegExp("\\bRADIUS\\s+OF\\s+(" + number + "\\s*" + unit + ")", "i"));
      const radiusMetres = radius ? parseDistance(radius[1]) : null;
      curve = turn && radiusMetres !== null && radiusMetres > 0 ? { radius: radiusMetres, turn: turn[1].toUpperCase() === "RIGHT" ? 1 : -1 } : undefined;
    }
  }
  if (scene.ending !== undefined)
    scene.courses[scene.ending - 1].target = (scene.beginning ?? 0) + 1;
  return scene;
}
export function buildMatrix(group: LegalGroup, title: string, options: {
  allowSchematic?: boolean;
  closureRatio?: number;
} = {}): MetesScene {
  const elements = getElements(group).filter(element => element.value?.trim());
  const source = group.source ?? "";
  const bearings = elements.filter(element => element.aspect === "bearings").map(element => element.value!);
  const distances = elements.filter(element => element.aspect === "distances").map(element => element.value!);
  const parsed = readSource(source).map((course): MatrixCourse => ({ ...course,
    angle: course.kind === "bearing" ? parseBearing(course.bearing) : null,
    metres: course.distance === undefined ? null : parseDistance(course.distance), paired: true, missingBearing: false, missingDistance: false }));
  if (parsed.some(course => course.kind === "curve")) {
    const beginning = parsed.findIndex((course, index) => {
      if (index === parsed.length - 1 || !/\b(?:TRUE\s+)?(?:PLACE|POINT)\s+OF\s+BEGINNING\b|\bTHENCE\s+FROM\s+(?:SAID|THIS|THE)\s*(?:(?:PLACE|POINT)\s+OF\s+)?BEGINNING\b/i.test(course.clause))
        return false;
      const prefix = parsed.slice(0, index + 1);
      if (!prefix.every(isComplete))
        return true;
      const measured = geometry(prefix, options.closureRatio ?? 1 / 5000);
      return measured.residual > Math.max(0.006096, measured.perimeter * Math.min(Math.max(options.closureRatio ?? 1 / 5000, 0), 1 / 2000));
    });
    return drawBoundary(group, title, { courses: parsed, beginning: beginning < 0 ? undefined : beginning + 1,
      closed: false, method: "source", completion: "open", schematic: parsed.some(course => course.issue !== undefined) });
  }
  const extracted = fieldCourses(bearings, distances, source);
  const raw = parsed.length ? parsed : extracted;
  if (raw.length === 0) {
    const street = parseStreetRelativeBoundary(group);
    if (street) {
      const issue = "Unconfirmed boundary: street-relative schematic requires review.";
      return drawBoundary(group, title, { courses: street.map(course => ({ ...course, angle: parseBearing(course.bearing), metres: parseDistance(course.distance!),
          paired: false, missingBearing: false, missingDistance: false, issue })), ending: street.length, closed: false, method: "extracted", completion: "synthetic", schematic: true, issue });
    }
  }
  const boundary = reconstructBoundary({ source, bearings, distances,
    acreage: elements.filter(element => element.aspect === "acreage").map(element => element.value!).join("; "), ...options });
  if (!boundary.closed) {
    const original = boundary.method === "source" ? parsed : boundary.method === "extracted" ? extracted : raw;
    const courses = original.map(course => ({ ...course, issue: course.issue ?? (!parsed.length
      ? "Unconfirmed extracted association: source evidence not available." : undefined) }));
    return drawBoundary(group, title, { ...boundary, courses,
      beginning: boundary.courses.length ? boundary.beginning : undefined,
      schematic: courses.some(course => course.issue !== undefined),
      issue: boundary.courses.length ? boundary.issue : raw.length ? undefined : "Sorry, this parcel’s boundary couldn’t be drawn from the available details." });
  }
  const available = [...(boundary.method === "source" ? parsed : boundary.method === "synthetic" ? raw : extracted)];
  let lastSource = -1;
  for (const course of boundary.courses) {
    if (course.synthetic)
      continue;
    const index = available.findIndex(item => item.detail === course.detail && item.bearing === course.bearing);
    if (index >= 0) {
      lastSource = Math.max(lastSource, parsed.indexOf(available[index]));
      available.splice(index, 1);
    }
  }
  const ending = boundary.courses.length;
  const courses = [...boundary.courses, ...available.map(course => {
    if (boundary.method === "source" && isComplete(course) && parsed.indexOf(course) > lastSource)
      return { ...course, issue: "Course follows the closed parcel." };
    return { ...course, unassigned: true as const, issue: course.issue ?? (course.angle === null ? "Bearing is unreadable."
      : course.metres === null ? "Distance is missing or unreadable." : course.metres === 0 ? "Distance is zero."
        : "Unassigned source or extracted measurement; excluded from the illustrated outline.") };
  })];
  const trailing = courses.slice(ending).some(course => !course.unassigned);
  return drawBoundary(group, title, { ...boundary, courses, ending,
    issue: trailing ? [boundary.issue, "Boundary needs review: additional courses follow the closed parcel."].filter(Boolean).join(" ") : boundary.issue,
    schematic: boundary.completion === "partial" || boundary.completion === "synthetic" || courses.some(course => course.issue !== undefined) });
}
