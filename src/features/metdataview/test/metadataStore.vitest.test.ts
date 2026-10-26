import { beforeEach, describe, expect, it } from "vitest";
import { indexStoreApi } from "../store/metadataStore";

const error = { code: "content_result_invalid", error: "The pages export result could not be decoded: the JSON is incomplete." };

beforeEach(() => indexStoreApi.getState().resetMetadata());

describe("Pages export errors", () => {
  it("keeps Pages errors separate by session and from metadata status", () => {
    const state = indexStoreApi.getState();
    state.setLoaded("first");
    state.setPageError("first", error);
    state.setPageError("second", { error: "Other pages failed" });
    expect(indexStoreApi.getState()).toMatchObject({ activeSession: "first", status: "success", error: null, pageErrors: { first: error, second: { error: "Other pages failed" } } });
    state.setPageError("first", null);
    expect(indexStoreApi.getState().pageErrors).toEqual({ second: { error: "Other pages failed" } });
  });

  it("invalidates only the selected session error", () => {
    indexStoreApi.getState().setPageError("first", error);
    indexStoreApi.getState().setPageError("second", error);
    indexStoreApi.getState().invalidateSession("first");
    expect(indexStoreApi.getState().pageErrors).toEqual({ second: error });
  });

  it("preserves session errors when resetting only the view", () => {
    indexStoreApi.getState().setPageError("session", error);
    indexStoreApi.getState().resetView();
    expect(indexStoreApi.getState().pageErrors).toEqual({ session: error });
    expect(indexStoreApi.getState().activeSession).toBeNull();
  });

  it("clears Pages errors when metadata is cleared", () => {
    indexStoreApi.getState().setPageError("session", error);
    indexStoreApi.getState().resetMetadata();
    expect(indexStoreApi.getState().pageErrors).toEqual({});
  });
});
