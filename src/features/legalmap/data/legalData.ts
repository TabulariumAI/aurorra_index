import type { LegalElement, LegalGroup, LegalPayload } from "aurora-core";

export type LegalMapPayload = LegalPayload & { parcels_num?: number };

const stateAbbr: Record<string, string> = {
  AL: "Alabama",
  AK: "Alaska",
  AZ: "Arizona",
  AR: "Arkansas",
  CA: "California",
  CO: "Colorado",
  CT: "Connecticut",
  DE: "Delaware",
  FL: "Florida",
  GA: "Georgia",
  HI: "Hawaii",
  ID: "Idaho",
  IL: "Illinois",
  IN: "Indiana",
  IA: "Iowa",
  KS: "Kansas",
  KY: "Kentucky",
  LA: "Louisiana",
  ME: "Maine",
  MD: "Maryland",
  MA: "Massachusetts",
  MI: "Michigan",
  MN: "Minnesota",
  MS: "Mississippi",
  MO: "Missouri",
  MT: "Montana",
  NE: "Nebraska",
  NV: "Nevada",
  NH: "New Hampshire",
  NJ: "New Jersey",
  NM: "New Mexico",
  NY: "New York",
  NC: "North Carolina",
  ND: "North Dakota",
  OH: "Ohio",
  OK: "Oklahoma",
  OR: "Oregon",
  PA: "Pennsylvania",
  RI: "Rhode Island",
  SC: "South Carolina",
  SD: "South Dakota",
  TN: "Tennessee",
  TX: "Texas",
  UT: "Utah",
  VT: "Vermont",
  VA: "Virginia",
  WA: "Washington",
  WV: "West Virginia",
  WI: "Wisconsin",
  WY: "Wyoming",
  DC: "District of Columbia",
};

export const divisionKinds = ["unit", "phase", "section"] as const;
const stateNames = Object.values(stateAbbr);
const stateNameRegex = new RegExp(`\\b(${stateNames.map((value) => value.replace(/ /g, "\\s+")).join("|")})\\b`, "i");

export type PlatLot = {
  name: string;
};

export type DisplayLot = { name: string; filled: boolean; detail?: string };

function numericLots(value: string): number[] | null {
  const cleaned = value.replace(/(^|,|&|\band\b)\s*lots?\b\s*(?:no\.?\s*)?/gi, "$1").trim().replace(/,\s*(?=&|\band\b)/gi, "");
  if (!/^\d+(?:\s*[-–]\s*\d+)?(?:\s*(?:,|&|\band\b)\s*\d+(?:\s*[-–]\s*\d+)?)*$/i.test(cleaned)) return null;
  const numbers = new Set<number>();
  for (const part of cleaned.split(/\s*(?:,|&|\band\b)\s*/i)) {
    const [start, end = start] = part.split(/\s*[-–]\s*/).map(Number);
    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || end < start || end - start > 10000) return null;
    for (let number = start; number <= end; number += 1) numbers.add(number);
  }
  return [...numbers];
}

