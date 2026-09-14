export function aspectGroups(resource: unknown): Record<string, string[]> {
  if (!resource || typeof resource !== "object" || !("aspects" in resource) || !resource.aspects || typeof resource.aspects !== "object" || Array.isArray(resource.aspects)) {
    throw new Error("Aspects resource is invalid.");
  }
  if (!Object.values(resource.aspects).every((aspects) => Array.isArray(aspects) && aspects.every((aspect) => typeof aspect === "string"))) {
    throw new Error("Aspects resource is invalid.");
  }
  return resource.aspects as Record<string, string[]>;
}
