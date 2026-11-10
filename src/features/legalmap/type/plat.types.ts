import type { LegalElement } from "aurora-core";
import type { lotKinds } from "../data/platData";

export type PlatLot = {
  kind: typeof lotKinds[number];
  name: string;
  acreage?: string[];
};

export type DisplayLot = PlatLot & { filled: boolean; detail?: string };

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
