import { describe, expect, it } from "vitest";
import { createDeferredState } from "../data/deferredState";

describe("deferred state", () => {
  it("models page map, current segment, and selected index without owning app state", () => {
    const state = createDeferredState({
      pageMap: [["1", "page-code"]],
      segment: "party",
      selectedIndex: { code: "idx-1", segment: "party" },
    });

    expect(state.pageMap.get("1")).toBe("page-code");
    expect(state.segment).toBe("party");
    expect(state.selectedIndex).toEqual({ code: "idx-1", segment: "party" });
  });
});
