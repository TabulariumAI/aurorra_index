import type { LegalElement, LegalGroup, LegalPayload } from "aurora-core";

export type LegalMapPayload = LegalPayload;

export function labelValue(value: string, kind: string): string {
  return value.replace(new RegExp(`(^|[,/])\\s*(?:${kind})\\b\\s*(?:no\\.?\\s*)?`, "gi"), "$1").trim();
}

export const legalMapViews = ["Lot & block", "Address", "Metes & Bounds", "PLSS"] as const;
export type LegalMapView = typeof legalMapViews[number];

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

export const subdivisionKinds = ["subdivision", "condominium"] as const;
export const divisionKinds = ["phase", "unit", "section"] as const;
export const blockKinds = ["block", "tract", "building"] as const;
export const lotKinds = ["lot", "condominium_unit"] as const;
export const lotLabels = { lot: "Lot", condominium_unit: "Condo Unit" } as const;
const stateNames = Object.values(stateAbbr);
const stateNameRegex = new RegExp(`\\b(${stateNames.map((value) => value.replace(/ /g, "\\s+")).join("|")})\\b`, "i");

export type PlatLot = {
  kind: typeof lotKinds[number];
  name: string;
  acreage?: string[];
};

export type DisplayLot = PlatLot & { filled: boolean; detail?: string };

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
  const numericAcreage = new Map<number, string[]>();
  const other: DisplayLot[] = [];
  for (const lot of lots) {
    const parsed = lot.kind === "lot" ? numericLots(lot.name) : null;
    if (parsed) {
      parsed.forEach(number => numeric.add(number));
      if (parsed.length === 1 && lot.acreage) {
        numericAcreage.set(parsed[0], [...(numericAcreage.get(parsed[0]) ?? []), ...lot.acreage]);
      }
    } else other.push({ ...lot, filled: true });
  }
  if (!numeric.size) return other.length <= 12 ? other : lotSummaries(lots);
  const ordered = [...numeric].sort((a, b) => a - b);
  const first = ordered[0];
  const last = ordered[ordered.length - 1];
  const rangeLabel = (start: number, end: number) => start === end ? String(start) : `${start}–${end}`;
  let numericDisplay: DisplayLot[] = [];
  if (last - first + 1 <= 12 - other.length) {
    for (let number = first; number <= last; number += 1) numericDisplay.push({ kind: "lot", name: String(number), filled: numeric.has(number) });
  } else {
    let runStart = first;
    let previous = first;
    for (const number of ordered.slice(1)) {
      if (number === previous + 1) { previous = number; continue; }
      numericDisplay.push({ kind: "lot", name: rangeLabel(runStart, previous), filled: true });
      numericDisplay.push({ kind: "lot", name: rangeLabel(previous + 1, number - 1), filled: false });
      runStart = previous = number;
    }
    numericDisplay.push({ kind: "lot", name: rangeLabel(runStart, previous), filled: true });
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
        { kind: "lot", name: rangeLabel(start, midpoint), filled: true },
        { kind: "lot", name: rangeLabel(midpoint + 1, end), filled: true });
    }
    if (numericDisplay.length > 12 - other.length) {
      const available = Math.max(1, 12 - other.length);
      const span = last - first + 1;
      numericDisplay = Array.from({ length: available }, (_, index) => {
        const start = first + Math.floor(span * index / available);
        const end = first + Math.floor(span * (index + 1) / available) - 1;
        const count = ordered.filter(number => number >= start && number <= end).length;
        return { kind: "lot", name: rangeLabel(start, end), filled: count > 0, detail: `${count} filled, ${end - start + 1 - count} empty` };
      });
    }
  }
  if (other.length + numericDisplay.length > 12) {
    return lotSummaries(lots);
  }
  for (const lot of numericDisplay) {
    if (!lot.filled) continue;
    const [start, end = start] = lot.name.split("–").map(Number);
    const acreage = [...numericAcreage].filter(([number]) => number >= start && number <= end).flatMap(([, values]) => values);
    if (acreage.length > 0) lot.acreage = acreage;
  }
  return [...numericDisplay, ...other];
}

function lotSummaries(lots: PlatLot[]): DisplayLot[] {
  return lotKinds.flatMap(kind => {
    const entries = lots.filter(lot => lot.kind === kind);
    if (entries.length === 0) return [];
    if (entries.length === 1) return [{ ...entries[0], filled: true }];
    const acreage = entries.flatMap(lot => lot.acreage ?? []);
    return [{
      kind, name: `${entries.length} ${lotLabels[kind].toLowerCase()}s`, filled: true, detail: entries.map(lot => lot.name).join(", "),
      ...(acreage.length > 0 ? { acreage } : {}),
    }];
  });
}

