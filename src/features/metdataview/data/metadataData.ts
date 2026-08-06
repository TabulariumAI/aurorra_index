import type {
  MetadataHeadingJSON,
  MetadataIndex,
  MetadataIndexJSON,
  MetadataJSONParts,
  MetadataPage,
  MetadataPanelData,
  MetadataPayload,
  MetadataChainJSON,
  MetadataFinancialJSON,
  MetadataLegalJSON,
  MetadataPagesJSON,
  MetadataSecretsJSON,
} from "../type/metadataView.types";

export const indexSegments = Object.freeze({
  ACKNOWLEDGMENT: "acknowledgment",
  COURT: "court",
  ENDORSEMENT: "endorsement",
  LEGAL: "legal",
  MONETARY: "monetary",
  PAGE: "page",
  PARTY: "party",
  PROPERTY: "property",
  REFERENCE: "reference",
  SECRETS: "secrets",
  TRANSACTION: "transaction",
  VITAL: "vital",
});

export const indexAspects = Object.freeze({
  PARCEL: {
    ADDRESS: "parcel_address",
    ID: "parcel_id",
    REFERENCE: "parcel_reference",
  },
});

function hasSourceField(data: Record<string, unknown>, key: string) {
  return Object.prototype.hasOwnProperty.call(data, key);
}

export function splitMetadataJSON(data: MetadataPayload): MetadataJSONParts {
  const source = data as Record<string, unknown> & {
    tags?: unknown;
    usage?: unknown;
  };

  const headingJSON: MetadataHeadingJSON = {};
  if (hasSourceField(source, "heading")) headingJSON.heading = source.heading as MetadataPayload["heading"];
  if (hasSourceField(source, "tags")) headingJSON.tags = source.tags;
  if (hasSourceField(source, "usage")) headingJSON.usage = source.usage;

  const secretsJSON: MetadataSecretsJSON = {};
  if (hasSourceField(source, "secrets")) secretsJSON.secrets = source.secrets as MetadataPayload["secrets"];

  const indexJSON: MetadataIndexJSON = {};
  if (hasSourceField(source, "indexes")) indexJSON.indexes = source.indexes as MetadataPayload["indexes"];
  if (hasSourceField(source, "parties")) indexJSON.parties = source.parties as MetadataPayload["parties"];

  const legalJSON: MetadataLegalJSON = {};
  if (hasSourceField(source, "legals")) legalJSON.legals = source.legals as MetadataPayload["legals"];

  const pagesJSON: MetadataPagesJSON = {};
  if (hasSourceField(source, "pages")) pagesJSON.pages = source.pages as MetadataPayload["pages"];

  const chainJSON: MetadataChainJSON = {};
  if (hasSourceField(source, "chain")) chainJSON.chain = source.chain as MetadataPayload["chain"];
  if (hasSourceField(source, "history")) chainJSON.history = source.history as MetadataPayload["history"];

  const financialJSON: MetadataFinancialJSON = {};
  if (hasSourceField(source, "fee_factors")) financialJSON.fee_factors = source.fee_factors as MetadataPayload["fee_factors"];
  if (hasSourceField(source, "fees")) financialJSON.fees = source.fees as MetadataPayload["fees"];
  if (hasSourceField(source, "funds")) financialJSON.funds = source.funds as MetadataPayload["funds"];

  return {
    chainJSON,
    financialJSON,
    headingJSON,
    indexJSON,
    legalJSON,
    pagesJSON,
    secretsJSON,
  };
}

export function composeMetadataJSON(parts: MetadataJSONParts | null | undefined): MetadataPayload | null {
  if (!parts) return null;

  const next = {};
  const extras: Record<string, unknown> = {};
  const compose = (target: Record<string, unknown>, source: Record<string, unknown>, value: string) => {
    if (Object.prototype.hasOwnProperty.call(source, value)) {
      target[value] = source[value];
    }
  };

  const headingJSON = parts.headingJSON ?? {};
  const secretsJSON = parts.secretsJSON ?? {};
  const indexJSON = parts.indexJSON ?? {};
  const legalJSON = parts.legalJSON ?? {};
  const pagesJSON = parts.pagesJSON ?? {};
  const chainJSON = parts.chainJSON ?? {};
  const financialJSON = parts.financialJSON ?? {};

  compose(next, headingJSON, "heading");
  compose(extras, headingJSON, "tags");
  compose(extras, headingJSON, "usage");
  compose(next, secretsJSON, "secrets");
  compose(next, indexJSON, "indexes");
  compose(next, indexJSON, "parties");
  compose(next, legalJSON, "legals");
  compose(next, pagesJSON, "pages");
  compose(next, chainJSON, "chain");
  compose(next, chainJSON, "history");
  compose(next, financialJSON, "fee_factors");
  compose(next, financialJSON, "fees");
  compose(next, financialJSON, "funds");

  return { ...next, ...extras } as MetadataPayload;
}

