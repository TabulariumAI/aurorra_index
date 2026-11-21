import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { useIqRefresh } from "../hook/useIqRefresh";
import { iqStoreApi } from "../store/iqStore";
import { queueStoreApi } from "../../queue/store/queueStore";

const report = { notes: [], gates: [], iq_doc: 97, segments: [] };
afterEach(() => { cleanup(); iqStoreApi.getState().resetIq(); queueStoreApi.getState().reset(); });

it("does not compare an unavailable source ETag and resumes comparison when supplied", () => {
  queueStoreApi.getState().setEtag("s", "one");
  iqStoreApi.getState().setLoaded("s", report);
  const { result } = renderHook(useIqRefresh);
  expect(result.current).toBe(false);
  expect(iqStoreApi.getState().report).toEqual(report);
  act(() => queueStoreApi.getState().setEtag("s", "two"));
  expect(result.current).toBe(false);
  act(() => iqStoreApi.getState().setLoaded("s", report, "one"));
  expect(result.current).toBe(true);
  act(() => iqStoreApi.getState().setLoaded("s", report, "two"));
  expect(result.current).toBe(false);
});

it("clears the previous report source when loading another session", () => {
  queueStoreApi.getState().setEtag("first", "one");
  iqStoreApi.getState().setLoaded("first", report, "one");
  const { result } = renderHook(useIqRefresh);
  act(() => {
    queueStoreApi.getState().setEtag("second", "two");
    iqStoreApi.getState().setLoading("second", false);
  });
  expect(iqStoreApi.getState().metadataEtag).toBeNull();
  expect(result.current).toBe(false);
});

it("compares the displayed IQ source against the current session metadata and tracks changes", () => {
  queueStoreApi.getState().setEtag("s", "one");
  const { result } = renderHook(useIqRefresh);
  expect(result.current).toBe(false);
  act(() => iqStoreApi.getState().setLoaded("s", report, "one"));
  expect(result.current).toBe(false);
  act(() => queueStoreApi.getState().setEtag("s", "two"));
  expect(result.current).toBe(true);
  act(() => iqStoreApi.getState().setLoading("s", true));
  expect(result.current).toBe(true);
  act(() => iqStoreApi.getState().setError({ error: "refresh failed" }));
  expect(result.current).toBe(true);
  act(() => iqStoreApi.getState().setLoaded("s", report, "two"));
  expect(result.current).toBe(false);
  act(() => iqStoreApi.getState().resetIq());
  expect(result.current).toBe(false);
});

it.each(["", "other"])("marks a mismatched or absent generated source: %s", source => {
  queueStoreApi.getState().setEtag("s", "one");
  iqStoreApi.getState().setLoaded("s", report, source);
  const { result } = renderHook(useIqRefresh);
  expect(result.current).toBe(true);
  act(() => {
    iqStoreApi.getState().setLoaded("s", report, source);
  });
  expect(result.current).toBe(true);
});

it("does not compare a report against another session's metadata", () => {
  queueStoreApi.getState().setEtag("other", "one");
  iqStoreApi.getState().setLoaded("s", report, "one");
  const { result } = renderHook(useIqRefresh);
  expect(result.current).toBe(false);
});

const model = { class: "deed", jurisdiction: "Texas, Harris County", etag: "model-one" };
it.each([
  ["metadata", "model-one", false], ["other-metadata", "model-one", true],
  ["metadata", "model-two", true], ["other-metadata", "model-two", true],
])("compares metadata %s and model %s independently", (metadata, etag, stale) => {
  queueStoreApi.getState().setEtag("s", metadata);
  iqStoreApi.getState().setLoaded("s", report, "metadata", "model-one", { ...model, etag });
  const { result } = renderHook(useIqRefresh);
  expect(result.current).toBe(stale);
});

it("retains the model mismatch through edits, refresh failures and acknowledgements until regeneration", () => {
  queueStoreApi.getState().setEtag("s", "metadata");
  iqStoreApi.getState().setLoaded("s", report, "metadata", "model-one", model);
  const { result } = renderHook(useIqRefresh);
  act(() => iqStoreApi.getState().setVerificationModel("s", { ...model, etag: "model-two" }));
  expect(result.current).toBe(true);
  expect(iqStoreApi.getState().report).toBe(report);
  act(() => iqStoreApi.getState().setVerificationModel("s", { ...model, etag: "model-three" }));
  expect(result.current).toBe(true);
  act(() => iqStoreApi.getState().setLoading("s", true));
  expect(result.current).toBe(true);
  act(() => iqStoreApi.getState().setError({ error: "failed" }));
  expect(result.current).toBe(true);
  act(() => {
    iqStoreApi.getState().setLoaded("s", report, "metadata", "model-one", { ...model, etag: "model-three" });
  });
  expect(result.current).toBe(true);
  act(() => iqStoreApi.getState().setLoaded("s", report, "metadata", "model-three", { ...model, etag: "model-three" }));
  expect(result.current).toBe(false);
  act(() => iqStoreApi.getState().setLoading("other", false));
  expect(result.current).toBe(false);
  expect(iqStoreApi.getState().verificationModel).toBeNull();
});

it("ignores model changes for another session and does not invent an unavailable version", () => {
  queueStoreApi.getState().setEtag("s", "metadata");
  iqStoreApi.getState().setLoaded("s", report, "metadata", undefined, model);
  const { result } = renderHook(useIqRefresh);
  act(() => iqStoreApi.getState().setVerificationModel("other", { ...model, etag: "different" }));
  expect(iqStoreApi.getState().verificationModel).toEqual(model);
  expect(result.current).toBe(false);
});

it("compares the verification model independently when current metadata is unavailable", () => {
  queueStoreApi.getState().setEtag("other", "metadata");
  iqStoreApi.getState().setLoaded("s", report, "metadata", "model-one", { ...model, etag: "model-two" });
  const { result } = renderHook(useIqRefresh);
  expect(result.current).toBe(true);
});
