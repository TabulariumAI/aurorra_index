import { beforeEach, expect, it, vi } from "vitest";
import { waitFor } from "@testing-library/react";
import { splitMetadataJSON } from "aurora-core";
import type { QueueRuntime } from "../type/queue.types";

function runtime(): QueueRuntime {
  return { onChange: vi.fn(), authToken: "private-token", intervalMs: 0, client: {
    patchIndex: vi.fn(() => new Promise<never>(() => {})),
    patchStatus: vi.fn(() => new Promise<never>(() => {})),
    indexData: vi.fn(async () => ({ indexes: [] })),
    confirmIndex: vi.fn(), dropIndex: vi.fn(), updatePageSegments: vi.fn(), reprocessSegment: vi.fn(),
  } };
}

async function load() {
  const { queueStoreApi } = await import("../store/queueStore");
  const { storeApi } = await import("../../../store/state/store");
  return { queueStoreApi, storeApi };
}

beforeEach(() => { localStorage.clear(); vi.resetModules(); });

it("restores unacknowledged requests as failed without resending and keeps disabled row data", async () => {
  const first = await load();
  const config = runtime();
  first.queueStoreApi.getState().restore("user-one", config);
  first.storeApi.getState().setJSON("session", splitMetadataJSON({ indexes: [] }));
  await first.queueStoreApi.getState().enqueue({ batch: "batch", session: "session", segment: "property", data: JSON.stringify([{
    action: "add", explanation: "P 1 Source", new_index_label: "Parcel Id", new_index_aspect: "parcel_id", new_index_value: "Parcel",
    new_index_ambiguous: null, old_index_label: null, old_index_aspect: null, old_index_value: null,
  }]) }, config);
  const saved = localStorage.getItem("aurorra-index:queue")!;
  expect(saved).not.toContain("private-token");
  expect(saved).not.toContain("runtime");
  vi.resetModules();
  const restored = await load();
  const next = runtime();
  restored.queueStoreApi.getState().restore("user-one", next);
  expect(next.onChange).toHaveBeenCalledWith(expect.objectContaining({ status: "failed", session: "session", batch: "batch", changes: [expect.objectContaining({ index: expect.objectContaining({ value: "Parcel" }) })] }));
  expect(restored.queueStoreApi.getState().tasks[0]).toMatchObject({ status: "failed", cursor: 0, result: null });
  expect(restored.queueStoreApi.getState().queues[0]).toMatchObject({ pending: 0, failed: 1 });
  expect(JSON.stringify(restored.storeApi.getState().getJSON("session"))).toContain("Parcel");
  expect(next.client.patchIndex).not.toHaveBeenCalled();
  await restored.queueStoreApi.getState().retry(restored.queueStoreApi.getState().tasks[0].id);
  expect(next.client.patchIndex).toHaveBeenCalledOnce();
  expect(next.client.patchIndex).toHaveBeenCalledWith("private-token", "session", "property", expect.objectContaining({ new_index_aspect: "parcel_id" }));
});

it("resumes an acknowledged version by polling rather than resubmitting", async () => {
  const first = await load();
  const config = runtime();
  vi.mocked(config.client.confirmIndex).mockResolvedValue({ status: "processing", data: "", version: 7 });
  first.queueStoreApi.getState().restore("user-one", config);
  first.storeApi.getState().setJSON("session", splitMetadataJSON({ indexes: [{ code: "index", value: "Parcel" }] }));
  await first.queueStoreApi.getState().enqueue({ batch: null, session: "session", segment: "property", action: "confirm", code: "index" }, config);
  await waitFor(() => expect(config.client.patchStatus).toHaveBeenCalled());
  vi.resetModules();
  const restored = await load();
  const next = runtime();
  restored.queueStoreApi.getState().restore("user-one", next);
  await waitFor(() => expect(next.client.patchStatus).toHaveBeenCalledWith("private-token", "session", 7));
  expect(next.client.confirmIndex).not.toHaveBeenCalled();
});

