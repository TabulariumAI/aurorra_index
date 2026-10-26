import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMetadataClient } from "../data/metadataClient";
import { queueStoreApi } from "../../queue/store/queueStore";

import type { MetadataPayload } from "aurora-core";
import { auditStoreApi } from "../../audit/store/auditStore";
import { indexStoreApi } from "../store/metadataStore";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useMetadata } from "../hook/useMetadata";
import { createDeferredState } from "../../indexing/data/deferredState";
import { composeMetadataJSON } from "aurora-core";
import { storeApi } from "../../../store/state/store";
const auditClient = vi.hoisted(() => ({ loadReport: vi.fn(async () => ({ gaps: [] })) }));
vi.mock("../../audit/worker/auditWorkerClient", () => ({ createAuditWorkerClient: () => auditClient }));

const pagesClient = vi.hoisted(() => ({ pagesData: vi.fn(async () => ({ data: { num_of_pages: 0 }, path: "https://blob/pages.json?sig=test", etag: "pages-etag" })), updatePageSegments: vi.fn() }));
vi.mock("../../pagesegments/worker/pageSegmentsWorkerClient", () => ({ createPageSegmentsWorkerClient: () => pagesClient }));
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

describe("metadataClient", () => {
  it("keeps content paths and etags separate from metadata and discards late content after reset", async () => {
    queueStoreApi.getState().reset();
    queueStoreApi.getState().setPath("pages-session", "https://blob/metadata.json");
    queueStoreApi.getState().setEtag("pages-session", "metadata-etag");
    pagesClient.pagesData.mockClear();
    const client = createMetadataClient({ apiBaseUrl: "https://gateway", retryIntervalMs: 0, retryLimit: 0 });
    await client.pagesData("token", "pages-session", true);
    await client.pagesData("token", "pages-session", false);
    expect(pagesClient.pagesData.mock.calls).toEqual([
      ["token", "pages-session", null],
      ["token", "pages-session", "https://blob/pages.json?sig=test"],
    ]);
    expect(queueStoreApi.getState().etags["pages-session"]).toBe("metadata-etag");
    expect(queueStoreApi.getState().pageEtags["pages-session"]).toBe("pages-etag");
    let finish!: (value: { data: { num_of_pages: number }; path: string; etag: string }) => void;
    pagesClient.pagesData.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
    const pending = client.pagesData("token", "pages-session", true);
    queueStoreApi.getState().reset();
    finish({ data: { num_of_pages: 1 }, path: "https://blob/old-owner.json", etag: "old-owner" });
    await pending;
    expect(queueStoreApi.getState().pagePaths).toEqual({});
    expect(queueStoreApi.getState().pageEtags).toEqual({});
  });

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
    const client = createMetadataClient({ apiBaseUrl: "https://gateway", retryIntervalMs: 0, retryLimit: 0 });
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
    const client = createMetadataClient({ apiBaseUrl: "https://gateway", retryIntervalMs: 0, retryLimit: 0 });
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
    const client = createMetadataClient({ apiBaseUrl: "https://gateway", retryIntervalMs: 0, retryLimit: 0 });
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

    const client = createMetadataClient({ apiBaseUrl: "https://gateway", onRetry, retryIntervalMs: 0, retryLimit: 5 });

    await expect(client.indexData("token", "session-1", false)).resolves.toEqual({ pages: { num_of_pages: 0 } });
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

    const client = createMetadataClient({ apiBaseUrl: "https://gateway", onRetry, retryIntervalMs: 0, retryLimit: 5 });

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
  const client = createMetadataClient({ apiBaseUrl: "https://gateway", retryIntervalMs: 0, retryLimit: 0 });
  expect(await client.indexData("token", "s", false)).toEqual({ heading: { title: "NOTICE" }, pages: { num_of_pages: 0 } });
  expect(auditClient.loadReport).toHaveBeenCalledWith("token", "s");
  finish({ gaps: [] });
  await vi.waitFor(() => expect(auditStoreApi.getState().activeSession).toBe("s"));
  await client.indexData("token", "s", true);
  expect(auditClient.loadReport).toHaveBeenCalledTimes(2);
});

it("reports audit failure separately after metadata succeeds", async () => {
  auditClient.loadReport.mockRejectedValueOnce(new Error("Audit unavailable"));
  stubMetadata({ heading: { title: "NOTICE" } });
  const client = createMetadataClient({ apiBaseUrl: "https://gateway", retryIntervalMs: 0, retryLimit: 0 });
  await expect(client.indexData("token", "s", true)).resolves.toEqual({ heading: { title: "NOTICE" }, pages: { num_of_pages: 0 } });
  await vi.waitFor(() => expect(auditStoreApi.getState().error?.error).toBe("Audit unavailable"));
});

it("does not ingest a late audit after the queue owner is reset", async () => {
  let finish!: (report: { gaps: never[] }) => void;
  auditClient.loadReport.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
  stubMetadata({});
  const client = createMetadataClient({ apiBaseUrl: "https://gateway", retryIntervalMs: 0, retryLimit: 0 });
  await client.indexData("token", "s", false);
  queueStoreApi.getState().reset();
  finish({ gaps: [] });
  await Promise.resolve();
  expect(auditStoreApi.getState().report).toBeNull();
});

