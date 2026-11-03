import { afterEach, describe, expect, it, vi } from "vitest";
import { createIqWorkerClient } from "../worker/iqWorkerClient";

afterEach(() => vi.unstubAllGlobals());
describe("iqWorkerClient", () => {
  it.each([true, false])("keeps the worker alive through download until its final result, success=%s", async success => {
    let worker!: WorkerMock;
    class WorkerMock {
      onmessage: ((event: MessageEvent) => void) | null = null;
      terminate = vi.fn();
      constructor() { worker = this; }
      postMessage() {}
    }
    vi.stubGlobal("Worker", WorkerMock);
    const onDownload = vi.fn();
    const client = createIqWorkerClient({ apiBaseUrl: "https://gateway", retryIntervalMs: 0, retryLimit: 5, onDownload });
    let settled = false;
    const load = client.loadReport("token", "s", null).then(
      value => { settled = true; return value; },
      error => { settled = true; throw error; },
    );
    worker.onmessage!({ data: { type: "iqDownload" } } as MessageEvent);
    await Promise.resolve();
    expect(onDownload).toHaveBeenCalledOnce();
    expect(settled).toBe(false);
    expect(worker.terminate).not.toHaveBeenCalled();
    worker.onmessage!({ data: success
      ? { ok: true, data: { report: {}, metadataEtag: "source" } }
      : { ok: false, code: "download_failed", error: "Report unavailable", status: 500 } } as MessageEvent);
    if (success) await expect(load).resolves.toEqual({ report: {}, metadataEtag: "source" });
    else await expect(load).rejects.toMatchObject({ code: "download_failed", message: "Report unavailable", status: 500 });
    expect(worker.terminate).toHaveBeenCalledOnce();
  });

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
