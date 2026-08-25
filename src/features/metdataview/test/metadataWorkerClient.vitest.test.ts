import { afterEach, describe, expect, it, vi } from "vitest";
import { createIndexWorkerClient } from "../worker/metadataWorkerClient";

describe("metadataWorkerClient", () => {
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

    await expect(client.indexData("token", "session-1")).resolves.toEqual({});
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
