import { afterEach, describe, expect, it, vi } from "vitest";
import { createIqWorkerClient } from "../worker/iqWorkerClient";

describe("iqWorkerClient", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("retries read commands after connectivity failures", async () => {
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

    const client = createIqWorkerClient({ apiBaseUrl: "https://gateway", onRetry, retryIntervalMs: 0, retryLimit: 5 });

    await expect(client.loadReport("token", "session-1")).resolves.toEqual({});
    await expect(client.pollReport("token", "session-1")).resolves.toEqual({});
    expect(commands.map((command) => command.type)).toEqual(["iqData", "iqData", "iqPoll", "iqPoll"]);
    expect(onRetry).toHaveBeenCalledTimes(2);
    expect(onRetry).toHaveBeenNthCalledWith(1, 2);
    expect(onRetry).toHaveBeenNthCalledWith(2, 2);
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

    const client = createIqWorkerClient({ apiBaseUrl: "https://gateway", onRetry, retryIntervalMs: 0, retryLimit: 5 });

    await expect(client.startReport("token", "session-1")).rejects.toThrow("Failed to fetch");
    await expect(client.ackGate("token", "session-1", "gate-1")).rejects.toThrow("Failed to fetch");
    expect(commands.map((command) => command.type)).toEqual(["iqStart", "iqAck"]);
    expect(onRetry).not.toHaveBeenCalled();
  });
});
