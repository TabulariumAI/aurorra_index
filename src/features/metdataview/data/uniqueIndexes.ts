import type { MetadataIndex } from "aurora-core";

export function uniqueIndexes(items: MetadataIndex[]): MetadataIndex[] {
  const codes = new Set<MetadataIndex["code"]>();
  return items.filter(item => {
    if (codes.has(item.code)) return false;
    codes.add(item.code);
    return true;
  });
}