export function displayLots(lots: PlatLot[]): DisplayLot[] {
  const numeric = new Set<number>();
  const other: DisplayLot[] = [];
  for (const lot of lots) {
    const parsed = numericLots(lot.name);
    if (parsed) parsed.forEach(number => numeric.add(number));
    else other.push({ name: lot.name, filled: true });
  }
  if (!numeric.size) return other.length <= 12 ? other : [
    { name: `${other.length} lots`, filled: true, detail: other.map(lot => lot.name).join(", ") },
  ];
  const ordered = [...numeric].sort((a, b) => a - b);
  const first = ordered[0];
  const last = ordered[ordered.length - 1];
  const rangeLabel = (start: number, end: number) => start === end ? String(start) : `${start}–${end}`;
  let numericDisplay: DisplayLot[] = [];
  if (last - first + 1 <= 12 - other.length) {
    for (let number = first; number <= last; number += 1) numericDisplay.push({ name: String(number), filled: numeric.has(number) });
  } else {
    let runStart = first;
    let previous = first;
    for (const number of ordered.slice(1)) {
      if (number === previous + 1) { previous = number; continue; }
      numericDisplay.push({ name: rangeLabel(runStart, previous), filled: true });
      numericDisplay.push({ name: rangeLabel(previous + 1, number - 1), filled: false });
      runStart = previous = number;
    }
    numericDisplay.push({ name: rangeLabel(runStart, previous), filled: true });
    const capacity = 12 - other.length;
    while (numericDisplay.length < capacity) {
      let longestIndex = -1;
      let longestLength = 1;
      numericDisplay.forEach((entry, index) => {
        if (!entry.filled) return;
        const [start, end = start] = entry.name.split("–").map(Number);
        if (end - start + 1 > longestLength) { longestIndex = index; longestLength = end - start + 1; }
      });
      if (longestIndex < 0) break;
      const [start, end] = numericDisplay[longestIndex].name.split("–").map(Number);
      const midpoint = Math.floor((start + end) / 2);
      numericDisplay.splice(longestIndex, 1,
        { name: rangeLabel(start, midpoint), filled: true },
        { name: rangeLabel(midpoint + 1, end), filled: true });
    }
    if (numericDisplay.length > 12 - other.length) {
      const available = Math.max(1, 12 - other.length);
      const span = last - first + 1;
      numericDisplay = Array.from({ length: available }, (_, index) => {
        const start = first + Math.floor(span * index / available);
        const end = first + Math.floor(span * (index + 1) / available) - 1;
        const count = ordered.filter(number => number >= start && number <= end).length;
        return { name: rangeLabel(start, end), filled: count > 0, detail: `${count} filled, ${end - start + 1 - count} empty` };
      });
    }
  }
  if (other.length + numericDisplay.length > 12) {
    return [{ name: `${lots.length} lots`, filled: true, detail: lots.map(lot => lot.name).join(", ") }];
  }
  return [...numericDisplay, ...other];
}

export type PlatBlock = {
  lots: PlatLot[];
  name: string;
};

export type PlatDivision = {
  unit: string;
  phase: string;
  section: string;
  blocks: PlatBlock[];
};

export type PlatSubdivision = {
  state: string;
  county: string;
  subdivision: string;
  rightsOfWay: string[];
  divisions: PlatDivision[];
};

export type LegalLocation = {
  city?: string;
  county?: string;
  state?: string;
};

export type LegalViewModel = {
  isEmptyStructure: boolean;
  location: LegalLocation;
  locationLabel: string;
  matchPlatSubdivision: boolean;
  platName?: string;
  presentLayers: Set<string>;
  subdivisions: PlatSubdivision[];
  summary?: string;
};

type NodeRecord = Record<string, unknown>;

function isRecord(value: unknown): value is NodeRecord {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

export function isBlank(value: unknown): boolean {
  return !value || (typeof value === "string" && value.trim().length === 0);
}

function titleCase(value: unknown): string {
  return String(value || "")
    .toLowerCase()
    .split(/\s+/)
    .map((word) => (word ? word[0].toUpperCase() + word.slice(1) : word))
    .join(" ");
}

function cleanPlace(value: unknown): string {
  return titleCase(String(value || "").replace(/\s+/g, " ").replace(/[.;:]$/g, "").trim());
}

function normalizeState(value: unknown): string | undefined {
  const raw = String(value || "").trim();
  if (!raw) return undefined;
  const abbr = stateAbbr[raw.toUpperCase()];
  if (abbr) return abbr;
  return stateNames.find((name) => name.toLowerCase() === raw.toLowerCase());
}

function normName(value: unknown): string {
  return String(value || "").replace(/\s+/g, " ").trim().toLowerCase();
}

const blockCollator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });

function compareBlocks(left: PlatBlock, right: PlatBlock): number {
  const name = (block: PlatBlock) => block.name.replace(/^\s*block\b\s*(?:no\.?\s*)?/i, "").trim();
  const leftName = name(left);
  const rightName = name(right);
  if (!leftName) return rightName ? 1 : 0;
  if (!rightName) return -1;
  return blockCollator.compare(leftName, rightName);
}