it("keeps queues isolated by owner and clears the approved owner's durable queue", async () => {
  const { queueStoreApi, storeApi } = await load();
  const config = runtime();
  queueStoreApi.getState().restore("one", config);
  storeApi.getState().setJSON("session", splitMetadataJSON({ indexes: [{ code: "index", value: "Value" }] }));
  vi.mocked(config.client.confirmIndex).mockReturnValue(new Promise<never>(() => {}));
  await queueStoreApi.getState().enqueue({ batch: null, session: "session", segment: "party", action: "confirm", code: "index" }, config);
  queueStoreApi.getState().restore("two", runtime());
  expect(queueStoreApi.getState().tasks).toHaveLength(0);
  queueStoreApi.getState().restore("one", runtime());
  expect(queueStoreApi.getState().tasks).toHaveLength(1);
  queueStoreApi.getState().reset();
  vi.resetModules();
  const restored = await load();
  restored.queueStoreApi.getState().restore("one", runtime());
  expect(restored.queueStoreApi.getState().tasks).toHaveLength(0);
});

it("resumes unsent tasks but leaves the interrupted request failed", async () => {
  const first = await load();
  const config = runtime();
  vi.mocked(config.client.confirmIndex).mockReturnValue(new Promise<never>(() => {}));
  first.queueStoreApi.getState().restore("one", config);
  first.storeApi.getState().setJSON("session", splitMetadataJSON({ indexes: [
    { code: "first", value: "First" }, { code: "second", value: "Second" },
  ] }));
  for (const code of ["first", "second"]) {
    await first.queueStoreApi.getState().enqueue({ batch: null, session: "session", segment: "property", action: "confirm", code }, config);
  }
  vi.resetModules();
  const restored = await load();
  const next = runtime();
  vi.mocked(next.client.confirmIndex).mockReturnValue(new Promise<never>(() => {}));
  restored.queueStoreApi.getState().restore("one", next);
  expect(next.client.confirmIndex).toHaveBeenCalledExactlyOnceWith("private-token", "session", "second");
  expect(restored.queueStoreApi.getState().tasks.map((task) => task.status)).toEqual(["failed", "processing"]);
});

it("refreshes metadata without repeating acknowledged changes and removes completed baselines", async () => {
  const first = await load();
  const config = runtime();
  vi.mocked(config.client.confirmIndex).mockResolvedValue({ status: "completed", data: "", version: 7 });
  vi.mocked(config.client.indexData).mockReturnValue(new Promise<never>(() => {}));
  first.queueStoreApi.getState().restore("one", config);
  first.storeApi.getState().setJSON("session", splitMetadataJSON({ indexes: [{ code: "index", value: "Parcel" }] }));
  await first.queueStoreApi.getState().enqueue({ batch: null, session: "session", segment: "property", action: "confirm", code: "index" }, config);
  await waitFor(() => expect(config.client.indexData).toHaveBeenCalledOnce());
  vi.resetModules();
  const restored = await load();
  const next = runtime();
  restored.queueStoreApi.getState().restore("one", next);
  await waitFor(() => expect(restored.queueStoreApi.getState().tasks).toHaveLength(0));
  expect(next.client.indexData).toHaveBeenCalledOnce();
  expect(next.client.confirmIndex).not.toHaveBeenCalled();
  expect(next.client.patchStatus).not.toHaveBeenCalled();
  expect(restored.queueStoreApi.getState().snapshots.one.bases).toEqual({});
});

it("persists refreshed baselines and ignores responses after approved cancellation", async () => {
  const { queueStoreApi, storeApi } = await load();
  const config = runtime();
  let respond!: (value: { status: "completed"; data: string; version: number }) => void;
  vi.mocked(config.client.confirmIndex).mockReturnValue(new Promise((resolve) => { respond = resolve; }));
  queueStoreApi.getState().restore("one", config);
  storeApi.getState().setJSON("session", splitMetadataJSON({ indexes: [{ code: "index", value: "Old" }] }));
  await queueStoreApi.getState().enqueue({ batch: null, session: "session", segment: "property", action: "confirm", code: "index" }, config);
  const metadata = { indexes: [{ code: "index", value: "Fresh" }] };
  queueStoreApi.getState().setMetadata("session", metadata);
  expect(queueStoreApi.getState().snapshots.one.bases.session).toEqual(metadata);
  queueStoreApi.getState().reset();
  respond({ status: "completed", data: "", version: 7 });
  await Promise.resolve();
  expect(config.client.indexData).not.toHaveBeenCalled();
  expect(queueStoreApi.getState().snapshots.one).toEqual({ tasks: [], queues: [], bases: {} });
  expect(JSON.stringify(storeApi.getState().getJSON("session"))).toContain("Fresh");
});
