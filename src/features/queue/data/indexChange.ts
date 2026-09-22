import type { IndexChange } from "../type/queue.types";

export function validateChange(value: unknown): asserts value is IndexChange {
  if (!value || typeof value !== "object") throw Object.assign(new Error("Invalid index change."), { code: "invalid_change" });
  const patch = value as IndexChange;
  if (!["add", "update", "remove"].includes(patch.action)) throw Object.assign(new Error("Invalid index action."), { code: "invalid_action" });
  if (typeof patch.explanation !== "string") throw Object.assign(new Error("Invalid index explanation."), { code: "invalid_explanation" });
  if (patch.allow_enrichment !== undefined && typeof patch.allow_enrichment !== "boolean") throw Object.assign(new Error("Invalid enrichment choice."), { code: "invalid_enrichment" });
  for (const field of ["label", "aspect", "value", "ambiguous"] as const) {
    const value = patch[`new_index_${field}`];
    if ((value !== null && typeof value !== "string") || (patch.action === "add" && (field === "aspect" || field === "value") && !value?.trim())) {
      throw Object.assign(new Error(`Invalid index ${field}.`), { code: `invalid_${field}` });
    }
  }
  if (patch.action === "add") {
    for (const field of ["page", "source"] as const) {
      const value = patch[`new_index_${field}`];
      if (value !== undefined && value !== null && typeof value !== "string") {
        throw Object.assign(new Error(`Invalid index ${field}.`), { code: `invalid_${field}` });
      }
    }
  }
  if ([patch.old_index_label, patch.old_index_aspect, patch.old_index_value].some((field) => field !== null && typeof field !== "string")) {
    throw Object.assign(new Error("Invalid original index."), { code: "invalid_target" });
  }
  if (patch.action !== "add" && ![patch.old_index_label, patch.old_index_aspect, patch.old_index_value].some((field) => field?.trim())) {
    throw Object.assign(new Error("An index change requires its original label, aspect, or value."), { code: "invalid_target" });
  }
}