export function getElements(node: unknown): LegalElement[] {
  if (!node || typeof node !== "object") return [];
  if (Array.isArray(node)) return node as LegalElement[];
  const record = node as {
    Elements?: LegalElement[];
    LegalElements?: LegalElement[];
    elements?: LegalElement[];
    legalElements?: LegalElement[];
  };
  if (Array.isArray(record.elements)) return record.elements;
  if (Array.isArray(record.Elements)) return record.Elements;
  if (Array.isArray(record.legalElements)) return record.legalElements;
  if (Array.isArray(record.LegalElements)) return record.LegalElements;
  return [];
}

export function getVal(elements: LegalElement[], aspect: string): string {
  const key = String(aspect || "").toLowerCase();
  const match = elements.find((element) => typeof element.aspect === "string" && element.aspect.toLowerCase() === key);
  return match?.value || "";
}

function collectLotBlockEntries(input: unknown): LegalGroup[] {
  const out: LegalGroup[] = [];
  const visit = (node: unknown) => {
    if (!node) return;
    if (Array.isArray(node)) {
      node.forEach(visit);
      return;
    }
    if (!isRecord(node)) return;
    const type = String(node.type || node.Type || node.groupType || node.GroupType || "").toLowerCase();
    if (type === "lot_block" && getElements(node).length > 0) {
      out.push(node as LegalGroup);
    }
    for (const key of Object.keys(node)) {
      visit(node[key]);
    }
  };
  visit(input);
  return out;
}

function mergeLotBlocks(groups: LegalGroup[], count: number): LegalGroup[] {
  if (groups.length <= count) return groups;
  const entries = groups.map(group => {
    const values = new Map<string, string[]>();
    for (const element of getElements(group)) {
      const aspect = normName(element.aspect);
      const value = element.value?.trim();
      if (!aspect || !value) continue;
      const existing = values.get(aspect) || [];
      if (!existing.some(entry => normName(entry) === normName(value))) existing.push(value);
      values.set(aspect, existing);
    }
    return values;
  });

  while (entries.length > count) {
    let left = 0;
    let right = 1;
    let weight = -1;
    for (let i = 0; i < entries.length - 1; i += 1) {
      for (let j = i + 1; j < entries.length; j += 1) {
        let score = 0;
        for (const [aspect, values] of entries[i]) {
          for (const value of values) {
            if (entries[j].get(aspect)?.some(entry => normName(entry) === normName(value))) score += 1;
          }
        }
        if (score > weight) {
          left = i;
          right = j;
          weight = score;
        }
      }
    }
    for (const [aspect, values] of entries[right]) {
      const existing = entries[left].get(aspect) || [];
      for (const value of values) {
        if (!existing.some(entry => normName(entry) === normName(value))) existing.push(value);
      }
      entries[left].set(aspect, existing);
    }
    entries.splice(right, 1);
  }

  return entries.map(values => ({
    type: "lot_block",
    elements: [...values].flatMap(([aspect, names]) => {
      const labels = aspect === "right_of_way" ? names : [names.join(aspect === "block" ? "/" : ",")];
      return labels.map(value => ({ aspect, value }));
    }),
  }));
}

