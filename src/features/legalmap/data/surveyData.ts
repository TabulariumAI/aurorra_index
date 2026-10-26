import { formatLabel, type LegalElement, type LegalGroup, type LegalPayload } from "aurora-core";
import { displayLots, getElements, getPresentLayers, resolveGroups, toPlatJSON, type LegalMapView } from "./legalData";
import { legalMapConstants } from "../style/legalMapStyles";

type SurveyPoint = { x: number; y: number };
export type SurveyItem =
  | { kind: "rect"; role: "section" | "division" | "area"; label: string; detail: string; x: number; y: number; width: number; height: number; highlighted: boolean; partial: boolean; caption?: string }
  | { kind: "line"; label: string; detail: string; sequence: number; from: SurveyPoint; to: SurveyPoint; bearing: string; distance: string; confirmed: boolean; arc?: { center: SurveyPoint; radius: number; sweep: number; turn: number } };
export type SurveyScene = {
  title: string;
  items: SurveyItem[];
  notes: { label: string; value: string; explanation?: string }[];
  courses?: { bearing: string; distance?: string; confirmed: boolean; issue?: string; target?: number }[];
  beginning?: number;
  ending?: number;
  closed?: boolean;
  issue?: string;
  schematic?: boolean;
};

function getNotes(elements: LegalElement[]): SurveyScene["notes"] {
  return elements.map(element => ({ label: formatLabel(element.aspect), value: element.value!, explanation: element.explanation }));
}

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

export function parseDistance(source: string): number | null {
  if (!lengthPattern.test(source.trim())) return null;
  const length = [...source.matchAll(new RegExp("(" + number + ")\\s*(" + unit + ")", "gi"))]
    .reduce((sum, match) => sum + Number(match[1].replaceAll(",", "")) * units[match[2].toLowerCase().replace(/\.$/, "")], 0);
  return Number.isFinite(length) ? length : null;
}

type BoundaryCourse = { kind: "bearing" | "curve"; bearing: string; distance?: string; clause: string; detail: string };

