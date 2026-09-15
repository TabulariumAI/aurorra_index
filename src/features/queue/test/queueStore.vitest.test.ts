import { waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { composeMetadataJSON, splitMetadataJSON } from "aurora-core";
import { storeApi } from "../../../store/state/store";
import { queueStoreApi } from "../store/queueStore";
import type { IndexChange, QueueRuntime } from "../type/queue.types";

const index = { code: "index-1", segment: "party", label: "person", aspect: "grantor", value: "Alice", ambiguous: "YES" };
const addition: IndexChange = {
  action: "add", explanation: "P 1 Alice", new_index_label: "person", new_index_aspect: "grantor",
  new_index_value: "Alice", new_index_ambiguous: null, old_index_label: null, old_index_aspect: null, old_index_value: null,
};
const update: IndexChange = { ...addition, action: "update", new_index_value: "Bob", old_index_label: "person", old_index_aspect: "grantor", old_index_value: "Alice" };

function pendingResponse() {
  let resolve!: (value: { data: string; status: "completed"; version: number }) => void;
  const promise = new Promise<{ data: string; status: "completed"; version: number }>((complete) => { resolve = complete; });
  return { promise, resolve };
}
function runtime(): QueueRuntime {
  return {
    onChange: vi.fn(), authToken: "token", intervalMs: 0,
    client: {
      updatePageSegments: vi.fn(async () => undefined),
      patchIndex: vi.fn(async () => ({ data: "", status: "completed" as const, version: 1 })),
      confirmIndex: vi.fn(async () => ({ data: "", status: "completed" as const, version: 1 })),
      dropIndex: vi.fn(async () => ({ data: "", status: "completed" as const, version: 1 })),
      patchStatus: vi.fn(async (_token: string, _session: string, version: number) => ({ data: "", status: "completed" as const, version })),
      indexData: vi.fn(async () => ({ indexes: [index] })),
      reprocessSegment: vi.fn(),
    },
  };
}

function enqueue(changes: IndexChange[], config: QueueRuntime, session = "session-1") {
  return queueStoreApi.getState().enqueue({ session, batch: "batch-1", segment: "party", data: JSON.stringify(changes) }, config);
}

describe("index mutation queue", () => {
  beforeEach(() => {
    queueStoreApi.getState().reset();
    storeApi.getState().resetAllState();
    storeApi.getState().setJSON("session-1", splitMetadataJSON({ indexes: [index] }));
  });

  it("accepts an edit and exposes its local value before the backend responds", async () => {
    const config = runtime();
    const response = pendingResponse();
    vi.mocked(config.client.patchIndex).mockReturnValue(response.promise);
    const task = await enqueue([update], config);
    expect(task.status).toBe("accepted");
    expect(composeMetadataJSON(storeApi.getState().getJSON("session-1"))?.indexes?.[0].value).toBe("Bob");
    expect(queueStoreApi.getState().queues).toEqual([expect.objectContaining({ pending: 1, completed: 0 })]);
    response.resolve({ data: "", status: "completed", version: 1 });
    await waitFor(() => expect(queueStoreApi.getState().queues[0]).toMatchObject({ pending: 0, completed: 1 }));
  });

  it.each(["party", "property", "secrets"])("prepends new %s rows while preserving existing order and cancellation", async (segment) => {
    const config = runtime();
    vi.mocked(config.client.patchIndex).mockReturnValue(pendingResponse().promise);
    const existing = [{ ...index, segment }, { ...index, segment, code: "index-2", value: "Existing second" }];
    const base = { indexes: existing, ...(segment === "party" ? { parties: existing } : {}), ...(segment === "secrets" ? { secrets: existing } : {}) };
    storeApi.getState().setJSON("session-1", splitMetadataJSON(base));
    for (const value of ["First added", "Latest added"]) {
      await queueStoreApi.getState().enqueue({ session: "session-1", batch: "batch-1", segment,
        data: JSON.stringify([{ ...addition, new_index_value: value }]),
      }, config);
    }
    const metadata = composeMetadataJSON(storeApi.getState().getJSON("session-1"))!;
    const expected = ["Latest added", "First added", "Alice", "Existing second"];
    expect(metadata.indexes?.map(item => item.value)).toEqual(expected);
    if (segment === "party") expect(metadata.parties?.map(item => item.value)).toEqual(expected);
    if (segment === "secrets") expect(metadata.secrets?.map(item => item.value)).toEqual(expected);
    const task = queueStoreApi.getState().tasks[1];
    queueStoreApi.getState().cancel(task.id, task.changes[0].code);
    expect(composeMetadataJSON(storeApi.getState().getJSON("session-1"))?.indexes?.map(item => item.value))
      .toEqual(["First added", "Alice", "Existing second"]);
  });

  it("accepts an add with an optional label", async () => {
    const config = runtime();
    const response = pendingResponse();
    vi.mocked(config.client.patchIndex).mockReturnValue(response.promise);

    await enqueue([{ ...addition, new_index_label: "", new_index_value: "Bob" }], config);

    await waitFor(() => expect(config.client.patchIndex).toHaveBeenCalledWith(
      "token",
      "session-1",
      "party",
      expect.objectContaining({ new_index_label: "", new_index_value: "Bob" }),
    ));
    expect(composeMetadataJSON(storeApi.getState().getJSON("session-1"))?.indexes).toContainEqual(expect.objectContaining({
      aspect: "grantor",
      label: "",
      value: "Bob",
    }));
  });

  it("runs tasks and every change within a chat task in order", async () => {
    const config = runtime();
    const response = pendingResponse();
    vi.mocked(config.client.patchIndex).mockReturnValueOnce(response.promise);
    await enqueue([update, { ...update, old_index_value: "Bob", new_index_value: "Carol" }], config);
    await enqueue([{ ...update, old_index_value: "Carol", new_index_value: "Dave" }], config);
    await waitFor(() => expect(config.client.patchIndex).toHaveBeenCalledTimes(1));
    response.resolve({ data: "", status: "completed", version: 1 });
    await waitFor(() => expect(config.client.patchIndex).toHaveBeenCalledTimes(3));
    expect(vi.mocked(config.client.patchIndex).mock.calls.map((call) => call[3].new_index_value)).toEqual(["Bob", "Carol", "Dave"]);
  });

  it("removes failed tasks from the open count without reporting a successful change", async () => {
    const config = runtime();
    vi.mocked(config.client.patchIndex).mockRejectedValueOnce(new Error("Update failed"));
    await enqueue([update], config);
    await waitFor(() => expect(queueStoreApi.getState().tasks[0]).toMatchObject({ status: "failed", error: "Update failed" }));
    expect(queueStoreApi.getState().queues).toEqual([expect.objectContaining({ pending: 0, completed: 0 })]);
    expect(config.client.indexData).not.toHaveBeenCalled();
  });

  it("decrements the open count by exactly one when one of two tasks fails", async () => {
    const config = runtime();
    let fail!: (reason: Error) => void;
    const first = new Promise<{ data: string; status: "completed"; version: number }>((_resolve, reject) => { fail = reject; });
    const second = pendingResponse();
    vi.mocked(config.client.patchIndex).mockReturnValueOnce(first).mockReturnValueOnce(second.promise);
    await enqueue([update], config);
    await enqueue([addition], config);
    expect(queueStoreApi.getState().queues[0]).toMatchObject({ pending: 2, completed: 0 });
    fail(new Error("First change failed"));
    await waitFor(() => expect(queueStoreApi.getState().queues[0]).toMatchObject({ pending: 1, completed: 0 }));
    expect(queueStoreApi.getState().tasks.filter((task) => task.status === "failed")).toHaveLength(1);
    second.resolve({ data: "", status: "completed", version: 2 });
    await waitFor(() => expect(queueStoreApi.getState().queues[0]).toMatchObject({ pending: 0, completed: 1 }));
  });

  it("keeps processing later tasks after failure and counts only successful completions", async () => {
    const config = runtime();
    vi.mocked(config.client.patchIndex).mockRejectedValueOnce(new Error("Update failed"));
    await enqueue([update], config);
    await enqueue([addition], config);
    await waitFor(() => expect(queueStoreApi.getState().queues[0]).toMatchObject({ pending: 0, completed: 1 }));
    expect(queueStoreApi.getState().tasks).toEqual([expect.objectContaining({ status: "failed" })]);
  });

  it("retries a failed task without applying its local addition twice", async () => {
    const config = runtime();
    const response = pendingResponse();
    vi.mocked(config.client.patchIndex).mockRejectedValueOnce(new Error("Add failed")).mockReturnValueOnce(response.promise);
    await enqueue([{ ...addition, new_index_value: "Bob" }], config);
    await waitFor(() => expect(queueStoreApi.getState().tasks[0].status).toBe("failed"));
    const id = queueStoreApi.getState().tasks[0].id;
    await queueStoreApi.getState().retry(id);
    expect(queueStoreApi.getState().queues[0].pending).toBe(1);
    expect(composeMetadataJSON(storeApi.getState().getJSON("session-1"))?.indexes?.filter((item) => item.value === "Bob")).toHaveLength(1);
    response.resolve({ data: "", status: "completed", version: 1 });
    await waitFor(() => expect(queueStoreApi.getState().tasks).toEqual([]));
  });

  it("cancels a failed local edit without changing another task or reporting completion", async () => {
    const config = runtime();
    vi.mocked(config.client.patchIndex).mockRejectedValueOnce(new Error("Update failed"));
    await enqueue([update], config);
    await waitFor(() => expect(queueStoreApi.getState().tasks[0].status).toBe("failed"));
    await queueStoreApi.getState().cancel(queueStoreApi.getState().tasks[0].id, queueStoreApi.getState().tasks[0].changes[0].code);
    expect(queueStoreApi.getState().tasks).toEqual([]);
    expect(composeMetadataJSON(storeApi.getState().getJSON("session-1"))?.indexes?.[0].value).toBe("Alice");
    expect(queueStoreApi.getState().queues[0]).toMatchObject({ pending: 0, completed: 0 });
    expect(config.client.patchIndex).toHaveBeenCalledOnce();
  });

  it("polls an accepted version without resubmitting the mutation", async () => {
    const config = runtime();
    vi.mocked(config.client.patchIndex).mockResolvedValueOnce({ data: "", status: "processing", version: 7 });
    vi.mocked(config.client.patchStatus).mockResolvedValueOnce({ data: "", status: "pending", version: 7 }).mockResolvedValueOnce({ data: "", status: "completed", version: 7 });
    await enqueue([update], config);
    await waitFor(() => expect(queueStoreApi.getState().tasks).toEqual([]));
    expect(config.client.patchIndex).toHaveBeenCalledOnce();
    expect(config.client.patchStatus).toHaveBeenCalledTimes(2);
  });

  it("retains the accepted version when a status request fails so retry only resumes polling", async () => {
    const config = runtime();
    vi.mocked(config.client.patchIndex).mockResolvedValueOnce({ data: "", status: "processing", version: 7 });
    vi.mocked(config.client.patchStatus).mockRejectedValueOnce(new Error("Status unavailable"));
    await enqueue([update], config);
    await waitFor(() => expect(queueStoreApi.getState().tasks[0].status).toBe("failed"));
    await queueStoreApi.getState().retry(queueStoreApi.getState().tasks[0].id);
    await waitFor(() => expect(queueStoreApi.getState().tasks).toEqual([]));
    expect(config.client.patchIndex).toHaveBeenCalledOnce();
  });

  it("rejects malformed chat data without adding a task or changing metadata", async () => {
    const config = runtime();
    await expect(queueStoreApi.getState().enqueue({ session: "session-1", batch: "batch-1", segment: "party", data: "not JSON" }, config)).rejects.toThrow();
    expect(queueStoreApi.getState().tasks).toEqual([]);
    expect(composeMetadataJSON(storeApi.getState().getJSON("session-1"))?.indexes).toEqual([index]);
    expect(config.client.patchIndex).not.toHaveBeenCalled();
  });

  it("isolates metadata and notifications between sessions", async () => {
    const config = runtime();
    storeApi.getState().setJSON("session-2", splitMetadataJSON({ indexes: [{ ...index, value: "Other" }] }));
    vi.mocked(config.client.patchIndex).mockRejectedValueOnce(new Error("Update failed"));
    await enqueue([update], config);
    await waitFor(() => expect(queueStoreApi.getState().tasks[0].status).toBe("failed"));
    expect(composeMetadataJSON(storeApi.getState().getJSON("session-2"))?.indexes?.[0].value).toBe("Other");
    expect(queueStoreApi.getState().queues).toHaveLength(1);
    expect(queueStoreApi.getState().queues[0].session).toBe("session-1");
  });

  it("does not overwrite a later local edit when an earlier task finishes", async () => {
    const config = runtime();
    const first = pendingResponse();
    const second = pendingResponse();
    vi.mocked(config.client.patchIndex).mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
    vi.mocked(config.client.indexData).mockResolvedValueOnce({ indexes: [{ ...index, value: "Bob" }] });
    await enqueue([update], config);
    await enqueue([{ ...update, old_index_value: "Bob", new_index_value: "Carol" }], config);
    first.resolve({ data: "", status: "completed", version: 1 });
    await waitFor(() => expect(config.client.patchIndex).toHaveBeenCalledTimes(2));
    expect(composeMetadataJSON(storeApi.getState().getJSON("session-1"))?.indexes?.[0].value).toBe("Carol");
    second.resolve({ data: "", status: "completed", version: 2 });
    await waitFor(() => expect(queueStoreApi.getState().tasks).toEqual([]));
  });

  it("resumes a multi-change task at its failed change without replaying completed changes", async () => {
    const config = runtime();
    vi.mocked(config.client.patchIndex)
      .mockResolvedValueOnce({ data: "", status: "completed", version: 1 })
      .mockRejectedValueOnce(new Error("Second change failed"));
    await enqueue([addition, update], config);
    await waitFor(() => expect(queueStoreApi.getState().tasks[0].status).toBe("failed"));
    await queueStoreApi.getState().retry(queueStoreApi.getState().tasks[0].id);
    await waitFor(() => expect(queueStoreApi.getState().tasks).toEqual([]));
    expect(vi.mocked(config.client.patchIndex).mock.calls.map((call) => call[3].action)).toEqual(["add", "update", "update"]);
  });
  it("updates enriched party rows as well as raw indexes immediately", async () => {
    const config = runtime();
    vi.mocked(config.client.patchIndex).mockReturnValue(pendingResponse().promise);
    storeApi.getState().setJSON("session-1", splitMetadataJSON({ indexes: [index], parties: [index] }));
    await enqueue([update], config);
    const metadata = composeMetadataJSON(storeApi.getState().getJSON("session-1"));
    expect(metadata?.indexes?.[0].value).toBe("Bob");
    expect(metadata?.parties?.[0].value).toBe("Bob");
  });

  it("ignores completion after resetting the session data", async () => {
    const config = runtime();
    const response = pendingResponse();
    vi.mocked(config.client.patchIndex).mockReturnValue(response.promise);
    await enqueue([update], config);
    queueStoreApi.getState().reset();
    storeApi.getState().resetAllState();
    response.resolve({ data: "", status: "completed", version: 1 });
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(queueStoreApi.getState().queues).toEqual([]);
    expect(storeApi.getState().getJSON("session-1")).toBeNull();
  });

  it("does not resubmit completed changes when metadata retrieval fails", async () => {
    const config = runtime();
    vi.mocked(config.client.indexData).mockRejectedValueOnce(new Error("Metadata unavailable"));
    await enqueue([update], config);
    await waitFor(() => expect(queueStoreApi.getState().tasks[0].status).toBe("failed"));
    await queueStoreApi.getState().retry(queueStoreApi.getState().tasks[0].id);
    await waitFor(() => expect(queueStoreApi.getState().tasks).toEqual([]));
    expect(config.client.patchIndex).toHaveBeenCalledOnce();
    expect(config.client.indexData).toHaveBeenCalledTimes(2);
  });

  it("cancels a queued task without sending it or losing another local change", async () => {
    const config = runtime();
    const first = pendingResponse();
    vi.mocked(config.client.patchIndex).mockReturnValue(first.promise);
    await enqueue([update], config);
    await enqueue([{ ...addition, new_index_value: "Carol" }], config);
    queueStoreApi.getState().cancel(queueStoreApi.getState().tasks[1].id, queueStoreApi.getState().tasks[1].changes[0].code);
    expect(queueStoreApi.getState().queues[0].pending).toBe(1);
    expect(composeMetadataJSON(storeApi.getState().getJSON("session-1"))?.indexes?.map((item) => item.value)).toEqual(["Bob"]);
    first.resolve({ data: "", status: "completed", version: 1 });
    await waitFor(() => expect(queueStoreApi.getState().tasks).toEqual([]));
    expect(config.client.patchIndex).toHaveBeenCalledOnce();
  });

  it("resolves a newly added index code before confirming it", async () => {
    const config = runtime();
    const response = pendingResponse();
    vi.mocked(config.client.patchIndex).mockReturnValueOnce(response.promise);
    vi.mocked(config.client.indexData).mockResolvedValue({ indexes: [index, { ...index, code: "server-code", value: "Bob" }] });
    await enqueue([{ ...addition, new_index_value: "Bob" }], config);
    const code = composeMetadataJSON(storeApi.getState().getJSON("session-1"))!.indexes!.find((item) => item.value === "Bob")!.code!;
    await queueStoreApi.getState().enqueue({ batch: "batch-1", session: "session-1", segment: "party", action: "confirm", code }, config);
    response.resolve({ data: "", status: "completed", version: 1 });
    await waitFor(() => expect(config.client.confirmIndex).toHaveBeenCalledWith("token", "session-1", "server-code"));
  });

  it("preserves unfinished changes during a metadata refresh", async () => {
    const config = runtime();
    vi.mocked(config.client.patchIndex).mockReturnValue(pendingResponse().promise);
    await enqueue([update], config);
    queueStoreApi.getState().setMetadata("session-1", { indexes: [index], heading: { title: "Refreshed" } });
    expect(composeMetadataJSON(storeApi.getState().getJSON("session-1"))).toMatchObject({ indexes: [{ value: "Bob" }], heading: { title: "Refreshed" } });
  });

});

describe("queued row recovery and pages", () => {
  beforeEach(() => { queueStoreApi.getState().reset(); storeApi.getState().resetAllState(); storeApi.getState().setJSON("session-1", splitMetadataJSON({ indexes: [index], pages: { num_of_pages: 1, recordables: [{ code: "page-1", name: "1", segments: ["party"] }] } })); });
  it("keeps a deleted index visible until successful completion", async () => {
    const config = runtime(); const response = pendingResponse();
    vi.mocked(config.client.dropIndex).mockReturnValue(response.promise);
    vi.mocked(config.client.indexData).mockResolvedValue({ indexes: [] });
    await queueStoreApi.getState().enqueue({ session: "session-1", batch: "batch-1", segment: "party", action: "drop", code: index.code }, config);
    expect(composeMetadataJSON(storeApi.getState().getJSON("session-1"))?.indexes).toEqual([index]);
    response.resolve({ status: "completed", data: "", version: 1 });
    await waitFor(() => expect(queueStoreApi.getState().tasks).toHaveLength(0));
    expect(composeMetadataJSON(storeApi.getState().getJSON("session-1"))?.indexes).toEqual([]);
  });
  it("retains failed deletion and removes only the task on cancellation", async () => {
    const config = runtime(); vi.mocked(config.client.dropIndex).mockRejectedValue(new Error("Delete failed"));
    await queueStoreApi.getState().enqueue({ session: "session-1", batch: "batch-1", segment: "party", action: "drop", code: index.code }, config);
    await waitFor(() => expect(queueStoreApi.getState().queues[0]).toMatchObject({ pending: 0, failed: 1, completed: 0 }));
    expect(composeMetadataJSON(storeApi.getState().getJSON("session-1"))?.indexes).toEqual([index]);
    queueStoreApi.getState().cancel(queueStoreApi.getState().tasks[0].id, queueStoreApi.getState().tasks[0].changes[0].code);
    expect(queueStoreApi.getState().queues[0]).toMatchObject({ pending: 0, failed: 0, completed: 0 });
    expect(composeMetadataJSON(storeApi.getState().getJSON("session-1"))?.indexes).toEqual([index]);
  });
  it("applies page segments immediately and processes them behind an index task", async () => {
    const config = runtime(); const response = pendingResponse();
    vi.mocked(config.client.indexData).mockResolvedValue({ indexes: [index], pages: { num_of_pages: 1, recordables: [{ code: "page-1", name: "1", segments: ["legal"] }] } });
    vi.mocked(config.client.patchIndex).mockReturnValue(response.promise);
    await enqueue([update], config);
    await queueStoreApi.getState().enqueue({ session: "session-1", batch: "batch-1", segment: "page", action: "page", code: "page-1", segments: ["legal"] }, config);
    expect(composeMetadataJSON(storeApi.getState().getJSON("session-1"))?.pages?.recordables?.[0].segments).toEqual(["legal"]);
    expect(config.client.updatePageSegments).not.toHaveBeenCalled();
    response.resolve({ status: "completed", data: "", version: 1 });
    await waitFor(() => expect(config.client.updatePageSegments).toHaveBeenCalledWith("token", "session-1", "page-1", ["legal"]));
    await waitFor(() => expect(queueStoreApi.getState().tasks).toHaveLength(0));
    expect(config.client.patchStatus).not.toHaveBeenCalled();
  });
  it("retries failed page changes and restores segments when canceled", async () => {
    const config = runtime(); vi.mocked(config.client.updatePageSegments).mockRejectedValue(new Error("Page failed"));
    await queueStoreApi.getState().enqueue({ session: "session-1", batch: "batch-1", segment: "page", action: "page", code: "page-1", segments: [] }, config);
    await waitFor(() => expect(queueStoreApi.getState().queues[0]).toMatchObject({ pending: 0, failed: 1, completed: 0 }));
    const id = queueStoreApi.getState().tasks[0].id;
    await queueStoreApi.getState().retry(id);
    await waitFor(() => expect(config.client.updatePageSegments).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(queueStoreApi.getState().tasks[0].status).toBe("failed"));
    queueStoreApi.getState().cancel(id, "page-1");
    expect(composeMetadataJSON(storeApi.getState().getJSON("session-1"))?.pages?.recordables?.[0].segments).toEqual(["party"]);
    expect(queueStoreApi.getState().queues[0]).toMatchObject({ pending: 0, failed: 0, completed: 0 });
  });
  it.each(["add", "confirm", "drop", "edit"])("cancel restores the original item after a failed %s", async (action) => {
    const config = runtime();
    for (const method of ["patchIndex", "confirmIndex", "dropIndex"] as const) vi.mocked(config.client[method]).mockRejectedValue(new Error("Failed"));
    if (action === "confirm" || action === "drop") await queueStoreApi.getState().enqueue({ batch: "batch-1", session: "session-1", segment: "party", action, code: index.code }, config);
    else await enqueue([action === "add" ? { ...addition, new_index_value: "Carol" } : update], config);
    await waitFor(() => expect(queueStoreApi.getState().tasks[0].status).toBe("failed"));
    const task = queueStoreApi.getState().tasks[0];
    queueStoreApi.getState().cancel(task.id, task.changes[0].code);
    expect(composeMetadataJSON(storeApi.getState().getJSON("session-1"))?.indexes).toEqual([index]);
    expect(queueStoreApi.getState().tasks).toEqual([]);
  });
  it("cancels only the selected item in a multi-item task", async () => {
    const config = runtime(); vi.mocked(config.client.patchIndex).mockRejectedValue(new Error("Failed"));
    await enqueue([update, { ...addition, new_index_value: "Carol" }], config);
    await waitFor(() => expect(queueStoreApi.getState().tasks[0].status).toBe("failed"));
    const task = queueStoreApi.getState().tasks[0];
    queueStoreApi.getState().cancel(task.id, task.changes[0].code);
    expect(composeMetadataJSON(storeApi.getState().getJSON("session-1"))?.indexes?.map(item => item.value)).toEqual(["Carol", "Alice"]);
    expect(queueStoreApi.getState().tasks[0].changes).toHaveLength(1);
    expect(queueStoreApi.getState().tasks[0].status).toBe("failed");
  });
});