export function toPlatJSON(legalJSON: unknown): PlatSubdivision[] {
  const groups = resolveGroups(legalJSON);
  const entries = collectLotBlockEntries(groups.length ? groups : legalJSON);
  const count = isRecord(legalJSON) && typeof legalJSON.parcels_num === "number" && legalJSON.parcels_num > 0 ? legalJSON.parcels_num : entries.length;
  const subdivisions = new Map<string, Omit<PlatSubdivision, "divisions"> & {
    divisions: Map<string, Omit<PlatDivision, "blocks"> & { blocks: Map<string, PlatBlock> }>;
  }>();

  for (const legal of mergeLotBlocks(entries, count)) {
    const elements = getElements(legal);
    const state = getVal(elements, "state").trim();
    const county = getVal(elements, "county").trim();
    const subdivision = getVal(elements, "subdivision").trim();
    const unit = getVal(elements, "unit").trim();
    const phase = getVal(elements, "phase").trim();
    const section = getVal(elements, "section").trim();
    const block = getVal(elements, "block").trim();
    const lot = getVal(elements, "lot").trim();
    const rightsOfWay = elements.filter(element => element.aspect?.toLowerCase() === "right_of_way")
      .map(element => element.value?.trim()).filter((value): value is string => Boolean(value));
    if (![subdivision, unit, phase, section, block, lot, ...rightsOfWay].some(Boolean)) continue;

    const subdivisionKey = JSON.stringify([state, county, subdivision].map(normName));
    let subNode = subdivisions.get(subdivisionKey);
    if (!subNode) {
      subNode = { state, county, subdivision, rightsOfWay: [], divisions: new Map() };
      subdivisions.set(subdivisionKey, subNode);
    }
    for (const rightOfWay of rightsOfWay) {
      if (!subNode.rightsOfWay.some(value => normName(value) === normName(rightOfWay))) subNode.rightsOfWay.push(rightOfWay);
    }

    const divisionKey = JSON.stringify([unit, phase, section].map(normName));
    let division = subNode.divisions.get(divisionKey);
    if (!division) {
      division = { unit, phase, section, blocks: new Map() };
      subNode.divisions.set(divisionKey, division);
    }

    if (!block && !lot) continue;
    const blockKey = normName(block);
    let blockNode = division.blocks.get(blockKey);
    if (!blockNode) {
      blockNode = { name: block, lots: [] };
      division.blocks.set(blockKey, blockNode);
    }
    if (lot && !blockNode.lots.some(entry => normName(entry.name) === normName(lot))) {
      blockNode.lots.push({ name: lot });
    }
  }

  return Array.from(subdivisions.values(), ({ divisions, ...subdivision }) => ({
    ...subdivision,
    divisions: Array.from(divisions.values(), ({ blocks, ...division }) => ({
      ...division,
      blocks: Array.from(blocks.values()).sort(compareBlocks),
    })),
  }));
}

export function getPresentLayers(subdivisions: PlatSubdivision[]): Set<string> {
  const present = new Set<string>();
  for (const sub of subdivisions) {
    if (!isBlank(sub.subdivision)) present.add("subdivision");
    if (sub.rightsOfWay.length > 0) present.add("right_of_way");
    for (const division of sub.divisions) {
      for (const kind of divisionKinds) {
        if (!isBlank(division[kind])) present.add(kind);
      }
      for (const block of division.blocks) {
        if (!isBlank(block.name)) present.add("block");
        if (block.lots.some(lot => !isBlank(lot.name))) present.add("lot");
      }
    }
  }
  return present;
}

export function isAllEmptyStructure(subdivisions: PlatSubdivision[]): boolean {
  return getPresentLayers(subdivisions).size === 0;
}

export function formatLocation(location: LegalLocation): string {
  const parts: string[] = [];
  if (location.city) parts.push(cleanPlace(location.city));
  if (location.county) parts.push(`${cleanPlace(location.county)} County`);
  if (location.state) parts.push(normalizeState(location.state) || "");
  return parts.filter(Boolean).join(" | ");
}

function extractPlatName(subdivisions: PlatSubdivision[]): string | undefined {
  const match = subdivisions.find((subdivision) => !isBlank(subdivision.subdivision));
  return match ? cleanPlace(match.subdivision) : undefined;
}

