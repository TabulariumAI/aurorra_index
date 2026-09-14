import { afterEach, expect, it } from "vitest";
import { editIndexStoreApi } from "../store/editIndexStore";

afterEach(() => editIndexStoreApi.getState().close());

it("captures the original index and clears its request on close", () => {
  const index = { code: "code", value: "Original", aspect: "grantor,grantee" };
  editIndexStoreApi.getState().open({ index, session: "session", segment: "party" });
  index.value = "Changed outside the form";
  expect(editIndexStoreApi.getState().request).toEqual({ index: { code: "code", value: "Original", aspect: "grantor,grantee" }, session: "session", segment: "party" });
  editIndexStoreApi.getState().close();
  expect(editIndexStoreApi.getState().request).toBeNull();
});
