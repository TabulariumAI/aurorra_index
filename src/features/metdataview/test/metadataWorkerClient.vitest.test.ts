import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createIndexWorkerClient } from "../worker/metadataWorkerClient";
import { queueStoreApi } from "../../queue/store/queueStore";

import type { MetadataPayload } from "aurora-core";
import { auditStoreApi } from "../../audit/store/auditStore";
const auditClient = vi.hoisted(() => ({ loadReport: vi.fn(async () => ({ gaps: [] })) }));
vi.mock("../../audit/worker/auditWorkerClient", () => ({ createAuditWorkerClient: () => auditClient }));

afterEach(() => vi.unstubAllGlobals());
function stubMetadata(data: MetadataPayload) {
  class WorkerMock {
    onmessage: ((event: MessageEvent) => void) | null = null;
    postMessage() { this.onmessage?.({ data: { ok: true, data } } as MessageEvent); }
    terminate() {}
  }
  vi.stubGlobal("Worker", WorkerMock);
}

beforeEach(() => { auditClient.loadReport.mockReset().mockResolvedValue({ gaps: [] }); auditStoreApi.getState().resetAudit(); });

describe("metadataWorkerClient", () => {
  it("stores metadata etags by session and replaces them on refresh", async () => {
    let etag = "first";
    class WorkerMock {
      onmessage: ((event: MessageEvent) => void) | null = null;
      postMessage(command: { session: string }) {
        this.onmessage?.({ data: { ok: true, data: {}, path: `https://blob/${command.session}.json`, etag } } as MessageEvent);
      }
      terminate() {}
    }
    vi.stubGlobal("Worker", WorkerMock);
    queueStoreApi.getState().reset();
    const client = createIndexWorkerClient({ apiBaseUrl: "https://gateway", retryIntervalMs: 0, retryLimit: 0 });
    await client.indexData("token", "session-1", true);
    etag = "second";
    await client.indexData("token", "session-2", true);
    expect(queueStoreApi.getState().etags).toEqual({ "session-1": "first", "session-2": "second" });
    await client.indexData("token", "session-1", true);
    expect(queueStoreApi.getState().etags["session-1"]).toBe("second");
    queueStoreApi.getState().reset();
    expect(queueStoreApi.getState().etags).toEqual({});
  });
  it("does not save a late metadata path after the queue owner is reset", async () => {
    let complete!: () => void;
    class WorkerMock {
      onmessage: ((event: MessageEvent) => void) | null = null;
      onerror: ((event: ErrorEvent) => void) | null = null;
      postMessage() { complete = () => this.onmessage?.({ data: { ok: true, data: {}, path: "https://blob/old-owner.json?sig=test", etag: "old-owner-etag" } } as MessageEvent); }
      terminate() {}
    }
    vi.stubGlobal("Worker", WorkerMock);
    const client = createIndexWorkerClient({ apiBaseUrl: "https://gateway", retryIntervalMs: 0, retryLimit: 0 });
    const request = client.indexData("token", "session", true);
    queueStoreApi.getState().reset();
    complete();
    await request;
    expect(queueStoreApi.getState().paths).toEqual({});
    expect(queueStoreApi.getState().etags).toEqual({});
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

it("loads fresh audit on index completion and refresh without waiting to display metadata", async () => {
  let finish!: (report: { gaps: never[] }) => void;
  auditClient.loadReport.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
  stubMetadata({ heading: { title: "NOTICE" } });
  const client = createIndexWorkerClient({ apiBaseUrl: "https://gateway", retryIntervalMs: 0, retryLimit: 0 });
  expect(await client.indexData("token", "s", false)).toEqual({ heading: { title: "NOTICE" } });
  expect(auditClient.loadReport).toHaveBeenCalledWith("token", "s");
  finish({ gaps: [] });
  await vi.waitFor(() => expect(auditStoreApi.getState().activeSession).toBe("s"));
  await client.indexData("token", "s", true);
  expect(auditClient.loadReport).toHaveBeenCalledTimes(2);
});

it("reports audit failure separately after metadata succeeds", async () => {
  auditClient.loadReport.mockRejectedValueOnce(new Error("Audit unavailable"));
  stubMetadata({ heading: { title: "NOTICE" } });
  const client = createIndexWorkerClient({ apiBaseUrl: "https://gateway", retryIntervalMs: 0, retryLimit: 0 });
  await expect(client.indexData("token", "s", true)).resolves.toEqual({ heading: { title: "NOTICE" } });
  await vi.waitFor(() => expect(auditStoreApi.getState().error?.error).toBe("Audit unavailable"));
});

it("does not ingest a late audit after the queue owner is reset", async () => {
  let finish!: (report: { gaps: never[] }) => void;
  auditClient.loadReport.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
  stubMetadata({});
  const client = createIndexWorkerClient({ apiBaseUrl: "https://gateway", retryIntervalMs: 0, retryLimit: 0 });
  await client.indexData("token", "s", false);
  queueStoreApi.getState().reset();
  finish({ gaps: [] });
  await Promise.resolve();
  expect(auditStoreApi.getState().report).toBeNull();
});

it("keeps the newer audit when an earlier download finishes last", async () => {
  let finish!: (report: { gaps: never[] }) => void;
  const latest = { gaps: [], usage: { costs: ["$2.0000"] } };
  auditClient.loadReport.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; })).mockResolvedValueOnce(latest);
  stubMetadata({});
  const client = createIndexWorkerClient({ apiBaseUrl: "https://gateway", retryIntervalMs: 0, retryLimit: 0 });
  await client.indexData("token", "s", false);
  await client.indexData("token", "s", true);
  await vi.waitFor(() => expect(auditStoreApi.getState().report).toEqual(latest));
  finish({ gaps: [] });
  await Promise.resolve();
  expect(auditStoreApi.getState().report).toEqual(latest);
});
