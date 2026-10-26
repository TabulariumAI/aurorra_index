import type { MetadataDeferredState } from "../../metdataview/type/metadataView.types";
import type { MetadataSelected } from "aurora-core";

export function createDeferredState(input: {
  pageMap?: Iterable<readonly [string, string]>;
  segment?: string | null;
  selectedIndex?: MetadataSelected | null;
} = {}): MetadataDeferredState {
  return {
    pageMap: new Map(input.pageMap || []),
    segment: input.segment ?? null,
    selectedIndex: input.selectedIndex ?? null,
  };
}
