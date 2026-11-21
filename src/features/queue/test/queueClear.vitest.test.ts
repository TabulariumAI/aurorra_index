import { beforeEach, expect, it, vi } from "vitest";
import { waitFor } from "@testing-library/react";
import { composeMetadataJSON, splitMetadataJSON } from "aurora-core";
import { storeApi } from "../../../store/state/store";
import { queueStoreApi } from "../store/queueStore";
import type { QueueRuntime } from "../type/queue.types";

const metadata = { indexes: [
  { code: "property", segment: "property", value: "Parcel 42" },
  { code: "party", segment: "party", value: "Alice" },
], legals: { groups: [{ code: "legal", type: "lot_block", elements: [{ aspect: "lot", value: "7" }] }] } };
const request = { action: "clear" as const, session: "session", batch: "batch", segment: "property" };

function runtime(): QueueRuntime {
  return { formatError: error => (error as Error).message, authToken: "token", intervalMs: 0, onChange: vi.fn(), client: {
    clearSegment: vi.fn(async () => ({ status: "completed" as const, data: "" })),
    indexData: vi.fn(async () => ({ ...metadata, indexes: [metadata.indexes[1]], legals: { groups: [] } })),
    reprocessSegment: vi.fn(), patchIndex: vi.fn(), patchStatus: vi.fn(), pagesData: vi.fn(),
    updatePageSegments: vi.fn(), confirmIndex: vi.fn(), dropIndex: vi.fn(),
  } };
}

beforeEach(() => {
  queueStoreApi.getState().reset();
  storeApi.getState().resetJSON();
  storeApi.getState().setJSON("session", splitMetadataJSON(metadata));
});

it("queues one bulk clear and waits for refresh before removing both property collections", async () => {
  const config = runtime();
  let finish!: () => void;
  vi.mocked(config.client.clearSegment).mockImplementation(() => new Promise(resolve => {
    finish = () => resolve({ status: "completed", data: "" });
  }));
  let refresh!: () => void;
  vi.mocked(config.client.indexData).mockImplementation(() => new Promise(resolve => {
    refresh = () => resolve({ indexes: [metadata.indexes[1]], legals: { groups: [] } });
  }));
  await queueStoreApi.getState().enqueue(request, config);
  expect(queueStoreApi.getState().tasks).toHaveLength(1);
  expect(queueStoreApi.getState().tasks[0].changes).toEqual([{ action: "clear", segment: "property" }]);
  expect(config.client.clearSegment).toHaveBeenCalledExactlyOnceWith("token", "session", "property");
  expect(composeMetadataJSON(storeApi.getState().getJSON("session"))).toMatchObject(metadata);
  finish();
  await waitFor(() => expect(config.client.indexData).toHaveBeenCalledOnce());
  expect(queueStoreApi.getState().queues[0]).toMatchObject({ pending: 1, completed: 0 });
  expect(composeMetadataJSON(storeApi.getState().getJSON("session"))?.legals?.groups).toHaveLength(1);
  refresh();
  await waitFor(() => expect(queueStoreApi.getState().tasks).toHaveLength(0));
  expect(composeMetadataJSON(storeApi.getState().getJSON("session"))).toMatchObject({ indexes: [metadata.indexes[1]], legals: { groups: [] } });
  expect(queueStoreApi.getState().queues[0]).toMatchObject({ pending: 0, completed: 1 });
  for (const method of ["dropIndex", "patchIndex", "patchStatus", "reprocessSegment"] as const) expect(config.client[method]).not.toHaveBeenCalled();
});

it("retries a failed clear as one operation and preserves data on cancellation", async () => {
  const config = runtime();
  vi.mocked(config.client.clearSegment).mockRejectedValueOnce(new Error("Clear failed"));
  await queueStoreApi.getState().enqueue(request, config);
  await waitFor(() => expect(queueStoreApi.getState().tasks[0].status).toBe("failed"));
  expect(composeMetadataJSON(storeApi.getState().getJSON("session"))).toMatchObject(metadata);
  const task = queueStoreApi.getState().tasks[0];
  await queueStoreApi.getState().retry(task.id);
  await waitFor(() => expect(queueStoreApi.getState().tasks).toHaveLength(0));
  expect(config.client.clearSegment).toHaveBeenCalledTimes(2);
  vi.mocked(config.client.clearSegment).mockRejectedValueOnce(new Error("Clear failed"));
  await queueStoreApi.getState().enqueue({ ...request, segment: "party" }, config);
  await waitFor(() => expect(queueStoreApi.getState().tasks[0].status).toBe("failed"));
  queueStoreApi.getState().cancel(queueStoreApi.getState().tasks[0].id);
  expect(queueStoreApi.getState().tasks).toHaveLength(0);
  expect(composeMetadataJSON(storeApi.getState().getJSON("session"))?.indexes).toEqual([metadata.indexes[1]]);
});

it("retries only refresh after an acknowledged clear", async () => {
  const config = runtime();
  vi.mocked(config.client.indexData).mockRejectedValueOnce(new Error("Refresh failed"));
  await queueStoreApi.getState().enqueue(request, config);
  await waitFor(() => expect(queueStoreApi.getState().tasks[0].status).toBe("failed"));
  await queueStoreApi.getState().retry(queueStoreApi.getState().tasks[0].id);
  await waitFor(() => expect(queueStoreApi.getState().tasks).toHaveLength(0));
  expect(config.client.clearSegment).toHaveBeenCalledOnce();
  expect(config.client.indexData).toHaveBeenCalledTimes(2);
});

it("cancels an unsent clear without changing the running operation", async () => {
  const config = runtime();
  vi.mocked(config.client.clearSegment).mockReturnValue(new Promise(() => {}));
  await queueStoreApi.getState().enqueue(request, config);
  await queueStoreApi.getState().enqueue({ ...request, segment: "party" }, config);
  const [running, queued] = queueStoreApi.getState().tasks;
  expect(() => queueStoreApi.getState().cancel(running.id)).toThrow("A processing change cannot be canceled.");
  queueStoreApi.getState().cancel(queued.id);
  expect(queueStoreApi.getState().tasks.map(task => task.id)).toEqual([running.id]);
  expect(config.client.clearSegment).toHaveBeenCalledOnce();
});

it("ignores clear completion after reset and does not refresh the previous session", async () => {
  const config = runtime();
  let finish!: () => void;
  vi.mocked(config.client.clearSegment).mockImplementation(() => new Promise(resolve => {
    finish = () => resolve({ status: "completed", data: "" });
  }));
  await queueStoreApi.getState().enqueue(request, config);
  queueStoreApi.getState().reset();
  finish();
  await Promise.resolve();
  expect(config.client.indexData).not.toHaveBeenCalled();
  expect(composeMetadataJSON(storeApi.getState().getJSON("session"))).toMatchObject(metadata);
});
