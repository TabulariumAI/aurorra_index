import type {
  PackageData,
  PackageMetadata,
  PackageUrls,
  PageRequest,
  ViewerError,
} from "../type/imageViewer.types";
import type { IndexSelected, MetadataIndex, MetadataPayload } from "../../metdata/type/metadata.types";

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function toStringValue(value: unknown): string {
  return typeof value === "string" ? value : String(value ?? "");
}

export function toPositivePage(value: unknown): number {
  return typeof value === "number" && Number.isInteger(value) && value > 0 ? value : 1;
}

export function resolvePageCode(pageMap: ReadonlyMap<string, string>, page: number, fallbackCode: string): string {
  return pageMap.get(String(page)) || fallbackCode;
}

export function toPageRequest(
  input: PageRequest,
  pageMap: ReadonlyMap<string, string>,
  page: number,
): PageRequest {
  return {
    ...input,
    code: resolvePageCode(pageMap, page, input.code),
    page: toPositivePage(page),
  };
}

export function toViewerError(error: unknown, fallback: string): ViewerError {
  if (isObject(error)) {
    const candidate = error as { code?: unknown; details?: unknown; error?: unknown; message?: unknown; status?: unknown };
    return {
      code: typeof candidate.code === "string" ? candidate.code : undefined,
      details: candidate.details,
      error: typeof candidate.error === "string"
        ? candidate.error
        : typeof candidate.message === "string"
          ? candidate.message
          : fallback,
      status: typeof candidate.status === "number" ? candidate.status : undefined,
    };
  }
  return { error: typeof error === "string" && error ? error : fallback };
}

function resolveRow(row: MetadataIndex | undefined): { ambiguous: string; label: string; pageNumber: number; source: string; value: string } | null {
  if (!row || row.label == null || row.value == null || row.page_number == null) return null;
  return {
    ambiguous: toStringValue(row.ambiguous),
    label: toStringValue(row.label),
    pageNumber: Number(row.page_number),
    source: toStringValue(row.source),
    value: toStringValue(row.value),
  };
}

export function resolveSelectedIndex(
  metadata: MetadataPayload | null,
  selectedIndex: IndexSelected | null,
): { ambiguous: string; label: string; pageNumber: number; source: string; value: string } | null {
  if (!metadata || !selectedIndex?.code) return null;
  const groups = [metadata.indexes, metadata.parties, metadata.secrets];
  for (const group of groups) {
    const row = group?.find((item) => String(item.code) === selectedIndex.code);
    const resolved = resolveRow(row);
    if (resolved) return resolved;
  }
  return null;
}

function isUrl(value: unknown): value is string {
  return typeof value === "string" && /^https?:\/\//i.test(value);
}

export function parsePackageUrls(data: PackageData): PackageUrls {
  if (!isUrl(data.tiff) || !isUrl(data.data)) {
    throw {
      code: "invalid_image_package",
      details: data,
      error: "Image package JSON does not identify TIFF and JSON URLs.",
    } satisfies ViewerError;
  }
  return { jsonUrl: data.data, tiffUrl: data.tiff };
}

export function parsePackageMetadata(value: unknown): PackageMetadata {
  if (!isObject(value) || !Array.isArray(value.pages)) {
    throw {
      code: "invalid_image_metadata",
      details: value,
      error: "Image package metadata must include pages.",
    } satisfies ViewerError;
  }
  return { ...value, pages: value.pages };
}
