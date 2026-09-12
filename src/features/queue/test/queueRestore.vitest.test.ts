import { beforeEach, expect, it, vi } from "vitest";
import { waitFor } from "@testing-library/react";
import { splitMetadataJSON } from "aurora-core";
import type { QueueRuntime } from "../type/queue.types";

function runtime(): QueueRuntime {
  return { authToken: "private-token", intervalMs: 0, client: {
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
