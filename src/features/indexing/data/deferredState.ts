import type { IndexDeferredState, IndexSelected } from "../../metdata/type/metadata.types";

export function createDeferredState(input: {
  pageMap?: Iterable<readonly [string, string]>;
  segment?: string | null;
  selectedIndex?: IndexSelected | null;
} = {}): IndexDeferredState {
  return {
    pageMap: new Map(input.pageMap || []),
    segment: input.segment ?? null,
    selectedIndex: input.selectedIndex ?? null,
  };
}
