import type { AddIndexSelection } from "../type/addIndex.types";

function record(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function aspectGroups(resource: unknown): Record<string, string[]> {
  if (!record(resource) || !record(resource.aspects)) throw new Error("Aspects resource is invalid.");
  if (!Object.values(resource.aspects).every((aspects) => Array.isArray(aspects) && aspects.every((aspect) => typeof aspect === "string"))) {
    throw new Error("Aspects resource is invalid.");
  }
  return resource.aspects as Record<string, string[]>;
}

function compactText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function comparisonKey(value: string): string {
  return compactText(value).replace(/[.,;:]+$/g, "").toUpperCase();
}

function joinSelection(items: Array<string | null>): string {
  return items
    .filter((item): item is string => typeof item === "string")
    .map(compactText)
    .filter(Boolean)
    .join(" ");
}

function uniqueText(items: Array<string | null>, trimPunctuation: boolean): string[] {
  const values = new Map<string, string>();
  items.forEach((item) => {
    if (typeof item !== "string") return;
    const compact = compactText(item);
    const value = (trimPunctuation ? compact.replace(/[.,;:]+$/g, "") : compact).trim();
    if (!value) return;
    const key = comparisonKey(value);
    if (!key) return;
    if (!values.has(key)) values.set(key, value);
  });
  return Array.from(values.values());
}

export function formatSelection(selection: AddIndexSelection): { context: string; values: string } {
  const values = uniqueText(selection.groups.map((group) => joinSelection(group.value.token)), true);
  const uniqueContexts = uniqueText(selection.groups.map((group) => joinSelection(group.value.context)), false);
  const contexts = uniqueContexts.filter((context, index) => {
    const key = comparisonKey(context);
    return !uniqueContexts.some((candidate, candidateIndex) => (
      candidateIndex !== index
      && comparisonKey(candidate).length > key.length
      && comparisonKey(candidate).includes(key)
    ));
  });
  return {
    context: contexts.join("\n\n"),
    values: values.join(" "),
  };
}
