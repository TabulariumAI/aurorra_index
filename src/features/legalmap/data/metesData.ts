import type { LegalGroup } from "aurora-core";
import { getElements, getNotes } from "./legalData";
import { legalMapConstants } from "../style/legalMapStyles";
import { solveMatrix } from "./boundaryMatrix";
import type { BoundaryCourse, MatrixCourse, MetesLine, MetesPoint, MetesScene } from "../type/metes.types";

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
  return angular ? value.replace(/''|[″”"]/g, "″").replace(/[′’']/g, "′").replace(/[º˚]/g, "°").replace(/\s*([°′″])/g, "$1").replace(/([°′″])\s+(?=\d)/g, "$1")
    : value.replace(/(\d)\s*'/g, "$1 ft").replace(/(\d)\s*"/g, "$1 in");
}

export function parseBearing(source: string): number | null {
  const value = formatMeasure(source, true).trim().toUpperCase().replace(/,/g, " ").replace(/′/g, "'").replace(/″/g, '"');
  const cardinal: Record<string, number> = { N: 0, NE: 45, E: 90, SE: 135, S: 180, SW: 225, W: 270, NW: 315 };
  if (Object.hasOwn(cardinal, value)) return cardinal[value];
  const match = value.match(/^([NS])\s*(\d+(?:\.\d+)?)(?:\s+(\d+)\s*\/\s*(\d+))?\s*°?\s*(?:(\d+(?:\.\d+)?)\s*')?\s*(?:(\d+(?:\.\d+)?)\s*")?\s*([EW])$/);
  if (!match) return null;
  const numerator = Number(match[3] ?? 0);
  const denominator = Number(match[4] ?? 1);
  const minutes = Number(match[5] ?? 0);
  const seconds = Number(match[6] ?? 0);
  if (denominator === 0 || numerator >= denominator || minutes >= 60 || seconds >= 60) return null;
  const angle = Number(match[2]) + numerator / denominator + minutes / 60 + seconds / 3600;
  if (angle > 90) return null;
  return match[1] === "N" ? (match[7] === "E" ? angle : (360 - angle) % 360)
    : match[7] === "E" ? 180 - angle : 180 + angle;
}

const units: Record<string, number> = {
  feet: 0.3048, foot: 0.3048, ft: 0.3048, "'": 0.3048,
  meters: 1, meter: 1, metres: 1, metre: 1, m: 1,
  inches: 0.0254, inch: 0.0254, in: 0.0254, '"': 0.0254,
  yards: 0.9144, yard: 0.9144, yd: 0.9144,
  chains: 20.1168, chain: 20.1168, ch: 20.1168,
  rods: 5.0292, rod: 5.0292, links: 0.201168, link: 0.201168,
  miles: 1609.344, mile: 1609.344, mi: 1609.344,
};
const number = "(?:\\d+(?:,\\d{3})*(?:\\.\\d+)?|\\.\\d+)";
const unit = "(?:FEET|FOOT|FT\\.?|METERS?|METRES?|M|INCH(?:ES)?|IN|YARDS?|YD|CHAINS?|CH|RODS?|LINKS?|MILES?|MI|['\"])(?![A-Z])";
// Preserve compound measurements for validation instead of drawing a valid prefix.
const distancePattern = new RegExp("(?<![-\\w.,])-?" + number + "\\s*" + unit + "(?:\\s*-?" + number + "\\s*" + unit + ")*", "i");
const lengthPattern = new RegExp("^" + number + "\\s*(?:(?:FEET|FOOT|FT\\.?|')\\s*" + number + "\\s*(?:INCH(?:ES)?|IN|\")(?![A-Z])|" + unit + ")$", "i");
const bearingPattern = new RegExp(
  "(?<![\\w'’])(?:NORTH|SOUTH|N|S)\\.?\\s*\\d+(?:\\.\\d+)?(?:\\s+\\d+\\s*\\/\\s*\\d+)?\\s*(?:DEGREES?|DEG\\.?|[°º˚])?(?:\\s*\\d+(?:\\.\\d+)?\\s*(?:MINUTES?|MIN\\.?|['′’:]))?(?:\\s*\\d+(?:\\.\\d+)?\\s*(?:SECONDS?|SEC\\.?|[\"″”]|''))?\\s*,?\\s*(?:EAST|WEST|E|W)\\b"
  + "|(?<![\\w'’])(?:NORTH|SOUTH|EAST|WEST|[NSEW])(?=\\s+-?" + number + "(?![\\d.]|\\s*/)(?!\\s*(?:DEGREES?|DEG\\.?|[°º˚])))", "gi",
);
const angularStart = /^\s*(?:NORTH|SOUTH|[NS])\s*\d/i;

export function parseDistance(source: string): number | null {
  if (!lengthPattern.test(source.trim())) return null;
  const length = [...source.matchAll(new RegExp("(" + number + ")\\s*(" + unit + ")", "gi"))]
    .reduce((sum, match) => sum + Number(match[1].replaceAll(",", "")) * units[match[2].toLowerCase().replace(/\.$/, "")], 0);
  return Number.isFinite(length) ? length : null;
}

function readList(values: string[], distances: boolean): string[] {
  const entries: string[] = [];
  for (const value of values) {
    if (value.trim().startsWith("[")) {
      let parsed: unknown;
      try { parsed = JSON.parse(value); } catch { entries.push(value); continue; }
      if (!Array.isArray(parsed) || parsed.some(item => typeof item !== "string" && !(distances && typeof item === "number"))) {
        entries.push(value);
        continue;
      }
      entries.push(...parsed.map(String));
    } else {
      const spans = [...value.matchAll(bearingPattern), ...value.matchAll(new RegExp(distancePattern.source, "gi"))];
      let start = 0;
      for (const match of value.matchAll(/,(?!\s*\d+(?:\.\d+)?\s*(?:MIN(?:UTES)?|SEC(?:ONDS)?|[\x27\x22′″]))|[;\n|]|\band\b/gi)) {
        if (spans.some(span => match.index! > span.index! && match.index! < span.index! + span[0].length)) continue;
        entries.push(value.slice(start, match.index).trim());
        start = match.index! + match[0].length;
      }
      entries.push(value.slice(start).trim());
    }
  }
  return entries;
}

function readSource(group: LegalGroup, pattern = bearingPattern): BoundaryCourse[] {
  const source = group.source ?? "";
  const records = [...source.matchAll(/\([^)]*\)/g)];
  const events = [
    ...[...source.matchAll(pattern)].map(match => ({ kind: "bearing" as const, match })),
    ...[...source.matchAll(/\b(?:THENCE\s+)?(?:CONTINUING\s+ALONG|ALONG)\s+(?:SAID|A)\s+CURVE\b/gi)].map(match => ({ kind: "curve" as const, match })),
  ].filter(event => !records.some(record => event.match.index! > record.index! && event.match.index! < record.index! + record[0].length))
    .sort((left, right) => left.match.index! - right.match.index!);
  return events.map((event, index) => {
    const end = events[index + 1]?.match.index ?? source.length;
    const clause = source.slice(event.match.index! + event.match[0].length, end);
    const distance = clause.split(/[;\n]/)[0].match(distancePattern)?.[0];
    return { kind: event.kind, bearing: event.match[0], distance, clause, detail: source.slice(event.match.index, end) };
  });
}

export function parseStreetRelativeBoundary(group: LegalGroup): BoundaryCourse[] | null {
  const clauses = [...new Set(readList([
    group.source ?? "",
    ...getElements(group).filter(element => element.aspect === "bearings" || element.aspect === "distances").map(element => element.value ?? ""),
  ], false).map(value => value.replace(/\s+/g, " ").trim().replace(/\.$/, "")))];
  const directions = clauses.map(value => value.match(/^(NORTH|SOUTH|EAST|WEST)(?:WARD|ERLY)\s+AT\s+RIGHT\s+ANGLES\s+TO\s+(.+)$/i)).filter(match => match !== null);
  const direction = directions[0];
  if (!direction) return null;
  const heading = parseBearing(direction[1])!;
  if (directions.some(match => parseBearing(match[1]) !== heading || match[2].toUpperCase() !== direction[2].toUpperCase())) return null;
  const sides = clauses.map(value => value.match(/^(NORTH|SOUTH|EAST|WEST|[NSEW])(?:ERLY)?\s+SIDE\s+OF\s+(.+)$/i))
    .filter((match): match is RegExpMatchArray => match !== null && match[2].toUpperCase() === direction[2].toUpperCase());
  if (!sides.length || sides.some(side => parseBearing(side[1]) !== heading)) return null;
  const dimensions = { frontage: new Map<number, string>(), depth: new Map<number, string>() };
  const dimensionPattern = new RegExp("^(" + distancePattern.source + ")\\s+(FRONTAGE|FRONT|DEPTH|DEEP)$", "i");
  for (const value of clauses.filter(value => /\b(?:FRONTAGE|FRONT|DEPTH|DEEP)$/i.test(value))) {
    const match = value.match(dimensionPattern);
    if (!match) return null;
    const length = parseDistance(match[1]);
    if (length === null || length <= 0) return null;
    dimensions[/^FRONT/i.test(match[2]) ? "frontage" : "depth"].set(length, match[1]);
  }
  if (dimensions.frontage.size !== 1 || dimensions.depth.size !== 1) return null;
  const distances = [...dimensions.frontage.values(), ...dimensions.depth.values()];
  return [0, 1, 2, 3].map(index => ({
    kind: "bearing", bearing: ["N", "E", "S", "W"][(heading / 90 + index + 3) % 4],
    distance: distances[index % 2], clause: "",
    detail: `${distances[0]} frontage · ${distances[1]} depth · ${direction[0]}`,
  }));
}

function drawBoundary(group: LegalGroup, title: string, courses: BoundaryCourse[], schematic: boolean): MetesScene {
  const scene: MetesScene = { title, items: [], notes: getNotes(getElements(group).filter(element => element.value?.trim())), courses: [] };
  if (schematic) {
    scene.schematic = true;
    scene.issue = "Unconfirmed boundary: street-relative schematic requires review.";
  }
  const source = group.source ?? "";
  let point: MetesPoint = { x: 0, y: 0 };
  let heading: number | undefined;
  let curve: { radius: number; turn: number } | undefined;
  let positionIssue: string | undefined;
  let anchor: MetesPoint = point;
  const offset = schematic ? null : source.slice(0, source.search(bearingPattern)).match(new RegExp("(" + number + "\\s*" + unit + ")\\s+(EASTERLY|WESTERLY|NORTHERLY|SOUTHERLY)\\s+FROM\\b", "i"));
  if (offset) {
    const distance = parseDistance(offset[1])!;
    const bearing = offset[2].replace(/ERLY$/i, "");
    const angle = parseBearing(bearing)! * Math.PI / 180;
    const to = { x: Math.sin(angle) * distance, y: -Math.cos(angle) * distance };
    scene.courses.push({ bearing: offset[2], distance: offset[1], confirmed: false, issue: "Commencement offset; not a boundary course." });
    scene.items.push({ kind: "line", label: "Course 1", detail: offset[0], sequence: 1, from: point, to, bearing: offset[2], distance: offset[1], confirmed: false });
    point = to;
    anchor = to;
    scene.beginning = 1;
  }
  for (const [index, course] of courses.entries()) {
    const { clause } = course;
    const metres = course.metres !== undefined ? course.metres : course.distance ? parseDistance(course.distance) : null;
    const angle = course.angle !== undefined ? course.angle : course.kind === "bearing" ? parseBearing(course.bearing) : null;
    let issue = course.issue ?? (schematic ? scene.issue : positionIssue ? "Position depends on an earlier unconfirmed course: " + positionIssue : undefined);
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
      } else {
        issue = "Curve geometry is incomplete.";
        scene.issue ??= "Boundary needs review: a curve requires source geometry.";
      }
      positionIssue = issue;
    } else {
      if (angle === null || metres === null) {
        scene.issue ??= angle === null ? "Boundary needs review: a bearing is unreadable." : "Boundary needs review: a distance is missing or unreadable.";
        issue = angle === null ? "Bearing is unreadable." : "Distance is missing or unreadable.";
        if (metres !== null && /\b(?:PLACE|POINT)\s+OF\s+BEGINNING\b/i.test(clause)) to = anchor;
        positionIssue = issue;
      } else {
        heading = angle * Math.PI / 180;
        to = { x: point.x + Math.sin(heading) * metres, y: point.y - Math.cos(heading) * metres };
      }
    }
    if (metres === 0) issue = "Distance is zero.";
    const bearing = course.kind === "curve" ? curve ? "Curve " + (curve.turn === 1 ? "right" : "left") : "Curve" : course.bearing;
    const confirmed = issue === undefined;
    scene.courses.push({ bearing, distance: course.distance, confirmed, ...(issue ? { issue } : {}), ...(to === anchor ? { target: scene.beginning !== undefined ? scene.beginning + 1 : 1 } : {}) });
    if (to && course.distance) {
      scene.items.push({ kind: "line", label: "Course " + scene.courses.length, detail: course.detail, sequence: scene.courses.length, from: point, to, bearing, distance: course.distance, confirmed, ...(arc ? { arc } : {}) });
      point = to;
    } else {
      scene.schematic = true;
    }
    if (/\bTRUE\s+POINT\s+OF\s+BEGINNING\b/i.test(clause) && to && index < courses.length - 1) {
      scene.beginning = scene.courses.length;
      anchor = point;
    }
    if (course.kind === "bearing") {
      const turn = clause.match(/\bCURVE\s+TO\s+THE\s+(LEFT|RIGHT)\b/i);
      const radius = clause.match(new RegExp("\\bRADIUS\\s+OF\\s+(" + number + "\\s*" + unit + ")", "i"));
      const radiusMetres = radius ? parseDistance(radius[1]) : null;
      curve = turn && radiusMetres !== null && radiusMetres > 0 ? { radius: radiusMetres, turn: turn[1].toUpperCase() === "RIGHT" ? 1 : -1 } : undefined;
    }
  }
  if (schematic) {
    scene.ending = scene.courses.length;
    scene.courses.at(-1)!.target = 1;
  }
  const lines = scene.items;
  let length = 0;
  for (let end = 0; end < lines.length; end += 1) {
    length += parseDistance(lines[end].distance)!;
    if (end < 2) continue;
    const beginning = lines.slice(0, Math.min(3, end - 1)).findIndex((line, index) => {
      const edges = lines.slice(index, end + 1);
      if (!edges.every(edge => edge.confirmed)) return false;
      if (Math.hypot(lines[end].to.x - line.from.x, lines[end].to.y - line.from.y) > length * legalMapConstants.closureRatio) return false;
      const area = edges.reduce((sum, edge) => sum + (edge.from.x - line.from.x) * (edge.to.y - line.from.y) - (edge.to.x - line.from.x) * (edge.from.y - line.from.y), 0);
      const perimeter = edges.reduce((sum, edge) => sum + Math.hypot(edge.to.x - edge.from.x, edge.to.y - edge.from.y), 0);
      return Math.abs(area) > Number.EPSILON * perimeter ** 2;
    });
    if (beginning >= 0) {
      scene.beginning = lines[beginning].sequence - 1;
      scene.ending = lines[end].sequence;
      scene.closed = true;
      scene.courses[scene.ending - 1].target = scene.beginning + 1;
      for (const course of scene.courses.slice(scene.ending)) {
        course.confirmed = false;
        course.issue ??= "Course follows the closed parcel.";
      }
      for (const line of lines.slice(end + 1)) line.confirmed = false;
      if (scene.ending < scene.courses.length) scene.issue ??= "Boundary needs review: additional courses follow the closed parcel.";
      break;
    }
  }
  if (!courses.length) scene.issue = "Sorry, this parcel’s boundary couldn’t be drawn from the available details.";
  return scene;
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

function matrixCourses(group: LegalGroup): MatrixCourse[] {
  const elements = getElements(group);
  const fields = ["bearings", "distances"].map(aspect => readList(elements.filter(element => element.aspect === aspect && element.value?.trim()).map(element => element.value!), aspect === "distances")
    .map(matrixEntry)).map(field => field.some(course => course.angle !== null || course.distance !== undefined || angularStart.test(course.bearing)) ? field : []);
  const source = readSource(group);
  if (fields.every(field => field.length === 0) || source.some(course => course.kind === "curve")
    || (source.length > 0 && fields.every(field => field.every(course => !course.paired))
      && (source.length > Math.max(...fields.map(field => field.length)) || fields[0].length !== fields[1].length)
      && source.every(course => course.distance !== undefined && parseDistance(course.distance) !== null))) {
    return source.map(course => ({ ...course, angle: course.kind === "curve" ? null : parseBearing(course.bearing),
      metres: course.distance === undefined ? null : parseDistance(course.distance), paired: true, missingBearing: false, missingDistance: false }));
  }
  if (fields.every(field => field.every(course => course.angle === null && !angularStart.test(course.bearing)))) return [];
  const rows: { course: MatrixCourse; order: number }[] = [];
  const separate = fields.findIndex(field => field.length > 0 && field.every(course => course.angle !== null && course.distance === undefined));
  const used = new Set<MatrixCourse>();
  // An explicit source association can identify a gap in unequal measurement lists.
  const associations = readSource(group, new RegExp(bearingPattern.source + "|(?<![\\w'’])(?:NORTH|SOUTH|EAST|WEST)(?![\\w'’])", "gi"));
  for (const [fieldIndex, field] of fields.entries()) {
    for (const [index, course] of field.entries()) {
      if (used.has(course)) continue;
      const other = fields[1 - fieldIndex];
      let match: MatrixCourse | undefined;
      if (course.angle !== null && course.distance === undefined) {
        const verified = associations.filter(item => matrixAngle(item.bearing) === course.angle && item.distance !== undefined)
          .flatMap(item => other.filter(candidate => !used.has(candidate) && candidate.metres !== null && candidate.metres === parseDistance(item.distance!)
            && (candidate.bearing === "" || candidate.angle === course.angle)));
        if (new Set(verified).size === 1) match = verified[0];
      }
      const same = other[index];
      if (!match && same && !used.has(same)
        && (course.bearing === "" || same.bearing === "" || course.angle !== null && course.angle === same.angle)
        && (course.distance === undefined || same.distance === undefined || course.metres !== null && course.metres === same.metres)) match = same;
      if (!match && course.distance === undefined && course.angle !== null) match = other.find(candidate => !used.has(candidate) && candidate.bearing === "" && candidate.distance !== undefined);
      if (!match && course.bearing === "" && course.distance !== undefined) match = other.find(candidate => !used.has(candidate) && candidate.angle !== null && candidate.distance === undefined);
      used.add(course);
      const order = separate < 0 ? (fieldIndex === 0 ? index : fields[0].length + index)
        : fieldIndex === separate && match ? other.indexOf(match) : index;
      if (match) {
        used.add(match);
        const bearing = course.bearing === "" ? match : course;
        const distance = course.distance === undefined ? match : course;
        const association = associations.find(item => matrixAngle(item.bearing) === bearing.angle && item.distance !== undefined && parseDistance(item.distance) === distance.metres);
        rows.push({ order, course: { ...bearing, distance: distance.distance, metres: distance.metres,
          paired: bearing.paired || distance.paired || association !== undefined,
          missingBearing: bearing.bearing === "", missingDistance: distance.distance === undefined,
          detail: `${course.detail} · ${match.detail}`,
          clause: association?.clause ?? "" } });
      } else rows.push({ order, course: { ...course } });
    }
  }
  return rows.sort((left, right) => left.order - right.order).map(row => row.course);
}

export function buildMatrix(group: LegalGroup, title: string): MetesScene {
  const courses = matrixCourses(group);
  const street = courses.length === 0 ? parseStreetRelativeBoundary(group) : null;
  if (street) return drawBoundary(group, title, street, true);
  const scene = drawBoundary(group, title, courses, false);
  const offset = scene.courses.length - courses.length;
  const beginning = scene.beginning !== undefined ? scene.beginning - offset : 0;
  const ending = scene.closed ? scene.ending! - offset : courses.length;
  const resolved = solveMatrix(courses.slice(beginning, ending), legalMapConstants.closureRatio,
    scene.courses.slice(0, beginning + offset).reduce((sum, course) => sum + parseDistance(course.distance!)!, 0));
  const result = resolved.courses.every((course, index) => course === courses[beginning + index]) ? scene
    : drawBoundary(group, title, [...courses.slice(0, beginning), ...resolved.courses, ...courses.slice(ending)], false);
  if (resolved.closed) {
    result.closed = true;
    result.beginning = beginning + offset;
    result.ending = ending + offset;
    result.courses[ending + offset - 1].target = beginning + offset + 1;
    if (resolved.courses.some(course => course.issue)) {
      result.schematic = true;
      result.issue = resolved.courses.some(course => course.issue && course.paired)
        ? "Boundary includes rearranged bearing-distance pairs; affected borders are Unconfirmed."
        : "Boundary includes calculated geometry; calculated borders are Unconfirmed.";
    }
  } else if (scene.closed) {
    result.closed = false;
    result.beginning = undefined;
    result.ending = undefined;
    for (const course of result.courses) delete course.target;
  }
  if (resolved.issue) result.issue = resolved.issue;
  return result;
}
