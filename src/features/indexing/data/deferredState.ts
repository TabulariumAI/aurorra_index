import type { MetdataDeferredState } from "../../metdataview/type/metadataView.types";
import type { MetadataSelected } from "aurora-core";

export function createDeferredState(input: {
  pageMap?: Iterable<readonly [string, string]>;
  segment?: string | null;
  selectedIndex?: MetadataSelected | null;
} = {}): MetdataDeferredState {
  return {
    pageMap: new Map(input.pageMap || []),
    segment: input.segment ?? null,
    selectedIndex: input.selectedIndex ?? null,
  };
}