export type PlatBlock = {
  lots: PlatLot[];
  name: string;
  tract?: string;
  building?: string;
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
  condominium?: string;
  jurisdiction?: string;
  city?: string;
  rightsOfWay: string[];
  divisions: PlatDivision[];
};

export type LegalLocation = {
  city?: string;
  county?: string;
  state?: string;
  jurisdiction?: string;
};

export type LegalViewModel = {
  isEmptyStructure: boolean;
  location: LegalLocation;
  locationLabel: string;
  matchPlatSubdivision: boolean;
  platName?: string;
  presentLayers: Set<string>;
  references: LegalElement[];
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
  const name = (block: PlatBlock) => (block.name || block.tract || block.building || "").replace(/^\s*(?:block|tract|building)\b\s*(?:no\.?\s*)?/i, "").trim();
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

export function mergeLotBlocks(groups: LegalGroup[], count: number): { group: LegalGroup; sources: LegalGroup[] }[] {
  if (groups.length <= count) return groups.map(group => ({ group, sources: [group] }));
  const sources = groups.map(group => [group]);
  const entries = groups.map(group => {
    const values = new Map<string, string[]>();
    for (const element of getElements(group)) {
      const aspect = normName(element.aspect);
      const value = aspect === "acreage" ? element.value : element.value?.trim();
      if (!aspect || !value?.trim()) continue;
      const existing = values.get(aspect) || [];
      if (aspect === "acreage" || !existing.some(entry => normName(entry) === normName(value))) existing.push(value);
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
          for (const value of new Set(values.map(normName))) {
            if (entries[j].get(aspect)?.some(entry => normName(entry) === value)) score += 1;
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
        if (aspect === "acreage" || !existing.some(entry => normName(entry) === normName(value))) existing.push(value);
      }
      entries[left].set(aspect, existing);
    }
    sources[left].push(...sources[right]);
    sources.splice(right, 1);
    entries.splice(right, 1);
  }

  return entries.map((values, index) => ({
    sources: sources[index],
    group: {
      type: "lot_block",
      elements: [...values].flatMap(([aspect, names]) => {
        const labels = aspect === "right_of_way" || aspect === "acreage" ? names : [names.join(blockKinds.some(kind => kind === aspect) ? "/" : ",")];
        return labels.map(value => ({ aspect, value }));
      }),
    },
  }));
}

export function toPlatJSON(legalJSON: unknown): PlatSubdivision[] {
  const groups = resolveGroups(legalJSON);
  const entries = collectLotBlockEntries(groups.length ? groups : legalJSON);
  const count = isRecord(legalJSON) && typeof legalJSON.parcels_num === "number" && legalJSON.parcels_num > 0 ? legalJSON.parcels_num : entries.length;
  const subdivisions = new Map<string, Omit<PlatSubdivision, "divisions"> & {
    divisions: Map<string, Omit<PlatDivision, "blocks"> & { blocks: Map<string, PlatBlock> }>;
  }>();

  for (const { group: legal } of mergeLotBlocks(entries, count)) {
    const elements = getElements(legal);
    const state = getVal(elements, "state").trim();
    const county = getVal(elements, "county").trim();
    const jurisdiction = getVal(elements, "jurisdiction").trim();
    const city = getVal(elements, "city").trim();
    const subdivision = getVal(elements, "subdivision").trim();
    const condominium = getVal(elements, "condominium").trim();
    const unit = getVal(elements, "unit").trim();
    const phase = getVal(elements, "phase").trim();
    const section = getVal(elements, "section").trim();
    const block = getVal(elements, "block").trim();
    const tract = getVal(elements, "tract").trim();
    const building = getVal(elements, "building").trim();
    const lots = lotKinds.flatMap(kind => {
      const name = getVal(elements, kind).trim();
      return name ? [{ kind, name }] : [];
    });
    const rightsOfWay = elements.filter(element => element.aspect?.toLowerCase() === "right_of_way")
      .map(element => element.value?.trim()).filter((value): value is string => Boolean(value));
    if (![subdivision, condominium, unit, phase, section, block, tract, building, ...lots, ...rightsOfWay].some(Boolean)) continue;

    const subdivisionKey = JSON.stringify([state, county, jurisdiction, city, subdivision, condominium].map(normName));
    let subNode = subdivisions.get(subdivisionKey);
    if (!subNode) {
      subNode = { state, county, subdivision, ...(condominium ? { condominium } : {}), ...(jurisdiction ? { jurisdiction } : {}), ...(city ? { city } : {}), rightsOfWay: [], divisions: new Map() };
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

    if (!block && !tract && !building && lots.length === 0) continue;
    const blockKey = JSON.stringify([block, tract, building].map(normName));
    let blockNode = division.blocks.get(blockKey);
    if (!blockNode) {
      blockNode = { name: block, ...(tract ? { tract } : {}), ...(building ? { building } : {}), lots: [] };
      division.blocks.set(blockKey, blockNode);
    }
    for (const lot of lots) {
      let lotNode = blockNode.lots.find(entry => entry.kind === lot.kind && normName(entry.name) === normName(lot.name));
      if (!lotNode) {
        lotNode = lot;
        blockNode.lots.push(lotNode);
      }
      const acreage = lot.kind === "lot" ? elements.filter(element => element.aspect?.toLowerCase() === "acreage" && element.value?.trim()).map(element => element.value!) : [];
      if (acreage.length > 0) (lotNode.acreage ??= []).push(...acreage);
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
    for (const kind of subdivisionKinds) if (!isBlank(sub[kind])) present.add(kind);
    if (sub.rightsOfWay.length > 0) present.add("right_of_way");
    for (const division of sub.divisions) {
      for (const kind of divisionKinds) {
        if (!isBlank(division[kind])) present.add(kind);
      }
      for (const block of division.blocks) {
        if (!isBlank(block.name)) present.add("block");
        if (block.tract) present.add("tract");
        if (block.building) present.add("building");
        for (const lot of block.lots) if (!isBlank(lot.name)) present.add(lot.kind);
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
  if (location.state) parts.push(normalizeState(location.state) || "");
  if (location.county) parts.push(`${cleanPlace(location.county)} County`);
  if (location.jurisdiction) parts.push(cleanPlace(location.jurisdiction));
  if (location.city) parts.push(cleanPlace(location.city));
  return parts.filter(Boolean).join(" | ");
}

function extractPlatName(subdivisions: PlatSubdivision[]): string | undefined {
  const match = subdivisions.find((subdivision) => !isBlank(subdivision.subdivision));
  return match ? cleanPlace(match.subdivision) : undefined;
}

function extractLocation(legalJSON: unknown): LegalLocation {
  const out: LegalLocation = {};

  if (isRecord(legalJSON)) {
    const plat = isRecord(legalJSON.plat) ? legalJSON.plat : isRecord(legalJSON.location) ? legalJSON.location : null;
    if (plat) {
      if (typeof plat.city === "string" && plat.city.trim()) out.city = cleanPlace(plat.city);
      if (typeof plat.county === "string" && plat.county.trim()) out.county = cleanPlace(plat.county.replace(/\bCounty\b/i, "").trim());
      if (typeof plat.state === "string" && plat.state.trim()) out.state = normalizeState(plat.state);
      if (typeof plat.jurisdiction === "string" && plat.jurisdiction.trim()) out.jurisdiction = cleanPlace(plat.jurisdiction);
    }
  }

  const entries = [...resolveGroups(legalJSON), ...(legalJSON ? [legalJSON] : [])];
  for (const entry of entries) {
    for (const element of getElements(entry)) {
      const aspect = String(element.aspect || "").toLowerCase();
      const value = typeof element.value === "string" ? element.value.trim() : "";
      if (!value) continue;
      if (!out.city && (aspect === "city" || aspect === "municipality" || aspect === "locality")) out.city = cleanPlace(value);
      if (!out.county && (aspect === "county" || aspect === "parish" || aspect === "borough")) out.county = cleanPlace(value.replace(/\bCounty\b/i, "").trim());
      if (!out.state && (aspect === "state" || aspect === "province")) out.state = normalizeState(value);
      if (!out.jurisdiction && aspect === "jurisdiction") out.jurisdiction = cleanPlace(value);
    }
    if (out.city && out.county && out.state && out.jurisdiction) break;
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

export function resolveGroups(legalJSON: unknown): unknown[] {
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
  const location = extractLocation(legalJSON);
  const platName = extractPlatName(subdivisions);
  const presentLayers = getPresentLayers(subdivisions);

  return {
    references: resolveGroups(legalJSON).filter(group => isRecord(group) && group.type === "plat_reference").flatMap(getElements),
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
