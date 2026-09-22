import { beforeEach, expect, it, vi } from "vitest";
import { waitFor } from "@testing-library/react";
import { composeMetadataJSON, splitMetadataJSON } from "aurora-core";
import { storeApi } from "../../../store/state/store";
import { queueStoreApi } from "../store/queueStore";
import type { QueueRuntime } from "../type/queue.types";

const index = { code: "index", segment: "party", value: "Alice" };
const request = { action: "reprocess" as const, session: "session", batch: "batch", segment: "party" };

function runtime(): QueueRuntime {
  return { authToken: "token", intervalMs: 0, onChange: vi.fn(), client: {
    reprocessSegment: vi.fn(async () => ({ status: "completed" as const, data: "" })),
    indexData: vi.fn(async () => ({ indexes: [index] })),
    patchIndex: vi.fn(), patchStatus: vi.fn(), updatePageSegments: vi.fn(),
    confirmIndex: vi.fn(async () => ({ status: "completed" as const, data: "", version: 1 })),
    dropIndex: vi.fn(async () => ({ status: "completed" as const, data: "", version: 1 })),
  } };
}

beforeEach(() => {
  queueStoreApi.getState().reset();
  storeApi.getState().resetAllState();
  storeApi.getState().setJSON("session", splitMetadataJSON({ indexes: [index] }));
});

it("accepts reprocess behind an index operation and stays pending until metadata refresh completes", async () => {
  const config = runtime();
  let confirm!: () => void;
  vi.mocked(config.client.confirmIndex).mockImplementation(() => new Promise(resolve => {
    confirm = () => resolve({ status: "completed", data: "", version: 1 });
  }));
  await queueStoreApi.getState().enqueue({ ...request, action: "confirm", code: "index" }, config);
  await expect(queueStoreApi.getState().enqueue(request, config)).resolves.toEqual({ status: "accepted" });
  expect(config.client.reprocessSegment).not.toHaveBeenCalled();
  expect(queueStoreApi.getState().tasks[1]).toMatchObject({ status: "queued", changes: [{ action: "reprocess", segment: "party" }] });
  expect(composeMetadataJSON(storeApi.getState().getJSON("session"))?.indexes?.[0].value).toBe("Alice");
  let refresh!: () => void;
  vi.mocked(config.client.indexData).mockImplementationOnce(() => new Promise(resolve => {
    refresh = () => resolve({ indexes: [{ ...index, value: "Reprocessed" }] });
  }));
  confirm();
  await waitFor(() => expect(config.client.indexData).toHaveBeenCalledTimes(1));
  expect(config.client.reprocessSegment).toHaveBeenCalledExactlyOnceWith("token", "session", "party");
  expect(config.client.patchStatus).not.toHaveBeenCalled();
  expect(queueStoreApi.getState().queues[0]).toMatchObject({ pending: 2, completed: 1 });
  refresh();
  await waitFor(() => expect(queueStoreApi.getState().tasks).toHaveLength(0));
  expect(queueStoreApi.getState().queues[0]).toMatchObject({ pending: 0, failed: 0, completed: 2 });
  expect(composeMetadataJSON(storeApi.getState().getJSON("session"))?.indexes?.[0].value).toBe("Reprocessed");
  expect(vi.mocked(config.onChange).mock.calls.filter(([event]) => event.changes.some(change => change.action === "reprocess")).map(([event]) => event.status))
    .toEqual(["queued", "processing", "completed"]);
});

it("retains a failed reprocess for retry or cancel without changing existing metadata", async () => {
  const config = runtime();
  vi.mocked(config.client.reprocessSegment).mockRejectedValue(new Error("Reprocess failed"));
  await queueStoreApi.getState().enqueue(request, config);
  await waitFor(() => expect(queueStoreApi.getState().tasks[0].status).toBe("failed"));
  const id = queueStoreApi.getState().tasks[0].id;
  await queueStoreApi.getState().retry(id);
  await waitFor(() => expect(config.client.reprocessSegment).toHaveBeenCalledTimes(2));
  await waitFor(() => expect(queueStoreApi.getState().tasks[0].status).toBe("failed"));
  expect(queueStoreApi.getState().queues[0]).toMatchObject({ pending: 0, failed: 1, completed: 0 });
  queueStoreApi.getState().cancel(id);
  expect(queueStoreApi.getState().tasks).toHaveLength(0);
  expect(config.client.indexData).not.toHaveBeenCalled();
  expect(composeMetadataJSON(storeApi.getState().getJSON("session"))?.indexes).toEqual([index]);
  expect(vi.mocked(config.onChange).mock.calls.map(([event]) => event.status))
    .toEqual(["queued", "processing", "failed", "retried", "processing", "failed", "canceled"]);
});

it("retries metadata retrieval without repeating successful reprocess", async () => {
  const config = runtime();
  vi.mocked(config.client.indexData).mockRejectedValueOnce(new Error("Refresh failed"));
  await queueStoreApi.getState().enqueue(request, config);
  await waitFor(() => expect(queueStoreApi.getState().tasks[0]).toMatchObject({ status: "failed", cursor: 1 }));
  const id = queueStoreApi.getState().tasks[0].id;
  expect(() => queueStoreApi.getState().cancel(id)).toThrow("A completed change cannot be canceled.");
  await queueStoreApi.getState().retry(id);
  await waitFor(() => expect(queueStoreApi.getState().tasks).toHaveLength(0));
  expect(config.client.reprocessSegment).toHaveBeenCalledOnce();
  expect(config.client.indexData).toHaveBeenCalledTimes(2);
});

it("cancels an unsent reprocess without canceling another task and rejects cancel while processing", async () => {
  const config = runtime();
  vi.mocked(config.client.reprocessSegment).mockReturnValue(new Promise(() => {}));
  await queueStoreApi.getState().enqueue(request, config);
  await queueStoreApi.getState().enqueue({ ...request, segment: "property" }, config);
  const [running, queued] = queueStoreApi.getState().tasks;
  expect(() => queueStoreApi.getState().cancel(running.id)).toThrow("A processing change cannot be canceled.");
  queueStoreApi.getState().cancel(queued.id);
  expect(queueStoreApi.getState().tasks.map(task => task.id)).toEqual([running.id]);
  expect(config.client.reprocessSegment).toHaveBeenCalledOnce();
});

it("reprocesses empty segments and ignores completion after reset", async () => {
  const config = runtime();
  storeApi.getState().setJSON("session", splitMetadataJSON({ indexes: [] }));
  let finish!: () => void;
  vi.mocked(config.client.reprocessSegment).mockImplementation(() => new Promise(resolve => {
    finish = () => resolve({ status: "completed", data: "" });
  }));
  await queueStoreApi.getState().enqueue(request, config);
  queueStoreApi.getState().reset();
  finish();
  await Promise.resolve();
  expect(config.client.indexData).not.toHaveBeenCalled();
  expect(queueStoreApi.getState().queues).toEqual([]);
  expect(composeMetadataJSON(storeApi.getState().getJSON("session"))?.indexes).toEqual([]);
});
