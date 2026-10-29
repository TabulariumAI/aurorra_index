import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { useIqRefresh } from "../hook/useIqRefresh";
import { iqStoreApi } from "../store/iqStore";
import { queueStoreApi } from "../../queue/store/queueStore";

const report = { decision: "Pass", explanation: [], gates: [], iq_doc: 97, segments: [] };
afterEach(() => { cleanup(); iqStoreApi.getState().resetIq(); queueStoreApi.getState().reset(); });

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
  act(() => iqStoreApi.getState().ackSuccess("gate"));
  expect(result.current).toBe(true);
});

it("does not compare a report against another session's metadata", () => {
  queueStoreApi.getState().setEtag("other", "one");
  iqStoreApi.getState().setLoaded("s", report, "one");
  const { result } = renderHook(useIqRefresh);
  expect(result.current).toBe(false);
});