function extractCityCountyState(legalJSON: unknown): LegalLocation {
  const out: LegalLocation = {};

  if (isRecord(legalJSON)) {
    const plat = isRecord(legalJSON.plat) ? legalJSON.plat : isRecord(legalJSON.location) ? legalJSON.location : null;
    if (plat) {
      if (typeof plat.city === "string" && plat.city.trim()) out.city = cleanPlace(plat.city);
      if (typeof plat.county === "string" && plat.county.trim()) out.county = cleanPlace(plat.county.replace(/\bCounty\b/i, "").trim());
      if (typeof plat.state === "string" && plat.state.trim()) out.state = normalizeState(plat.state);
    }
  }

  const entries = Array.isArray(legalJSON) ? legalJSON : legalJSON ? [legalJSON] : [];
  for (const entry of entries) {
    for (const element of getElements(entry)) {
      const aspect = String(element.aspect || "").toLowerCase();
      const value = typeof element.value === "string" ? element.value.trim() : "";
      if (!value) continue;
      if (!out.city && (aspect === "city" || aspect === "municipality" || aspect === "locality")) out.city = cleanPlace(value);
      if (!out.county && (aspect === "county" || aspect === "parish" || aspect === "borough")) out.county = cleanPlace(value.replace(/\bCounty\b/i, "").trim());
      if (!out.state && (aspect === "state" || aspect === "province")) out.state = normalizeState(value);
    }
    if (out.city && out.county && out.state) break;
  }

  if (out.city && out.county && out.state) return out;

  const texts: string[] = [];
  const pushText = (value: unknown) => {
    if (typeof value === "string" && value.trim()) texts.push(value);
  };

  if (isRecord(legalJSON)) {
    pushText(legalJSON.text);
    pushText(legalJSON.header);
    pushText(legalJSON.summary);
    pushText(legalJSON.location_text);
  }

  if (Array.isArray(legalJSON)) {
    for (const entry of legalJSON) {
      if (!isRecord(entry)) continue;
      pushText(entry.text);
      pushText(entry.header);
      pushText(entry.summary);
    }
  }

  const hay = texts.join(" | ");
  if (!hay) return out;

  if (!out.county) {
    const county = hay.match(/\b([A-Z][A-Za-z' .-]+)\s+County\b/i);
    if (county) out.county = cleanPlace(county[1]);
  }
  if (!out.state) {
    const state = hay.match(/\bCounty,\s*([A-Z]{2}|[A-Z][a-zA-Z' .-]+)\b/) || hay.match(stateNameRegex) || hay.match(/\b([A-Z]{2})\b/);
    out.state = normalizeState(state?.[1] || "");
  }
  if (!out.city) {
    const city = hay.match(/\bCity of\s+([A-Z][A-Za-z' .-]+)\b/i);
    if (city) out.city = cleanPlace(city[1]);
  }

  return out;
}

function resolveGroups(legalJSON: unknown): unknown[] {
  if (Array.isArray(legalJSON)) return legalJSON;
  if (!isRecord(legalJSON)) return [];
  return [legalJSON.LegalGroups, legalJSON.legalGroups, legalJSON.groups, legalJSON.items].find(Array.isArray) || [];
}

function allSubsMatchPlat(subdivisions: PlatSubdivision[], platName?: string): boolean {
  if (!platName) return false;
  const plat = normName(platName);
  let found = false;
  for (const sub of subdivisions) {
    if (isBlank(sub.subdivision)) continue;
    found = true;
    if (normName(sub.subdivision) !== plat) return false;
  }
  return found;
}

export function normalizeLegalData(legalJSON: LegalMapPayload | LegalGroup[] | null | undefined): LegalViewModel {
  const subdivisions = toPlatJSON(legalJSON);
  const location = extractCityCountyState(legalJSON);
  const platName = extractPlatName(subdivisions);
  const presentLayers = getPresentLayers(subdivisions);

  return {
    subdivisions,
    location,
    platName,
    presentLayers,
    matchPlatSubdivision: allSubsMatchPlat(subdivisions, platName),
    isEmptyStructure: isAllEmptyStructure(subdivisions),
    locationLabel: formatLocation(location),
    summary: isRecord(legalJSON) && typeof legalJSON.summary === "string" ? legalJSON.summary.trim() : undefined,
  };
}
