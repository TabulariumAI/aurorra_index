import type { MetdataDeferredState, MetdataSelected } from "../../metdataview/type/metadataView.types";

export function createDeferredState(input: {
  pageMap?: Iterable<readonly [string, string]>;
  segment?: string | null;
  selectedIndex?: MetdataSelected | null;
} = {}): MetdataDeferredState {
  return {
    pageMap: new Map(input.pageMap || []),
    segment: input.segment ?? null,
    selectedIndex: input.selectedIndex ?? null,
  };
}
