import { afterEach, describe, expect, it, vi } from "vitest";
import { createIndexWorkerClient } from "../worker/metadataWorkerClient";
import { queueStoreApi } from "../../queue/store/queueStore";

describe("metadataWorkerClient", () => {
  it("does not save a late metadata path after the queue owner is reset", async () => {
    let complete!: () => void;
    class WorkerMock {
      onmessage: ((event: MessageEvent) => void) | null = null;
      onerror: ((event: ErrorEvent) => void) | null = null;
      postMessage() { complete = () => this.onmessage?.({ data: { ok: true, data: {}, path: "https://blob/old-owner.json?sig=test" } } as MessageEvent); }
      terminate() {}
    }
    vi.stubGlobal("Worker", WorkerMock);
    const client = createIndexWorkerClient({ apiBaseUrl: "https://gateway", retryIntervalMs: 0, retryLimit: 0 });
    const request = client.indexData("token", "session", true);
    queueStoreApi.getState().reset();
    complete();
    await request;
    expect(queueStoreApi.getState().paths).toEqual({});
  });
  it("reuses the saved SAS URL and replaces it only on an explicit refresh", async () => {
    const commands: Array<{ type: string; path: string | null }> = [];
    class WorkerMock {
      onmessage: ((event: MessageEvent) => void) | null = null;
      onerror: ((event: ErrorEvent) => void) | null = null;
      postMessage(command: { type: string; path: string | null }) {
        commands.push(command);
        this.onmessage?.({ data: { ok: true, data: {}, path: command.path ?? "https://blob/metadata.json?sig=test" } } as MessageEvent);
      }
      terminate() {}
    }
    vi.stubGlobal("Worker", WorkerMock);
    queueStoreApi.getState().reset();
    const client = createIndexWorkerClient({ apiBaseUrl: "https://gateway", retryIntervalMs: 0, retryLimit: 0 });
    await client.indexData("token", "session", false);
    await client.indexData("token", "session", false);
    await client.indexData("token", "session", true);
    expect(commands.map(command => command.path)).toEqual([null, "https://blob/metadata.json?sig=test", null]);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("retries metadata read commands after connectivity failures", async () => {
    const commands: Array<{ type: string }> = [];
    const onRetry = vi.fn();
    const attempts = new Map<string, number>();

    class WorkerMock {
      onmessage: ((event: MessageEvent) => void) | null = null;
      onerror: ((event: ErrorEvent) => void) | null = null;

      postMessage(command: { type: string }) {
        commands.push(command);
        const attempt = (attempts.get(command.type) ?? 0) + 1;
        attempts.set(command.type, attempt);
        this.onmessage?.({
          data: attempt === 1
            ? { error: "Failed to fetch", ok: false }
            : { data: {}, ok: true },
        } as MessageEvent);
      }

      terminate() {}
    }
    vi.stubGlobal("Worker", WorkerMock);

    const client = createIndexWorkerClient({ apiBaseUrl: "https://gateway", onRetry, retryIntervalMs: 0, retryLimit: 5 });

    await expect(client.indexData("token", "session-1", false)).resolves.toEqual({});
    await expect(client.patchStatus("token", "session-1", 1)).resolves.toEqual({});
    expect(commands.map((command) => command.type)).toEqual(["indexData", "indexData", "patchStatus", "patchStatus"]);
    expect(onRetry).toHaveBeenCalledTimes(2);
  });

  it("does not retry POST commands after a connectivity failure", async () => {
    const commands: Array<{ type: string }> = [];
    const onRetry = vi.fn();

    class WorkerMock {
      onmessage: ((event: MessageEvent) => void) | null = null;
      onerror: ((event: ErrorEvent) => void) | null = null;

      postMessage(command: { type: string }) {
        commands.push(command);
        this.onmessage?.({ data: { error: "Failed to fetch", ok: false } } as MessageEvent);
      }

      terminate() {}
    }
    vi.stubGlobal("Worker", WorkerMock);

    const client = createIndexWorkerClient({ apiBaseUrl: "https://gateway", onRetry, retryIntervalMs: 0, retryLimit: 5 });

    await expect(client.confirmIndex("token", "session-1", "index-1")).rejects.toThrow("Failed to fetch");
    await expect(client.dropIndex("token", "session-1", "index-1")).rejects.toThrow("Failed to fetch");
    await expect(client.reprocessSegment("token", "session-1", "party")).rejects.toThrow("Failed to fetch");
    expect(commands.map((command) => command.type)).toEqual(["confirmIndex", "dropIndex", "reprocessSegment"]);
    expect(onRetry).not.toHaveBeenCalled();
  });
});