it("keeps the newer audit when an earlier download finishes last", async () => {
  let finish!: (report: { gaps: never[] }) => void;
  const latest = { gaps: [], usage: { services: [{ name: "extraction" as const, cost: 2, page_num: 1, code: "latest", timestamp: "2026-10-20T00:00:00Z" }] } };
  auditClient.loadReport.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; })).mockResolvedValueOnce(latest);
  stubMetadata({});
  const client = createMetadataClient({ apiBaseUrl: "https://gateway", retryIntervalMs: 0, retryLimit: 0 });
  await client.indexData("token", "s", false);
  await client.indexData("token", "s", true);
  await vi.waitFor(() => expect(auditStoreApi.getState().report).toEqual(latest));
  finish({ gaps: [] });
  await Promise.resolve();
  expect(auditStoreApi.getState().report).toEqual(latest);
});

describe("Pages failure isolation", () => {
  const pageError = Object.assign(new Error("The pages export result could not be decoded: the JSON is incomplete."), {
    code: "content_result_invalid", status: 500, details: { segment: "pages" },
  });
  const metadata = { heading: { title: "Warranty Deed" }, indexes: [{ code: "party-1", segment: "party", value: "Alice" }] };
  const config = { apiBaseUrl: "https://gateway", retryIntervalMs: 0, retryLimit: 1 };

  beforeEach(() => {
    queueStoreApi.getState().reset();
    indexStoreApi.getState().resetMetadata();
    pagesClient.pagesData.mockReset().mockResolvedValue({ data: { num_of_pages: 0 }, path: "https://blob/pages.json", etag: "pages-etag" });
    stubMetadata(metadata);
  });

  it.each([pageError, new Error("Invalid JSON response")])("returns metadata and loads Audit when Pages fails: %s", async error => {
    pagesClient.pagesData.mockRejectedValueOnce(error);
    const client = createMetadataClient(config);
    const result = await client.indexData("token", "first", false);
    expect(result).toEqual(metadata);
    expect(result.pages).toBeUndefined();
    expect(indexStoreApi.getState().pageErrors.first).toMatchObject({ error: error.message });
    expect(indexStoreApi.getState().error).toBeNull();
    expect(auditClient.loadReport).toHaveBeenCalledExactlyOnceWith("token", "first");
    if (error === pageError) expect(indexStoreApi.getState().pageErrors.first).toEqual({ error: error.message, code: "content_result_invalid", details: { segment: "pages" }, status: 500 });
  });

  it("preserves direct Pages rejection and clears only the recovered session error", async () => {
    const client = createMetadataClient(config);
    pagesClient.pagesData.mockRejectedValueOnce(pageError);
    await expect(client.pagesData("token", "first", true)).rejects.toBe(pageError);
    indexStoreApi.getState().setPageError("second", { error: "Other failure" });
    await expect(client.pagesData("token", "first", true)).resolves.toEqual({ num_of_pages: 0 });
    expect(indexStoreApi.getState().pageErrors).toEqual({ second: { error: "Other failure" } });
  });

  it("removes embedded page data when the authoritative Pages export fails", async () => {
    stubMetadata({ ...metadata, pages: { num_of_pages: 7, recordables: [{ code: "stale", name: "7" }] } });
    pagesClient.pagesData.mockRejectedValueOnce(pageError);
    const result = await createMetadataClient(config).indexData("token", "session", true);
    expect(result.pages).toBeUndefined();
    expect(result.indexes).toEqual(metadata.indexes);
  });

  it("still rejects metadata failures", async () => {
    class WorkerMock {
      onmessage: ((event: MessageEvent) => void) | null = null;
      postMessage() { this.onmessage?.({ data: { ok: false, error: "Metadata unavailable", code: "index_error" } } as MessageEvent); }
      terminate() {}
    }
    vi.stubGlobal("Worker", WorkerMock);
    await expect(createMetadataClient(config).indexData("token", "session", false)).rejects.toMatchObject({ message: "Metadata unavailable", code: "index_error" });
  });

  it("does not store a late Pages failure after the queue owner is reset", async () => {
    let fail!: (error: Error) => void;
    pagesClient.pagesData.mockImplementationOnce(() => new Promise((_resolve, reject) => { fail = reject; }));
    const pending = createMetadataClient(config).indexData("token", "old", true);
    queueStoreApi.getState().reset();
    fail(pageError);
    await expect(pending).resolves.toEqual(metadata);
    expect(indexStoreApi.getState().pageErrors).toEqual({});
    expect(auditClient.loadReport).not.toHaveBeenCalled();
  });

  it.each(["resetMetadata", "invalidateSession"] as const)("discards a late Pages failure after %s", async reset => {
    let fail!: (error: Error) => void;
    pagesClient.pagesData.mockImplementationOnce(() => new Promise((_resolve, reject) => { fail = reject; }));
    const pending = createMetadataClient(config).indexData("token", "first", true);
    if (reset === "invalidateSession") indexStoreApi.getState().invalidateSession("first");
    else indexStoreApi.getState().resetMetadata();
    fail(pageError);
    await pending;
    expect(indexStoreApi.getState().pageErrors).toEqual({});
  });

  it("keeps the latest Pages error when an earlier request succeeds last", async () => {
    let finish!: (value: { data: { num_of_pages: number }; path: string; etag: string }) => void;
    pagesClient.pagesData.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; })).mockRejectedValueOnce(pageError);
    const client = createMetadataClient(config);
    const earlier = client.indexData("token", "first", true);
    await client.indexData("token", "first", true);
    finish({ data: { num_of_pages: 1 }, path: "https://blob/earlier.json", etag: "earlier" });
    await earlier;
    expect(indexStoreApi.getState().pageErrors.first?.code).toBe("content_result_invalid");
  });

  it("discards an earlier Pages failure when a newer request succeeds first", async () => {
    let fail!: (error: Error) => void;
    pagesClient.pagesData.mockImplementationOnce(() => new Promise((_resolve, reject) => { fail = reject; }));
    const client = createMetadataClient(config);
    const earlier = client.indexData("token", "first", true);
    await client.indexData("token", "first", true);
    fail(pageError);
    await earlier;
    expect(indexStoreApi.getState().pageErrors).toEqual({});
  });

  it("keeps view callbacks successful, clears cached pages on failed refresh, and recovers", async () => {
    const client = createMetadataClient(config);
    const onViewError = vi.fn();
    const onMetadataError = vi.fn();
    const onMetadataLoaded = vi.fn();
    const onRefresh = vi.fn();
    const props: Parameters<typeof useMetadata>[0] = {
      apiGatewayUrl: config.apiBaseUrl, authToken: "token", batchCode: null,
      callbacks: { onViewError, onMetadataError, onMetadataLoaded, onRefresh }, choices: [],
      deferredState: createDeferredState({}), intervalMs: 0, onQueueChange: vi.fn(), onReadyChange: vi.fn(),
      refresh: null, retryIntervalMs: 0, retryLimit: 1, session: "first", workerClient: client,
      segments: {
        ACKNOWLEDGMENT: "acknowledgment", ENDORSEMENT: "endorsement", FEE: "fee", FEEFACTOR: "factor",
        FUND: "fund", JUDGMENT: "judgment", LEGAL: "legal", MONETARY: "monetary", PAGE: "page",
        PARTY: "party", PROPERTY: "property", REFERENCE: "reference", SECRETS: "secrets", TITLE: "title",
        TRANSACTION: "transaction", VITAL: "vital",
      },
    };
    const view = renderHook(() => useMetadata(props));
    await waitFor(() => expect(view.result.current.store.status).toBe("success"));
    expect(view.result.current.metadata?.pages).toEqual({ num_of_pages: 0 });
    pagesClient.pagesData.mockRejectedValueOnce(pageError);
    await act(async () => { await view.result.current.loadMetadata(true); });
    expect(view.result.current.store.status).toBe("success");
    expect(view.result.current.pageError).toMatchObject({ code: "content_result_invalid" });
    expect(composeMetadataJSON(storeApi.getState().getJSON("first"))?.pages).toBeUndefined();
    expect(onViewError).not.toHaveBeenCalled();
    expect(onMetadataError).not.toHaveBeenCalled();
    expect(onRefresh).toHaveBeenCalledWith(expect.objectContaining(metadata));
    expect(onMetadataLoaded).toHaveBeenCalledWith(expect.objectContaining(metadata), "first");
    await act(async () => { await view.result.current.loadMetadata(false); });
    expect(view.result.current.pageError).toMatchObject({ code: "content_result_invalid" });
    await act(async () => { await view.result.current.loadMetadata(true); });
    expect(view.result.current.pageError).toBeUndefined();
    expect(view.result.current.metadata?.pages).toEqual({ num_of_pages: 0 });
    let finish!: (value: { data: { num_of_pages: number }; path: string; etag: string }) => void;
    pagesClient.pagesData.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
    let refreshing!: ReturnType<typeof client.indexData>;
    await act(async () => {
      refreshing = view.result.current.loadMetadata(true);
      await view.result.current.loadMetadata(false);
    });
    await act(async () => {
      finish({ data: { num_of_pages: 2 }, path: "https://blob/refreshed.json", etag: "refreshed" });
      await refreshing;
    });
    expect(view.result.current.metadata?.pages).toEqual({ num_of_pages: 2 });
    let fail!: (error: Error) => void;
    pagesClient.pagesData.mockImplementationOnce(() => new Promise((_resolve, reject) => { fail = reject; }));
    let earlier!: ReturnType<typeof client.indexData>;
    await act(async () => {
      earlier = view.result.current.loadMetadata(true);
      await view.result.current.loadMetadata(true);
    });
    await act(async () => { fail(pageError); await earlier; });
    expect(view.result.current.metadata?.pages).toEqual({ num_of_pages: 0 });
    expect(view.result.current.pageError).toBeUndefined();
    view.unmount();
  });
});
