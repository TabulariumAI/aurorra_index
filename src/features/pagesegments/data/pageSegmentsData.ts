import { replaceMetadataPageSegments } from "../../metdata/data/metadataData";
import { storeApi } from "../../../store/state/store";
import type { IndexChoice } from "../../metdata/type/metadata.types";

export const PAGE_SEGMENT_CHOICES = Object.freeze({
  reference: "RecitalIndexing",
  property: "ExhibitIndexing",
  endorsement: "EndorsementIndexing",
  transaction: "TransactionIndexing",
  party: "PartyClauseIndexing",
  secrets: "ConfidentialIndexing",
  monetary: "MonetaryInfoIndexing",
  acknowledgment: "AcknowledgmentIndexing",
  court: "CourtIndexing",
  vital: "VitalIndexing",
});

export type PageSegmentValue = keyof typeof PAGE_SEGMENT_CHOICES;

export const PAGE_SEGMENT_ORDER = Object.freeze([
  "reference",
  "property",
  "endorsement",
  "transaction",
  "party",
  "secrets",
  "monetary",
  "acknowledgment",
  "court",
  "vital",
]) as readonly PageSegmentValue[];

export const PAGE_SEGMENT_LABELS = Object.freeze({
  reference: "Referance(Rectal)",
  property: "Property Terms(Exhibit)",
  endorsement: "Record Endorsements",
  transaction: "Transaction",
  party: "Party (Party Clause)",
  secrets: "Confidential",
  monetary: "Monetary Terms",
  acknowledgment: "Notarial Acknowledgment",
  court: "Court",
  vital: "Vital",
});

function parseChoices(choices: IndexChoice[] | string | null): IndexChoice[] {
  let parsed: unknown = choices;
  while (typeof parsed === "string") {
    parsed = JSON.parse(parsed);
  }
  return Array.isArray(parsed) ? parsed as IndexChoice[] : [];
}

export function getChoiceLevel(choices: IndexChoice[] | string | null, name: string): number {
  try {
    const parsed = parseChoices(choices);
    const match = parsed.find((choice) => choice && typeof choice === "object" && choice.service === name);
    return match ? Number(match.level) : 0;
  } catch {
    return 0;
  }
}

export function isPageSegmentValue(value: string): value is PageSegmentValue {
  return (PAGE_SEGMENT_ORDER as readonly string[]).includes(value);
}

export function normalizePageSegments(segments: string[]): string[] {
  const selected = new Set(
    segments
      .map((segment) => String(segment ?? "").trim())
      .filter(isPageSegmentValue),
  );
  return PAGE_SEGMENT_ORDER.filter((segment) => selected.has(segment));
}

export function updateCachedPageSegments(session: string, pageCode: string, segments: string[]): void {
  const current = storeApi.getState().getJSON(session);
  if (!current) {
    throw new Error("Metadata cache is not available.");
  }
  storeApi.getState().setJSON(session, replaceMetadataPageSegments(current, pageCode, segments));
}
