import { afterEach, describe, expect, it, vi } from "vitest";
import { createIqWorkerClient } from "../worker/iqWorkerClient";

afterEach(() => vi.unstubAllGlobals());
describe("iqWorkerClient", () => {
  it("forwards explicitly supplied metadata ETags and permits an unversioned request", async () => {
    const commands: unknown[] = [];
    class WorkerMock {
      onmessage: ((event: MessageEvent) => void) | null = null;
      postMessage(command: unknown) { commands.push(command); this.onmessage?.({ data: { ok: true, data: { report: {}, metadataEtag: "" } } } as MessageEvent); }
      terminate() {}
    }
    vi.stubGlobal("Worker", WorkerMock);
    const worker = createIqWorkerClient({ apiBaseUrl: "https://gateway", retryIntervalMs: 0, retryLimit: 5 });
    await worker.loadReport("token", "first", "first-etag");
    await worker.loadReport("token", "second", "second-etag");
    await worker.loadReport("token", "first", "latest");
    await worker.loadReport("token", "first", null);
    expect(commands).toEqual(["first-etag", "second-etag", "latest", null].map((etag, i) => ({
      apiBaseUrl: "https://gateway", session: ["first", "second", "first", "first"][i], token: "token", type: "iqData", etag,
    })));
  });
  it("retries GET connectivity failures but does not retry gate acknowledgements", async () => {
    const commands: { type: string }[] = [];
    const onRetry = vi.fn();
    class WorkerMock {
      onmessage: ((event: MessageEvent) => void) | null = null;
      postMessage(command: { type: string }) {
        commands.push(command);
        this.onmessage?.({ data: commands.length === 2 ? { ok: true, data: { report: {}, metadataEtag: "" } } : { ok: false, error: "Failed to fetch" } } as MessageEvent);
      }
      terminate() {}
    }
    vi.stubGlobal("Worker", WorkerMock);
    const worker = createIqWorkerClient({ apiBaseUrl: "https://gateway", onRetry, retryIntervalMs: 0, retryLimit: 5 });
    await expect(worker.loadReport("token", "first", "metadata-etag")).resolves.toEqual({ report: {}, metadataEtag: "" });
    await expect(worker.ackGate("token", "first", "gate-1")).rejects.toThrow("Failed to fetch");
    expect(commands.map(command => command.type)).toEqual(["iqData", "iqData", "iqAck"]);
    expect(onRetry).toHaveBeenCalledExactlyOnceWith(2);
  });

  it("starts IQ immediately without an ETag", async () => {
    const commands: unknown[] = [];
    class WorkerMock {
      onmessage: ((event: MessageEvent) => void) | null = null;
      postMessage(command: unknown) { commands.push(command); this.onmessage?.({ data: { ok: true, data: { report: {}, metadataEtag: "" } } } as MessageEvent); }
      terminate() {}
    }
    vi.stubGlobal("Worker", WorkerMock);
    await createIqWorkerClient({ apiBaseUrl: "https://gateway", retryIntervalMs: 0, retryLimit: 5 }).loadReport("token", "waiting", null);
    expect(commands).toEqual([{ apiBaseUrl: "https://gateway", session: "waiting", token: "token", type: "iqData", etag: null }]);
  });
});
