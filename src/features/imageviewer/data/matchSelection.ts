import type { MetadataPayload, MetadataSelected } from "aurora-core";
import type { AddIndexSelection } from "../../addindex";
import { formatSelection } from "../../addindex/data/addIndexData";

const matchPercent = 80;

function score(query: string, candidate: string): number {
  const terms = query.toLowerCase().match(/[a-z0-9#]+/g) ?? [];
  const words = candidate.toLowerCase().match(/[a-z0-9#]+/g) ?? [];
  if (!terms.length || !words.length) return 0;
  let costs = Array.from({ length: words.length + 1 }, () => 0);
  for (const term of terms) {
    const next = [costs[0] + 1];
    for (let index = 1; index <= words.length; index += 1) {
      next[index] = Math.min(next[index - 1] + 1, costs[index] + 1, costs[index - 1] + Number(term !== words[index - 1]));
    }
    costs = next;
  }
  return Math.max(0, (terms.length - costs.reduce((best, cost) => Math.min(best, cost), terms.length)) * 100 / terms.length);
}

export function matchSelection(selection: AddIndexSelection, metadata: MetadataPayload): MetadataSelected | null {
  const { values, context } = formatSelection(selection);
  let winner: MetadataSelected | null = null;
  let best = -1;
  let secondary = -1;
  let pageMatch = false;
  const indexes = Array.isArray(metadata.parties) ? metadata.indexes?.filter((row) => row.segment !== "party") : metadata.indexes;
  for (const [rows, displaySegment] of [[indexes ?? [], null], [metadata.parties ?? [], "party"], [metadata.secrets ?? [], "secrets"]] as const) {
    for (const row of rows) {
      const segment = displaySegment ?? (row.segment === "loan" ? "monetary" : row.segment);
      if (!row.code || !segment) continue;
      const value = score(values, row.value ?? "");
      const source = score(context, row.source ?? "");
      const primary = Math.max(value, source);
      if (primary < matchPercent) continue;
      const other = Math.min(value, source);
      const samePage = String(row.page ?? row.page_number) === selection.pageName;
      if (primary > best || (primary === best && (other > secondary || (other === secondary && samePage && !pageMatch)))) {
        winner = { code: row.code, segment };
        best = primary;
        secondary = other;
        pageMatch = samePage;
      }
    }
  }
  return winner;
}
