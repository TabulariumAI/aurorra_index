import { afterEach, describe, expect, it, vi } from "vitest";
import { createIndexWorkerClient } from "../../metdataview/worker/metadataWorkerClient";

describe("IndexWorker add client", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("posts the Add Index command and resolves the patch response", async () => {
    const posted: unknown[] = [];
    const terminate = vi.fn();
    class WorkerMock {
      onmessage: ((event: MessageEvent) => void) | null = null;
      onerror: ((event: ErrorEvent) => void) | null = null;
      constructor(_url: URL, options: WorkerOptions) {
        expect(options).toEqual({ type: "module" });
      }
      postMessage(command: unknown) {
        posted.push(command);
        this.onmessage?.({
          data: {
            data: { data: "", status: "processing", version: 3 },
            ok: true,
          },
        } as MessageEvent);
      }
      terminate() {
        terminate();
      }
    }
    vi.stubGlobal("Worker", WorkerMock);

    const client = createIndexWorkerClient({ apiBaseUrl: "https://gateway", retryIntervalMs: 0, retryLimit: 0 });
    await expect(client.patchIndex("token", "session-1", "party", { action: "add" as const, explanation: "P 3  Selected context", new_index_label: "party", new_index_aspect: "party", new_index_value: "Selected value", new_index_ambiguous: null, old_index_label: null, old_index_aspect: null, old_index_value: null })).resolves.toEqual({ data: "", status: "processing", version: 3 });

    expect(posted).toEqual([{
      apiBaseUrl: "https://gateway",
      change: { action: "add" as const, explanation: "P 3  Selected context", new_index_label: "party", new_index_aspect: "party", new_index_value: "Selected value", new_index_ambiguous: null, old_index_label: null, old_index_aspect: null, old_index_value: null },
      segment: "party",
      session: "session-1",
      token: "token",
      type: "patchIndex",
    }]);
    expect(terminate).toHaveBeenCalledTimes(1);
  });

  it("rejects with the complete worker error", async () => {
    const terminate = vi.fn();
    class WorkerMock {
      onmessage: ((event: MessageEvent) => void) | null = null;
      onerror: ((event: ErrorEvent) => void) | null = null;
      postMessage() {
        this.onmessage?.({
          data: {
            code: "patch_error",
            details: { data: "Index already exists.", status: "error", version: 3 },
            error: "Index already exists.",
            ok: false,
            status: 200,
          },
        } as MessageEvent);
      }
      terminate() {
        terminate();
      }
    }
    vi.stubGlobal("Worker", WorkerMock);

    const client = createIndexWorkerClient({ apiBaseUrl: "https://gateway", retryIntervalMs: 0, retryLimit: 0 });
    await expect(client.patchIndex("token", "session-1", "party", { action: "add" as const, explanation: "P 3  Selected context", new_index_label: "party", new_index_aspect: "party", new_index_value: "Selected value", new_index_ambiguous: null, old_index_label: null, old_index_aspect: null, old_index_value: null })).rejects.toMatchObject({
      code: "patch_error",
      details: { data: "Index already exists.", status: "error", version: 3 },
      message: "Index already exists.",
      status: 200,
    });
    expect(terminate).toHaveBeenCalledTimes(1);
  });

  it("rejects worker runtime errors and terminates the worker", async () => {
    const terminate = vi.fn();
    class WorkerMock {
      onmessage: ((event: MessageEvent) => void) | null = null;
      onerror: ((event: ErrorEvent) => void) | null = null;
      postMessage() {
        this.onerror?.({ message: "Worker crashed" } as ErrorEvent);
      }
      terminate() {
        terminate();
      }
    }
    vi.stubGlobal("Worker", WorkerMock);

    const client = createIndexWorkerClient({ apiBaseUrl: "https://gateway", retryIntervalMs: 0, retryLimit: 0 });
    await expect(client.patchIndex("token", "session-1", "party", { action: "add" as const, explanation: "P 3  Selected context", new_index_label: "party", new_index_aspect: "party", new_index_value: "Selected value", new_index_ambiguous: null, old_index_label: null, old_index_aspect: null, old_index_value: null })).rejects.toThrow("Index worker failed");
    expect(terminate).toHaveBeenCalledTimes(1);
  });
});
