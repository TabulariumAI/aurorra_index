import { beforeEach, expect, it } from "vitest";
import { indexStoreApi } from "../store/metadataStore";
const error = { code: "content_result_invalid", error: "The pages export result could not be decoded." };
beforeEach(() => indexStoreApi.getState().resetMetadata());
it("keeps only the current Pages error, separate from metadata status", () => {
  const state = indexStoreApi.getState();
  state.setLoaded("first");
  state.setPageError("first", error);
  state.setPageError("second", { error: "Other pages failed" });
  expect(indexStoreApi.getState()).toMatchObject({ activeSession: "first", status: "success", error: null, pageError: error });
  state.setPageError("first", null);
  expect(indexStoreApi.getState().pageError).toBeNull();
});
it("invalidates only the current session", () => {
  indexStoreApi.getState().setLoaded("first");
  indexStoreApi.getState().setPageError("first", error);
  indexStoreApi.getState().invalidateSession("second");
  expect(indexStoreApi.getState().pageError).toBe(error);
  indexStoreApi.getState().invalidateSession("first");
  expect(indexStoreApi.getState().pageError).toBeNull();
});
it("preserves the current Pages error when resetting only the view", () => {
  indexStoreApi.getState().setLoaded("session");
  indexStoreApi.getState().setPageError("session", error);
  indexStoreApi.getState().resetView();
  expect(indexStoreApi.getState().pageError).toBe(error);
});
it("clears Pages state on metadata exit", () => {
  indexStoreApi.getState().setLoaded("session");
  indexStoreApi.getState().setPageError("session", error);
  indexStoreApi.getState().resetMetadata();
  expect(indexStoreApi.getState()).toMatchObject({ pageError: null, pageRequest: null });
});
