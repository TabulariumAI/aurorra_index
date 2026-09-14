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
      pageNumber: 3,
    });

    expect(addIndexStoreApi.getState().request).toEqual({
      groups: [
        { value: { context: ["Selected source"], kind: ["BODY"], token: ["Selected value"] } },
      ],
      pageNumber: 3,
    });

    addIndexStoreApi.getState().close();

    expect(addIndexStoreApi.getState().request).toBeNull();
  });

  it("replaces image selection with a segment request and clears it on close", () => {
    addIndexStoreApi.getState().open({ groups: [], pageNumber: 3 });
    addIndexStoreApi.getState().open({ segment: "property" });
    expect(addIndexStoreApi.getState().request).toEqual({ segment: "property" });
    addIndexStoreApi.getState().close();
    expect(addIndexStoreApi.getState().request).toBeNull();
    addIndexStoreApi.getState().open({ groups: [], pageNumber: 2 });
    expect(addIndexStoreApi.getState().request).toEqual({ groups: [], pageNumber: 2 });
  });
});