function readCourse(value: string): BoundaryCourse {
  const bearing = [...value.matchAll(bearingPattern)][0];
  const distance = [...value.matchAll(new RegExp(distancePattern.source, "gi"))].find(match => !bearing
    || match.index! < bearing.index! || match.index! >= bearing.index! + bearing[0].length);
  return {
    kind: "bearing",
    bearing: distance ? (value.slice(0, distance.index).trim() + " " + value.slice(distance.index! + distance[0].length).trim()).trim() : value.trim(),
    distance: distance?.[0], clause: "", detail: value,
  };
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

export function parseMetesAndBounds(group: LegalGroup): BoundaryCourse[] {
  const source = group.source ?? "";
  const records = [...source.matchAll(/\([^)]*\)/g)];
  const events = [
    ...[...source.matchAll(bearingPattern)].map(match => ({ kind: "bearing" as const, match })),
    ...[...source.matchAll(/\b(?:THENCE\s+)?(?:CONTINUING\s+ALONG|ALONG)\s+(?:SAID|A)\s+CURVE\b/gi)].map(match => ({ kind: "curve" as const, match })),
  ].filter(event => !records.some(record => event.match.index! > record.index! && event.match.index! < record.index! + record[0].length))
    .sort((left, right) => left.match.index! - right.match.index!);
  const courses: BoundaryCourse[] = events.map((event, index) => {
    const end = events[index + 1]?.match.index ?? source.length;
    const clause = source.slice(event.match.index! + event.match[0].length, end);
    const distance = clause.split(/[;\n]/)[0].match(distancePattern)?.[0];
    return { kind: event.kind, bearing: event.match[0], distance, clause, detail: source.slice(event.match.index, end) };
  });
  const elements = getElements(group);
  const bearings = readList(elements.filter(element => element.aspect === "bearings" && element.value?.trim()).map(element => element.value!), false);
  const distances = readList(elements.filter(element => element.aspect === "distances" && element.value?.trim()).map(element => element.value!), true);
  const bearingCalls = bearings.map(readCourse);
  const distanceCalls = distances.map(readCourse);
  const paired = bearings.length > 0 && bearings.length === distances.length;
  const embedded = [bearingCalls, distanceCalls].filter(calls => calls.some(course => parseBearing(course.bearing) !== null && course.distance !== undefined && parseDistance(course.distance) !== null));
  const measurements = paired ? bearingCalls.map((course, index) => ({ ...course,
    bearing: parseBearing(course.bearing) === null && parseBearing(distanceCalls[index].bearing) !== null ? distanceCalls[index].bearing : course.bearing,
    distance: distanceCalls[index].distance ?? course.distance ?? distances[index],
    detail: `${bearings[index]} · ${distances[index]}`,
  })) : embedded.length === 1 ? embedded[0] : [];
  if (measurements.length > 0 && (courses.length === 0 || (courses.every(course => course.kind === "bearing")
    && measurements.every(course => parseBearing(course.bearing) !== null && course.distance !== undefined && parseDistance(course.distance) !== null)
    && courses.some(course => parseBearing(course.bearing) === null || !course.distance)))) {
    return measurements.map((course, index) => ({ ...course,
      clause: courses[index]?.kind === "bearing" && parseBearing(courses[index].bearing) === parseBearing(course.bearing)
        && courses[index].distance !== undefined && course.distance !== undefined && parseDistance(courses[index].distance!) === parseDistance(course.distance) ? courses[index].clause : "",
    }));
  }
  return courses;
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

export function buildBoundary(group: LegalGroup, title: string): SurveyScene {
  const scene: SurveyScene = { title, items: [], notes: getNotes(getElements(group).filter(element => element.value?.trim())), courses: [] };
  const parsed = parseMetesAndBounds(group);
  const courses = parsed.length ? parsed : parseStreetRelativeBoundary(group) ?? [];
  const schematic = !parsed.length && courses.length > 0;
  if (schematic) {
    scene.schematic = true;
    scene.issue = "Unconfirmed boundary: street-relative schematic requires review.";
  }
  const source = group.source ?? "";
  let point: SurveyPoint = { x: 0, y: 0 };
  let heading: number | undefined;
  let curve: { radius: number; turn: number } | undefined;
  let positionIssue: string | undefined;
  let anchor: SurveyPoint = point;
  const offset = schematic ? null : source.slice(0, source.search(bearingPattern)).match(new RegExp("(" + number + "\\s*" + unit + ")\\s+(EASTERLY|WESTERLY|NORTHERLY|SOUTHERLY)\\s+FROM\\b", "i"));
  if (offset) {
    const distance = parseDistance(offset[1])!;
    const bearing = offset[2].replace(/ERLY$/i, "");
    const angle = parseBearing(bearing)! * Math.PI / 180;
    const to = { x: Math.sin(angle) * distance, y: -Math.cos(angle) * distance };
    scene.courses!.push({ bearing: offset[2], distance: offset[1], confirmed: false, issue: "Commencement offset; not a boundary course." });
    scene.items.push({ kind: "line", label: "Course 1", detail: offset[0], sequence: 1, from: point, to, bearing: offset[2], distance: offset[1], confirmed: false });
    point = to;
    anchor = to;
    scene.beginning = 1;
  }
  for (const [index, course] of courses.entries()) {
    const { clause } = course;
    const metres = course.distance ? parseDistance(course.distance) : null;
    const angle = course.kind === "bearing" ? parseBearing(course.bearing) : null;
    let issue = schematic ? scene.issue : positionIssue ? "Position depends on an earlier unconfirmed course: " + positionIssue : undefined;
    let to: SurveyPoint | undefined;
    let arc: Extract<SurveyItem, { kind: "line" }>["arc"];
    if (course.kind === "curve") {
      if (curve && heading !== undefined && metres !== null) {
        issue = "Curve-based position requires review.";
        const sweep = metres / curve.radius;
        const center: SurveyPoint = { x: point.x + curve.turn * curve.radius * Math.cos(heading), y: point.y + curve.turn * curve.radius * Math.sin(heading) };
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
    scene.courses!.push({ bearing, distance: course.distance, confirmed, ...(issue ? { issue } : {}), ...(to === anchor ? { target: scene.beginning !== undefined ? scene.beginning + 1 : 1 } : {}) });
    if (to && course.distance) {
      scene.items.push({ kind: "line", label: "Course " + scene.courses!.length, detail: course.detail, sequence: scene.courses!.length, from: point, to, bearing, distance: course.distance, confirmed, ...(arc ? { arc } : {}) });
      point = to;
    } else {
      scene.schematic = true;
    }
    if (/\bTRUE\s+POINT\s+OF\s+BEGINNING\b/i.test(clause) && to && index < courses.length - 1) {
      scene.beginning = scene.courses!.length;
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
    scene.ending = scene.courses!.length;
    scene.courses!.at(-1)!.target = 1;
  }
  const lines = scene.items.filter(item => item.kind === "line");
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
      scene.courses![scene.ending - 1].target = scene.beginning + 1;
      for (const course of scene.courses!.slice(scene.ending)) {
        course.confirmed = false;
        course.issue ??= "Course follows the closed parcel.";
      }
      for (const line of lines.slice(end + 1)) line.confirmed = false;
      if (scene.ending < scene.courses!.length) scene.issue ??= "Boundary needs review: additional courses follow the closed parcel.";
      break;
    }
  }
  if (!courses.length) scene.issue = "Sorry, this parcel’s boundary couldn’t be drawn from the available details.";
  return scene;
}

function aliquotText(source: string): string {
  return source.toUpperCase().replace(/NORTHEAST/g, "NE").replace(/NORTHWEST/g, "NW").replace(/SOUTHEAST/g, "SE").replace(/SOUTHWEST/g, "SW")
    .replace(/NORTH/g, "N").replace(/SOUTH/g, "S").replace(/EAST/g, "E").replace(/WEST/g, "W").replace(/QUARTER/g, "1/4").replace(/HALF/g, "1/2");
}

function divideSection(parent: Extract<SurveyItem, { kind: "rect" }>, description: string, symbolic: boolean, source: string): SurveyItem[] {
  const normalized = aliquotText(description);
  const divisions = normalized.trim() ? normalized.split(/\s*(?:,|\bAND\b|&)\s*/).filter(part => part.trim()) : [""];
  const items: SurveyItem[] = [];
  for (const division of divisions) {
    const aliquots = [...division.matchAll(/\b(NE|NW|SE|SW|N|S|E|W)\s*(?:1\s*\/\s*([24])|([¼½]))/g)];
    if (!aliquots.length && !/\b(NE|NW|SE|SW|N|S|E|W)\s*\d+\s*\//.test(division) && divisions.some(part => /\b(NE|NW|SE|SW|N|S|E|W)\s*(?:1\s*\/|[¼½])/.test(part))) continue;
    const unresolved = /\b(EXCEPT|LESS|EXCLUDING|OR)\b/.test(division) || aliquots.some(aliquot => (aliquot[1].length === 2) !== ((aliquot[2] ?? (aliquot[3] === "¼" ? "4" : "2")) === "4"))
      || (!aliquots.length && /[NSWE]\s*\d+\s*\//.test(division));
    const partial = symbolic || unresolved || /\b(PARTS?|PORTIONS?|EXCEPT|LESS|EXCLUDING|OR)\b/.test(normalized);
    let area = { x: parent.x, y: parent.y, width: parent.width, height: parent.height };
    for (const aliquot of unresolved ? [] : [...aliquots].reverse()) {
      const direction = aliquot[1];
      const width = /[EW]/.test(direction) ? area.width / 2 : area.width;
      const height = /[NS]/.test(direction) ? area.height / 2 : area.height;
      area = { x: area.x + (direction.includes("E") ? area.width - width : 0), y: area.y + (direction.includes("S") ? area.height - height : 0), width, height };
      items.push({ ...area, kind: "rect", role: "division", label: "Aliquot", detail: `${aliquot[0]} of ${parent.detail}`, highlighted: false, partial: false });
    }
    items.push({ ...area, kind: "rect", role: "area", label: parent.detail, detail: source, highlighted: true, partial, caption: unresolved ? undefined : aliquots.map(aliquot => aliquot[0]).join(" of ") });
  }
  return items;
}

export function buildPlss(group: LegalGroup, title: string, summary?: string): SurveyScene {
  const elements = getElements(group).filter(element => element.value?.trim());
  const notes = getNotes(elements);
  const items: SurveyItem[] = Array.from({ length: 36 }, (_, index) => {
    const row = Math.floor(index / 6);
    const column = index % 6;
    const section = row * 6 + (row % 2 === 0 ? 6 - column : column + 1);
    return { kind: "rect", role: "section", label: String(section), detail: `Section ${section}`, x: column * 100, y: row * 100, width: 100, height: 100, highlighted: false, partial: false };
  });
  const sourceSections = elements.some(element => /\b(?:sections?|secs?\.?)\s+\d+/i.test(element.value!));
  const explicitSection = elements.find(element => element.aspect?.toLowerCase() === "section" && /^\d+$/.test(element.value!.trim()) && Number(element.value) >= 1 && Number(element.value) <= 36)?.value?.trim();
  const summarySections = [...(summary ?? "").matchAll(/\b(?:sections?|secs?\.?)\s+(\d+(?:\s*(?:,|and|&|[-–])\s*\d+)*)/gi)];
  const section = explicitSection ?? (!sourceSections && summarySections.length === 1 && /^\d+$/.test(summarySections[0][1]) && Number(summarySections[0][1]) >= 1 && Number(summarySections[0][1]) <= 36 ? summarySections[0][1] : undefined);
  if (section && !explicitSection) notes.push({ label: "Section", value: section });
  const descriptions = section ? [...elements, { aspect: "description", value: `${elements.filter(element => element.aspect === "aliquots").map(element => element.value).join("; ")} of Section ${section}` }] : elements;
  const symbolic = group.type?.trim() === "government_lot" || group.type?.trim() === "fractional_section";
  for (const element of descriptions) {
    for (const clause of element.value!.split(/[;\n]/)) {
      const sections = [...clause.matchAll(/\b(?:sections?|secs?\.?)\s+(\d+(?:\s*(?:,|and|&|[-–])\s*\d+)*)/gi)];
      for (let index = 0; index < sections.length; index += 1) {
        const match = sections[index];
        const numbers: number[] = [];
        for (const part of match[1].split(/\s*(?:,|and|&)\s*/i)) {
          const range = part.split(/\s*[-–]\s*/).map(Number);
          if (range.some(number => number < 1 || number > 36) || (range.length === 2 && range[1] < range[0])) continue;
          for (let number = range[0]; number <= (range[1] ?? range[0]); number += 1) numbers.push(number);
        }
        const prefix = clause.slice(index === 0 ? 0 : sections[index - 1].index! + sections[index - 1][0].length, match.index);
        const description = prefix.trim() || (sections.length === 1 ? clause.slice(match.index! + match[0].length) : "");
        for (const section of numbers) {
          const parent = items.find(item => item.kind === "rect" && item.role === "section" && item.label === String(section));
          if (parent?.kind === "rect") items.push(...divideSection(parent, description, symbolic, clause.trim()));
        }
      }
    }
  }
  let areas = items.filter(item => item.kind === "rect" && item.role === "area");
  if (!areas.length) {
    const aliquots = elements.filter(element => element.aspect === "aliquots").map(element => element.value).join("; ");
    if (/\b(NE|NW|SE|SW|N|S|E|W)\s*(?:1\s*\/\s*[24]|[¼½])/.test(aliquotText(aliquots)) && !sourceSections) {
      const parent: Extract<SurveyItem, { kind: "rect" }> = { kind: "rect", role: "section", label: "Section", detail: "Section", x: 0, y: 0, width: 100, height: 100, highlighted: false, partial: false };
      items.splice(0, items.length, parent, ...divideSection(parent, aliquots, symbolic, aliquots));
      areas = items.filter(item => item.kind === "rect" && item.role === "area");
    } else {
      return { title, notes, items: [], issue: "Cannot map: no section or aliquot could be resolved." };
    }
  }
  const sections = items.filter((item): item is Extract<SurveyItem, { kind: "rect" }> => item.kind === "rect" && item.role === "section" && areas.some(area => area.label === item.detail));
  const top = Math.min(...sections.map(section => section.y - section.height));
  const bottom = Math.max(...sections.map(section => section.y + section.height * 2));
  return {
    title, notes,
    items: items.filter(item => item.kind !== "rect" || item.role !== "section" || (item.y >= top && item.y + item.height <= bottom))
      .map(item => item.kind === "rect" && item.role === "section" ? { ...item, highlighted: sections.includes(item) } : item),
  };
}

export function getMapGroups(legal: LegalPayload | null | undefined): { view: LegalMapView; group: LegalGroup; scene?: SurveyScene; notes: SurveyScene["notes"]; aspects: LegalElement[]; issue?: string }[] {
  const views: Record<string, LegalMapView> = { lot_block: "Lot & block", plss: "PLSS", government_lot: "PLSS", fractional_section: "PLSS", metes_bounds: "Metes & Bounds" };
  const groups = resolveGroups(legal).filter((group): group is LegalGroup => typeof group === "object" && group !== null);
  const plssCount = groups.filter(group => views[group.type?.trim() ?? ""] === "PLSS").length;
  return groups.flatMap(group => {
    const type = group.type?.trim() ?? "";
    if (!Object.hasOwn(views, type)) return [];
    const elements = getElements(group).filter(element => element.value?.trim());
    if (elements.length === 0 && !group.source?.trim()) return [];
    const view = views[type];
    const scene = view === "PLSS" ? buildPlss(group, view, plssCount === 1 ? legal?.summary : undefined) : view === "Metes & Bounds" ? buildBoundary(group, view) : undefined;
    let aspects: LegalElement[] = [];
    let issue: string | undefined;
    if (view === "Lot & block") {
      const subdivisions = toPlatJSON([{ ...group, type }]);
      const layers = getPresentLayers(subdivisions);
      if (subdivisions.some(subdivision => subdivision.divisions.some(division => division.blocks.some(block => displayLots(block.lots).some(lot => lot.acreage))))) {
        layers.add("acreage");
      }
      aspects = elements.filter(element => element.aspect?.trim()
        && !layers.has(element.aspect.toLowerCase())
        && !["state", "county", "jurisdiction", "city"].includes(element.aspect.toLowerCase()));
      if (elements.some(element => !element.aspect?.trim())) {
        issue = "Cannot map: extracted values without aspect labels cannot be drawn.";
      } else if (layers.size === 0 && aspects.length === 0) {
        issue = "Cannot map: only location fields were provided; no drawable identifiers are available.";
      }
    }
    return [{ view, group, scene, notes: view === "Lot & block" ? getNotes(elements) : scene!.notes, aspects, issue }];
  });
}
