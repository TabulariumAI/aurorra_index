import { afterEach, describe, expect, it, vi } from "vitest";
import { createIqWorkerClient } from "../worker/iqWorkerClient";
import { queueStoreApi } from "../../queue/store/queueStore";

afterEach(() => vi.unstubAllGlobals());
describe("iqWorkerClient", () => {
  it("forwards current session metadata etags and omits them for forced refresh", async () => {
    const commands: unknown[] = [];
    class WorkerMock {
      onmessage: ((event: MessageEvent) => void) | null = null;
      postMessage(command: unknown) { commands.push(command); this.onmessage?.({ data: { ok: true, data: {} } } as MessageEvent); }
      terminate() {}
    }
    vi.stubGlobal("Worker", WorkerMock);
    queueStoreApi.setState({ etags: { first: "first-etag", second: "second-etag" } });
    const worker = createIqWorkerClient({ apiBaseUrl: "https://gateway", retryIntervalMs: 0, retryLimit: 5 });
    await worker.loadReport("token", "first", false);
    await worker.loadReport("token", "second", false);
    queueStoreApi.getState().setEtag("first", "latest");
    await worker.loadReport("token", "first", false);
    await worker.loadReport("token", "first", true);
    await worker.loadReport("token", "unloaded", false);
    expect(commands).toEqual(["first-etag", "second-etag", "latest", null, null].map((etag, i) => ({
      apiBaseUrl: "https://gateway", session: ["first", "second", "first", "first", "unloaded"][i], token: "token", type: "iqData", etag,
    })));
  });
  it("retries GET connectivity failures but does not retry gate acknowledgements", async () => {
    const commands: { type: string }[] = [];
    const onRetry = vi.fn();
    class WorkerMock {
      onmessage: ((event: MessageEvent) => void) | null = null;
      postMessage(command: { type: string }) {
        commands.push(command);
        this.onmessage?.({ data: commands.length === 2 ? { ok: true, data: {} } : { ok: false, error: "Failed to fetch" } } as MessageEvent);
      }
      terminate() {}
    }
    vi.stubGlobal("Worker", WorkerMock);
    const worker = createIqWorkerClient({ apiBaseUrl: "https://gateway", onRetry, retryIntervalMs: 0, retryLimit: 5 });
    await expect(worker.loadReport("token", "first", false)).resolves.toEqual({});
    await expect(worker.ackGate("token", "first", "gate-1")).rejects.toThrow("Failed to fetch");
    expect(commands.map(command => command.type)).toEqual(["iqData", "iqData", "iqAck"]);
    expect(onRetry).toHaveBeenCalledExactlyOnceWith(2);
  });
});