export function asIndexArray(data: unknown): MetadataIndex[] {
  if (Array.isArray(data)) return data as MetadataIndex[];
  if (data && typeof data === "object" && Array.isArray((data as { indexes?: unknown }).indexes)) {
    return (data as { indexes: MetadataIndex[] }).indexes;
  }
  return [];
}

export function isValidIndex(index: unknown): index is MetadataIndex {
  if (!index || typeof index !== "object") return false;
  const candidate = index as MetadataIndex;
  return Boolean(
    typeof candidate.value === "string" &&
      candidate.value.trim() &&
      String(candidate.page_number).trim() &&
      typeof candidate.label === "string" &&
      candidate.label.trim(),
  );
}

export function getIndexedValue(indexes: MetadataIndex[], aspect: string): string | null {
  const match = indexes.find((item) => item.aspect === aspect);
  return typeof match?.value === "string" ? match.value : null;
}

export function getParcelOptions(indexes: MetadataIndex[]) {
  return {
    parcel_address: getIndexedValue(indexes, indexAspects.PARCEL.ADDRESS),
    parcel_id: getIndexedValue(indexes, indexAspects.PARCEL.ID),
    parcel_reference: getIndexedValue(indexes, indexAspects.PARCEL.REFERENCE),
  };
}

export function getSegmentItems(data: unknown, segments: string[]): MetadataIndex[] {
  return asIndexArray(data)
    .filter((item) => typeof item.segment === "string" && segments.includes(item.segment) && isValidIndex(item))
    .sort((a, b) => String(a.segment).localeCompare(String(b.segment)));
}

export function isAmbiguous(value: unknown): boolean {
  if (value == null) return false;
  const text = String(value).trim().toLowerCase();
  return text === "yes" || text === "y" || text === "true" || text === "1";
}

export function getPanelData(data: MetadataPayload): MetadataPanelData {
  const source = data && typeof data === "object" ? data : {};
  return {
    ...source,
    endorsements: getSegmentItems(source.indexes, [indexSegments.ENDORSEMENT]),
    monetarys: getSegmentItems(source.indexes, [indexSegments.MONETARY, "loan"]),
    notary: getSegmentItems(source.indexes, [indexSegments.ACKNOWLEDGMENT]),
    parties: Array.isArray(source.parties) ? source.parties : getSegmentItems(source.indexes, [indexSegments.PARTY]),
    properties: getSegmentItems(source.indexes, [indexSegments.PROPERTY]),
    references: getSegmentItems(source.indexes, [indexSegments.REFERENCE]),
    transactions: getSegmentItems(source.indexes, [indexSegments.TRANSACTION]),
    vitals: getSegmentItems(source.indexes, [indexSegments.VITAL]),
  };
}

function replacePageListSegments(pages: MetadataPage[] | undefined, pageCode: string, segments: string[]): MetadataPage[] | null {
  if (!pages?.some((page) => String(page.code ?? "") === pageCode)) return null;
  return pages.map((page) => (
    String(page.code ?? "") === pageCode ? { ...page, segments } : page
  ));
}

export function replaceMetadataPageSegments(parts: MetadataJSONParts, pageCode: string, segments: string[]): MetadataJSONParts {
  const code = String(pageCode ?? "").trim();
  if (!code) {
    throw new Error("Page code is required.");
  }

  const normalizedSegments = segments.map((segment) => String(segment));
  const pages = parts.pagesJSON?.pages;
  const recordables = replacePageListSegments(pages?.recordables, code, normalizedSegments);
  const nonrecordables = recordables ? null : replacePageListSegments(pages?.nonrecordables, code, normalizedSegments);
  if (!recordables && !nonrecordables) throw new Error("Page was not found in metadata cache.");

  return {
    ...parts,
    pagesJSON: {
      ...parts.pagesJSON,
      pages: {
        ...pages,
        ...(recordables ? { recordables } : {}),
        ...(nonrecordables ? { nonrecordables } : {}),
      },
    },
  };
}
