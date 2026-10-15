import { afterEach, describe, expect, it } from "vitest";
import { addIndexStoreApi } from "../store/addIndexStore";

describe("addIndexStore", () => {
  afterEach(() => {
    addIndexStoreApi.getState().close();
  });

  it("opens and closes the active selection", () => {
    addIndexStoreApi.getState().open({
      groups: [
        { value: { context: ["Selected source"], kind: ["BODY"], token: ["Selected value"] } },
      ],
      pageName: "Exhibit-A",
    });

    expect(addIndexStoreApi.getState().request).toEqual({
      groups: [
        { value: { context: ["Selected source"], kind: ["BODY"], token: ["Selected value"] } },
      ],
      pageName: "Exhibit-A",
    });

    addIndexStoreApi.getState().close();

    expect(addIndexStoreApi.getState().request).toBeNull();
  });

  it("replaces image selection with a segment request and clears it on close", () => {
    addIndexStoreApi.getState().open({ groups: [], pageName: "Exhibit-A" });
    addIndexStoreApi.getState().open({ segment: "property" });
    expect(addIndexStoreApi.getState().request).toEqual({ segment: "property" });
    addIndexStoreApi.getState().close();
    expect(addIndexStoreApi.getState().request).toBeNull();
    addIndexStoreApi.getState().open({ groups: [], pageName: "2" });
    expect(addIndexStoreApi.getState().request).toEqual({ groups: [], pageName: "2" });
  });
});
