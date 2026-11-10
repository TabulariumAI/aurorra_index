import { formatLabel, type LegalElement, type LegalPayload } from "aurora-core";

export type LegalMapPayload = LegalPayload;

export function labelValue(value: string, kind: string): string {
  return value.replace(new RegExp(`(^|[,/])\\s*(?:${kind})\\b\\s*(?:no\\.?\\s*)?`, "gi"), "$1").trim();
}

export const legalMapViews = ["Lot & block", "Address", "Metes & Bounds", "PLSS"] as const;
export type LegalMapView = typeof legalMapViews[number];

type NodeRecord = Record<string, unknown>;

export function isRecord(value: unknown): value is NodeRecord {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

export function isBlank(value: unknown): boolean {
  return !value || (typeof value === "string" && value.trim().length === 0);
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

export function resolveGroups(legalJSON: unknown): unknown[] {
  if (Array.isArray(legalJSON)) return legalJSON;
  if (!isRecord(legalJSON)) return [];
  return [legalJSON.LegalGroups, legalJSON.legalGroups, legalJSON.groups, legalJSON.items].find(Array.isArray) || [];
}

export type MapNote = { label: string; value: string; explanation?: string };

export function getNotes(elements: LegalElement[]): MapNote[] {
  return elements.map(element => ({ label: formatLabel(element.aspect), value: element.value!, explanation: element.explanation }));
}
