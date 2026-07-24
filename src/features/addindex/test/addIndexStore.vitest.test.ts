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

    expect(addIndexStoreApi.getState().selection).toEqual({
      groups: [
        { value: { context: ["Selected source"], kind: ["BODY"], token: ["Selected value"] } },
      ],
      pageNumber: 3,
    });

    addIndexStoreApi.getState().close();

    expect(addIndexStoreApi.getState().selection).toBeNull();
  });
});
