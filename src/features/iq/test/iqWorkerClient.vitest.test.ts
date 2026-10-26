import { afterEach, describe, expect, it, vi } from "vitest";
import { createIqWorkerClient } from "../worker/iqWorkerClient";
import { queueStoreApi } from "../../queue/store/queueStore";
import { indexStoreApi } from "../../metdataview/store/metadataStore";

afterEach(() => { queueStoreApi.getState().reset(); indexStoreApi.getState().resetView(); vi.unstubAllGlobals(); });
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
        this.onmessage?.({ data: commands.length === 2 ? { ok: true, data: {} } : { ok: false, error: "Failed to fetch" } } as MessageEvent);
      }
      terminate() {}
    }
    vi.stubGlobal("Worker", WorkerMock);
    const worker = createIqWorkerClient({ apiBaseUrl: "https://gateway", onRetry, retryIntervalMs: 0, retryLimit: 5 });
    queueStoreApi.getState().setEtag("first", "metadata-etag");
    await expect(worker.loadReport("token", "first", false)).resolves.toEqual({});
    await expect(worker.ackGate("token", "first", "gate-1")).rejects.toThrow("Failed to fetch");
    expect(commands.map(command => command.type)).toEqual(["iqData", "iqData", "iqAck"]);
    expect(onRetry).toHaveBeenCalledExactlyOnceWith(2);
  });

  it("does not create an IQ worker until the requested metadata eTag arrives", async () => {
    const commands: unknown[] = [];
    class WorkerMock {
      onmessage: ((event: MessageEvent) => void) | null = null;
      postMessage(command: unknown) { commands.push(command); this.onmessage?.({ data: { ok: true, data: {} } } as MessageEvent); }
      terminate() {}
    }
    vi.stubGlobal("Worker", WorkerMock);
    const pending = createIqWorkerClient({ apiBaseUrl: "https://gateway", retryIntervalMs: 0, retryLimit: 5 }).loadReport("token", "waiting", false);
    await Promise.resolve();
    expect(commands).toEqual([]);
    queueStoreApi.getState().setEtag("waiting", "ready-etag");
    await pending;
    expect(commands).toEqual([{ apiBaseUrl: "https://gateway", session: "waiting", token: "token", type: "iqData", etag: "ready-etag" }]);
  });

  it("propagates a metadata failure without issuing an IQ request", async () => {
    const worker = vi.fn();
    vi.stubGlobal("Worker", worker);
    indexStoreApi.getState().setLoading("failed");
    const pending = expect(createIqWorkerClient({ apiBaseUrl: "https://gateway", retryIntervalMs: 0, retryLimit: 5 }).loadReport("token", "failed", false)).rejects.toMatchObject({ error: "Metadata failed" });
    indexStoreApi.getState().setError({ error: "Metadata failed" });
    await pending;
    expect(worker).not.toHaveBeenCalled();
  });
});
