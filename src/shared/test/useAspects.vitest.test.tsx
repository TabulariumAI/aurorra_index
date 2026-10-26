import { act, renderHook } from "@testing-library/react";
import type { ResourceRequest } from "aurora-core";
import { expect, it, vi } from "vitest";
import { useAspects } from "../hook/useAspects";

it("accepts the configured callback result and preserves structured owner failures", async () => {
  let callback!: ResourceRequest["callback"];
  const request = {};
  const onResource = vi.fn((value: ResourceRequest) => { callback = value.callback; });
  const ready = vi.fn();
  const error = vi.fn();
  const view = renderHook(() => useAspects(request, "s", onResource, ready, error));
  expect(onResource).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ resource: "aspects", session: "s" }));
  const failure = { ok: false as const, error: "Unavailable", code: "resource_failed", details: { source: "owner" }, status: 503 };
  await act(async () => callback(failure));
  expect(error).toHaveBeenCalledWith(expect.objectContaining({ error: "Unavailable", code: "resource_failed", details: { source: "owner" }, status: 503 }));
  expect(ready).toHaveBeenLastCalledWith(true);
  expect(view.result.current.ready).toBe(false);
});

it("rejects invalid owner data and ignores callbacks after unmount", async () => {
  let callback!: ResourceRequest["callback"];
  const request = {};
  const onResource = (value: ResourceRequest) => { callback = value.callback; };
  const ready = vi.fn();
  const error = vi.fn();
  const view = renderHook(() => useAspects(request, "s", onResource, ready, error));
  await act(async () => callback({ ok: true, data: { aspects: { party: [1] } } }));
  expect(error).toHaveBeenCalledWith(expect.objectContaining({ error: "Aspects resource is invalid." }));
  view.unmount();
  error.mockClear();
  ready.mockClear();
  await act(async () => callback({ ok: false, error: "Late error" }));
  expect(error).not.toHaveBeenCalled();
  expect(ready).not.toHaveBeenCalled();
});
