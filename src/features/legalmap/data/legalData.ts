import type { LegalElement, LegalGroup, LegalPayload } from "../../metdataview/type/metadataView.types";

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

const unitKeys = ["condominium_unit", "unit_number", "unit", "unit_designation", "condo_unit", "suite", "apartment"];
const stateNames = Object.values(stateAbbr);
const stateNameRegex = new RegExp(`\\b(${stateNames.map((value) => value.replace(/ /g, "\\s+")).join("|")})\\b`, "i");

export type PlatLot = {
  condominium_unit?: string;
  name: string;
};

export type PlatBlock = {
  lots: PlatLot[];
  name: string;
};

export type PlatPhase = {
  blocks: PlatBlock[];
  name: string;
};

export type PlatTrack = {
  name: string;
  phases: PlatPhase[];
};

export type PlatSubdivision = {
  subdivision: string;
  tract: string;
  tracks: PlatTrack[];
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

function getUnitValue(elements: LegalElement[]): string {
  for (const key of unitKeys) {
    const value = getVal(elements, key);
    if (!isBlank(value)) return value;
  }
  return "";
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

export function toPlatJSON(legalJSON: unknown): PlatSubdivision[] {
  const subdivisions = new Map<string, PlatSubdivision & { trackMap: Map<string, PlatTrack & { phaseMap: Map<string, PlatPhase & { blockMap: Map<string, PlatBlock> }> }> }>();
  const norm = (value: unknown) => String(value || "").trim();

  for (const legal of collectLotBlockEntries(legalJSON)) {
    const elements = getElements(legal);
    const subdivision = norm(getVal(elements, "subdivision") || getVal(elements, "subdivision_name"));
    const part = norm(getVal(elements, "part"));
    const phase = norm(getVal(elements, "phase"));
    const block = norm(getVal(elements, "block"));
    const lot = norm(getVal(elements, "lot"));
    const condoUnit = norm(getUnitValue(elements));

    if (!subdivisions.has(subdivision)) {
      subdivisions.set(subdivision, { subdivision, tract: "", tracks: [], trackMap: new Map() });
    }

    const subNode = subdivisions.get(subdivision);
    if (!subNode) continue;

    if (!subNode.trackMap.has(part)) {
      subNode.trackMap.set(part, { name: part, phases: [], phaseMap: new Map() });
      subNode.tracks.push(subNode.trackMap.get(part) as PlatTrack);
    }

    const track = subNode.trackMap.get(part);
    if (!track) continue;

    const phaseName = phase || part || "";
    if (!track.phaseMap.has(phaseName)) {
      track.phaseMap.set(phaseName, { name: phaseName, blocks: [], blockMap: new Map() });
      track.phases.push(track.phaseMap.get(phaseName) as PlatPhase);
    }

    const phaseNode = track.phaseMap.get(phaseName);
    if (!phaseNode) continue;

    if (!phaseNode.blockMap.has(block)) {
      phaseNode.blockMap.set(block, { name: block, lots: [] });
      phaseNode.blocks.push(phaseNode.blockMap.get(block) as PlatBlock);
    }

    const blockNode = phaseNode.blockMap.get(block);
    if (blockNode) {
      blockNode.lots.push(condoUnit ? { name: lot, condominium_unit: condoUnit } : { name: lot });
    }
  }

  return Array.from(subdivisions.values()).map(({ subdivision, tract, tracks }) => ({
    subdivision,
    tract,
    tracks: tracks.map((track) => ({
      name: track.name,
      phases: track.phases.map((phase) => ({
        name: phase.name,
        blocks: phase.blocks.map((block) => ({
          name: block.name,
          lots: block.lots,
        })),
      })),
    })),
  }));
}

export function getPresentLayers(subdivisions: PlatSubdivision[]): Set<string> {
  const present = new Set<string>();
  for (const sub of subdivisions) {
    if (!isBlank(sub.subdivision)) present.add("subdivision");
    if (!isBlank(sub.tract)) present.add("tract");
    for (const track of sub.tracks) {
      for (const phase of track.phases) {
        if (!isBlank(phase.name)) present.add("phase");
        for (const block of phase.blocks) {
          if (!isBlank(block.name)) present.add("block");
          for (const lot of block.lots) {
            if (!isBlank(lot.name)) present.add("lot");
            if (isBlank(lot.name)) present.add("lot_empty");
            if (!isBlank(lot.condominium_unit)) present.add("condo_unit");
          }
        }
      }
    }
  }
  return present;
}

export function isAllEmptyStructure(subdivisions: PlatSubdivision[]): boolean {
  if (!Array.isArray(subdivisions) || subdivisions.length === 0) return true;
  for (const sub of subdivisions) {
    if (!isBlank(sub.subdivision)) return false;
    if (!isBlank(sub.tract)) return false;
    for (const track of sub.tracks) {
      for (const phase of track.phases) {
        if (!isBlank(phase.name)) return false;
        for (const block of phase.blocks) {
          if (!isBlank(block.name)) return false;
          for (const lot of block.lots) {
            if (!isBlank(lot.name)) return false;
            if (!isBlank(lot.condominium_unit)) return false;
          }
        }
      }
    }
  }
  return true;
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

function resolveGroups(legalJSON: unknown): { groups: unknown[]; raw: unknown } {
  if (Array.isArray(legalJSON)) return { raw: legalJSON, groups: legalJSON };
  if (!isRecord(legalJSON)) return { raw: legalJSON, groups: [] };
  const groups = [legalJSON.LegalGroups, legalJSON.legalGroups, legalJSON.groups, legalJSON.items].find(Array.isArray);
  return { raw: legalJSON, groups: groups || [] };
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

export function normalizeLegalData(legalJSON: LegalPayload | LegalGroup[] | null | undefined): LegalViewModel {
  const { raw, groups } = resolveGroups(legalJSON);
  const source = groups.length ? groups : raw;
  const subdivisions = toPlatJSON(source);
  const location = extractCityCountyState(raw);
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
  };
}
