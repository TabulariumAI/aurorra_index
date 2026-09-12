import { composeMetadataJSON, splitMetadataJSON, replaceMetadataPageSegments } from "aurora-core";
import type { MetadataIndex, MetadataPayload } from "aurora-core";
import { validateChange } from "./indexChange";
import type { IndexChange, QueueChange, QueueRequest } from "../type/queue.types";

// Matches TextHelper::strict_key used by the refinement endpoints.
export function indexKey(value: string): string {
  return [...new Set(value.normalize("NFKC").replace(/[\uFEFF\u200B\u200C\u200D]/g, "")
    .split(/[\s_\-/. ,:]+/u).filter(Boolean)
    .map((token) => token.replace(/[,.:;\-/]+$/, "").replace(/[A-Z]/g, (letter) => letter.toLowerCase()))
    .map((token) => /^\d+$/.test(token) ? token.replace(/^0+(?=\d)/, "") : token)
    .filter(Boolean))].sort().join("\u001f");
}

function matches(item: MetadataIndex, patch: IndexChange): boolean {
  return (["label", "aspect", "value"] as const).every((field) => {
    const value = patch[`old_index_${field}`];
    return !value?.trim() || (item[field] !== undefined && indexKey(item[field]) === indexKey(value));
  });
}

export function readChanges(request: QueueRequest, metadata: MetadataPayload, id: string): QueueChange[] {
  const indexes = [...(metadata.indexes ?? []), ...(metadata.parties ?? []), ...(metadata.secrets ?? [])];
  if ("action" in request && request.action === "page") {
    replaceMetadataPageSegments(splitMetadataJSON(metadata), request.code, request.segments);
    return [{ action: "page", code: request.code, segments: [...request.segments], index: { code: request.code, segment: "page", value: request.code }, patch: null }];
  }
  if (!("data" in request)) {
    const index = indexes.find((item) => item.code === request.code);
    if (!index) throw new Error("The selected index is no longer available.");
    return [{ action: request.action, code: request.code, index, patch: null }];
  }
  const data: unknown = JSON.parse(request.data);
  if (!Array.isArray(data) || data.length === 0) throw new Error("No index changes were provided.");
  let projected = metadata;
  return data.map((value: unknown, position) => {
    validateChange(value);
    const patch = value;
    const candidates = [...(projected.indexes ?? []), ...(projected.parties ?? []), ...(projected.secrets ?? []).map((item) => ({ ...item, aspect: item.label }))];
    const found = patch.action === "add" ? undefined : candidates.find((item) => matches(item, patch));
    const index: MetadataIndex = found ?? {
      code: `${id}:${position}`, segment: request.segment,
      ...(patch.new_index_label !== null ? { label: patch.new_index_label } : {}),
      ...(patch.new_index_aspect !== null ? { aspect: patch.new_index_aspect } : {}),
      ...(patch.new_index_value !== null ? { value: patch.new_index_value } : {}),
      ...(patch.new_index_ambiguous !== null ? { ambiguous: patch.new_index_ambiguous } : {}),
      explanation: patch.explanation,
    };
    const change: QueueChange = { action: "patch", code: index.code ?? "", index, patch };
    projected = applyChange(projected, change);
    return change;
  });
}

export function applyChange(metadata: MetadataPayload, change: QueueChange): MetadataPayload {
  if (change.action === "page") return composeMetadataJSON(replaceMetadataPageSegments(splitMetadataJSON(metadata), change.code, change.segments))!;
  const patch = change.patch;
  const selected = (item: MetadataIndex) => change.code ? item.code === change.code : Boolean(patch && matches(item, patch));
  const apply = (items: MetadataIndex[]): MetadataIndex[] => {
    if (patch?.action === "add") {
      if (items.some((item) => item.aspect !== undefined && item.value !== undefined &&
        indexKey(item.aspect) === indexKey(patch.new_index_aspect!) && indexKey(item.value) === indexKey(patch.new_index_value!))) return items;
      return [change.index, ...items];
    }
    if (change.action === "drop" || patch?.action === "remove") return items.filter((item) => !selected(item));
    return items.map((item) => {
      if (!selected(item)) return item;
      if (change.action === "confirm") return { ...item, ambiguous: "NO" };
      const next = { ...item };
      if (patch) {
        for (const field of ["label", "aspect", "value", "ambiguous"] as const) {
          const value = patch[`new_index_${field}`];
          if (value?.trim()) next[field] = value.trim();
        }
        next.explanation = patch.explanation;
      }
      return next;
    });
  };
  const result = { ...metadata, indexes: apply(metadata.indexes ?? []) };
  if (metadata.parties && (patch?.action !== "add" || change.index.segment === "party")) result.parties = apply(metadata.parties);
  if (metadata.secrets && (patch?.action !== "add" || change.index.segment === "secrets")) {
    result.secrets = apply(metadata.secrets.map((item) => ({ ...item, aspect: item.label })));
  }
  if (patch && patch.action !== "add" && metadata.legals?.groups) {
    result.legals = { ...metadata.legals, groups: metadata.legals.groups.map((group) => ({ ...group,
      elements: group.elements?.flatMap((element) => {
        if (!matches({ ...element, label: "legal" }, patch)) return [element];
        if (patch.action === "remove") return [];
        return [{ ...element,
          ...(patch.new_index_aspect ? { aspect: patch.new_index_aspect } : {}),
          ...(patch.new_index_value ? { value: patch.new_index_value } : {}),
          explanation: patch.explanation,
        }];
      }),
    })) };
  }
  return result;
}
