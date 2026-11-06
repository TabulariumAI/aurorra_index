import { beforeEach, expect, it, vi } from "vitest";
import { getBlockers } from "../data/queueBlockers";
import { queueStoreApi } from "../store/queueStore";

beforeEach(() => queueStoreApi.getState().reset());
it.each(["logout", "session"] as const)("exposes index work for %s without showing package UI", reason => {
  queueStoreApi.setState({ tasks: [{ id: "task", session: "one", segment: "party", batch: null,
    cursor: 0, status: "failed", result: null, error: "Offline", changes: [{ action: "reprocess", segment: "party" }],
    runtime: { formatError: (error: unknown) => (error as Error).message, onChange: vi.fn(), authToken: "token", intervalMs: 0, client: {} as never } }] });
  const blockers = getBlockers(reason);
  expect(blockers).toHaveLength(1);
  expect(blockers[0].items.join(" ")).toMatch(/one.*Party.*Reprocess/);
  expect(queueStoreApi.getState().tasks).toHaveLength(1);
  blockers[0].cancel();
  expect(queueStoreApi.getState().tasks).toEqual([]);
});
it("does not expose completed work as a blocker", () => {
  expect(getBlockers("logout")).toEqual([]);
});

it("preserves index action and value when the existing optional patch is absent", () => {
  queueStoreApi.setState({ tasks: [{ id: "task", session: "one", segment: "property", batch: null,
    cursor: 0, status: "failed", result: null, error: "Offline",
    changes: [{ action: "patch", code: "one", index: { aspect: "property_id", value: "Parcel" }, patch: null }],
    runtime: { formatError: (error: unknown) => (error as Error).message, onChange: vi.fn(), authToken: "token", intervalMs: 0, client: {} as never } }] });
  expect(getBlockers("logout")[0].items.join(" ")).toContain("Patch · Property Id · Parcel");
});
