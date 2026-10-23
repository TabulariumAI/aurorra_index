import { formatLabel, type LegalElement, type LegalGroup, type LegalPayload } from "aurora-core";
import { getElements, resolveGroups, type LegalMapView } from "./legalData";

type SurveyPoint = { x: number; y: number };
type SurveyBase = { label: string; detail: string };
export type SurveyItem = SurveyBase & (
  | { kind: "rect"; role: "section" | "division" | "area"; x: number; y: number; width: number; height: number; highlighted: boolean; partial: boolean; caption?: string }
  | { kind: "line"; from: SurveyPoint; to: SurveyPoint; bearing: string; distance: string }
);
export type SurveyScene = {
  title: string;
  items: SurveyItem[];
  notes: { label: string; value: string; explanation?: string }[];
  issue?: string;
};

function getNotes(elements: LegalElement[]): SurveyScene["notes"] {
  return elements.map(element => ({ label: formatLabel(element.aspect), value: element.value!, explanation: element.explanation }));
}

const directions: Record<string, number> = { N: 0, NE: 45, E: 90, SE: 135, S: 180, SW: 225, W: 270, NW: 315 };

function bearingText(source: string): string {
  return source.trim().toUpperCase().replace(/['’′]{2}|[”″]/g, '"').replace(/[’′]/g, "'").replace(/[º˚]/g, "°")
    .replace(/NORTH/g, "N").replace(/SOUTH/g, "S").replace(/EAST/g, "E").replace(/WEST/g, "W")
    .replace(/,\s*(?=\d+(?:\.\d+)?\s*(?:MIN(?:UTES)?|SEC(?:ONDS)?|['"]))/g, " ")
    .replace(/DEG(?:REES)?/g, "°").replace(/MIN(?:UTES)?/g, "'").replace(/SEC(?:ONDS)?/g, '"')
    .replace(/\s*([°'"])\s*/g, "$1");
}

export function parseBearing(source: string): number | null {
  const value = bearingText(source);
  if (Object.hasOwn(directions, value)) return directions[value];
  const quadrant = value.match(/^([NS])\s*(.+?)\s*([EW])$/);
  const angle = (quadrant ? quadrant[2] : value.replace(/^AZIMUTH\s+/, "")).trim();
  const parts = angle.match(/^(\d+(?:\.\d+)?)\s*°?\s*(?:(\d+(?:\.\d+)?)\s*'\s*)?(?:(\d+(?:\.\d+)?)\s*"\s*)?$/)
    ?? angle.match(/^(\d+(?:\.\d+)?)(?:\s+(\d+)(?:\s+(\d+(?:\.\d+)?))?)?$/);
  if (!parts) return null;
  const degrees = Number(parts[1]);
  const minutes = parts[2] === undefined ? 0 : Number(parts[2]);
  const seconds = parts[3] === undefined ? 0 : Number(parts[3]);
  const total = degrees + minutes / 60 + seconds / 3600;
  if (minutes >= 60 || seconds >= 60 || total > (quadrant ? 90 : 360)) return null;
  if (!quadrant) return total;
  return quadrant[1] === "N" ? (quadrant[3] === "E" ? total : (360 - total) % 360)
    : quadrant[3] === "E" ? 180 - total : 180 + total;
}

const distanceUnits: Record<string, number> = {
  m: 1, meter: 1, meters: 1, metre: 1, metres: 1,
  ft: 0.3048, foot: 0.3048, feet: 0.3048, "'": 0.3048,
  in: 0.0254, inch: 0.0254, inches: 0.0254, '"': 0.0254,
  yd: 0.9144, yard: 0.9144, yards: 0.9144,
  ch: 20.1168, chain: 20.1168, chains: 20.1168,
  rod: 5.0292, rods: 5.0292, link: 0.201168, links: 0.201168,
  mi: 1609.344, mile: 1609.344, miles: 1609.344,
};

export function parseDistance(source: string): { length: number; specified: boolean } | null {
  const match = source.trim().match(/^(\d+(?:,\d{3})*(?:\.\d+)?|\.\d+)\s*([a-z]+\.?|['"])?$/i);
  if (!match) return null;
  const length = Number(match[1].replaceAll(",", ""));
  if (!Number.isFinite(length)) return null;
  if (!match[2]) return { length, specified: false };
  const unit = match[2].toLowerCase().replace(/\.$/, "");
  if (!Object.hasOwn(distanceUnits, unit)) return null;
  const converted = length * distanceUnits[unit];
  return Number.isFinite(converted) ? { length: converted, specified: true } : null;
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
      const text = distances ? value.replace(/(\d),(?=\d{3}(?:\D|$))/g, "$1") : value;
      entries.push(...text.split(distances ? /\s*(?:[,;\n|]|\band\b)\s*/i
        : /\s*(?:,(?!\s*\d+(?:\.\d+)?\s*(?:MIN(?:UTES)?|SEC(?:ONDS)?|['"′″]))|[;\n|]|\band\b)\s*/i));
    }
  }
  return entries;
}

export function buildBoundary(group: LegalGroup, title: string): SurveyScene {
  const elements = getElements(group).filter(element => element.value?.trim());
  const notes = getNotes(elements);
  const bearings = readList(elements.filter(element => element.aspect === "bearings").map(element => element.value!), false);
  const distances = readList(elements.filter(element => element.aspect === "distances").map(element => element.value!), true);
  const angles = bearings.map(parseBearing);
  const lengths = distances.map(parseDistance);
  let issue: string | undefined;
  if (!bearings.length && !distances.length) issue = "Cannot map: no bearing and distance pairs were provided.";
  else if (bearings.length !== distances.length) issue = `Cannot map: ${bearings.length} bearing${bearings.length === 1 ? "" : "s"} and ${distances.length} distance${distances.length === 1 ? "" : "s"} cannot be paired.`;
  else if (angles.includes(null)) {
    const index = angles.indexOf(null);
    issue = `Cannot map: bearing ${index + 1} could not be read ("${bearings[index]}").`;
  } else if (lengths.includes(null)) {
    const index = lengths.indexOf(null);
    issue = `Cannot map: distance ${index + 1} could not be read ("${distances[index]}").`;
  } else if (lengths.some(length => length!.specified) && lengths.some(length => !length!.specified)) issue = "Cannot map: some distances have units and others do not.";
  if (issue) return { title, items: [], notes, issue };
  const items: SurveyItem[] = [];
  const scale = lengths.reduce((maximum, length) => Math.max(maximum, length!.length), 0);
  let from: SurveyPoint = { x: 0, y: 0 };
  for (let index = 0; index < bearings.length; index += 1) {
    const radians = angles[index]! * Math.PI / 180;
    const length = scale > 0 ? lengths[index]!.length / scale : 0;
    const to = { x: from.x + Math.sin(radians) * length, y: from.y - Math.cos(radians) * length };
    items.push({ kind: "line", from, to, bearing: bearingText(bearings[index]), distance: distances[index].trim(), label: `Course ${index + 1}`, detail: `${bearings[index]} · ${distances[index]}` });
    from = to;
  }
  return { title, items, notes };
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
    const partial = symbolic || unresolved || /\b(PART|PORTION|EXCEPT|LESS|EXCLUDING|OR)\b/.test(normalized);
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
  const summarySections = [...(summary ?? "").matchAll(/\b(?:sections?|secs?\.?)\s+(\d+(?:\s*(?:,|and|&|[-–])\s*\d+)*)/gi)];
  const section = !sourceSections && summarySections.length === 1 && /^\d+$/.test(summarySections[0][1]) && Number(summarySections[0][1]) >= 1 && Number(summarySections[0][1]) <= 36 ? summarySections[0][1] : undefined;
  if (section) notes.push({ label: "Section", value: section });
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

export function getMapGroups(legal: LegalPayload | null | undefined): { view: LegalMapView; group: LegalGroup; scene?: SurveyScene; notes: SurveyScene["notes"] }[] {
  const views: Record<string, LegalMapView> = { lot_block: "Lot & block", plss: "PLSS", government_lot: "PLSS", fractional_section: "PLSS", metes_bounds: "Metes & Bounds" };
  const groups = resolveGroups(legal).filter((group): group is LegalGroup => typeof group === "object" && group !== null);
  const plssCount = groups.filter(group => views[group.type?.trim() ?? ""] === "PLSS").length;
  return groups.flatMap(group => {
    const type = group.type?.trim() ?? "";
    if (!Object.hasOwn(views, type)) return [];
    const elements = getElements(group).filter(element => element.value?.trim());
    if (elements.length === 0) return [];
    const view = views[type];
    const scene = view === "PLSS" ? buildPlss(group, view, plssCount === 1 ? legal?.summary : undefined) : view === "Metes & Bounds" ? buildBoundary(group, view) : undefined;
    return [{ view, group, scene, notes: view === "Lot & block" ? getNotes(elements) : scene!.notes }];
  });
}
