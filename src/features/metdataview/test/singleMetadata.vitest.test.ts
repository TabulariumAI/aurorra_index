import { afterEach, expect, it, vi } from "vitest";
import { splitMetadataJSON } from "aurora-core";
import { storeApi } from "../../../store/state/store";
import { indexStoreApi } from "../store/metadataStore";
import { queueStoreApi } from "../../queue/store/queueStore";
import { auditStoreApi } from "../../audit/store/auditStore";
import { loadAuditReport } from "../../audit/data/loadAuditReport";
import { requestResource } from "../data/metadataResource";
import { iqStoreApi } from "../../iq/store/iqStore";
import { imageViewerStoreApi } from "../../imageviewer/store/imageViewerStore";
import { editIndexStoreApi } from "../../editindex/store/editIndexStore";
import { addIndexStoreApi } from "../../addindex/store/addIndexStore";
import { pageSegmentsStoreApi } from "../../pagesegments/store/pageSegmentsStore";

afterEach(() => { indexStoreApi.getState().resetMetadata(); vi.unstubAllGlobals(); });

it("retains one metadata document and cannot retrieve the previous session", () => {
  storeApi.getState().setJSON("first", splitMetadataJSON({ heading: { title: "First" } }));
  storeApi.getState().setJSON("second", splitMetadataJSON({ heading: { title: "Second" } }));
  expect(storeApi.getState().getJSON("first")).toBeNull();
  expect(storeApi.getState().getJSON("second")?.headingJSON).toEqual({ heading: { title: "Second" } });
});

it("clears all metadata owners and durable queue data on exit", () => {
  indexStoreApi.getState().setLoading("first");
  storeApi.getState().setJSON("first", splitMetadataJSON({ indexes: [] }));
  queueStoreApi.getState().setEtag("first", "version");
  queueStoreApi.getState().setPath("first", "https://blob/metadata.json");
  queueStoreApi.getState().setPagePath("first", "https://blob/pages.json");
  queueStoreApi.getState().setPageEtag("first", "pages-version");
  auditStoreApi.getState().setLoaded("first", { gaps: [] });
  iqStoreApi.getState().setLoaded("first", { iq_doc: 100, decision: "Pass", gates: [], segments: [], explanation: [] }, "version");
  imageViewerStoreApi.setState({ session: "first", tiffBytes: new ArrayBuffer(1) });
  editIndexStoreApi.getState().open({ session: "first", segment: "party", index: { value: "First" } });
  pageSegmentsStoreApi.getState().reset(["party"]);
  indexStoreApi.getState().resetMetadata();
  expect(storeApi.getState().getJSON("first")).toBeNull();
  expect(queueStoreApi.getState()).toMatchObject({ session: null, etag: null, path: null, pagePath: null, pageEtag: null, tasks: [], queues: [], base: null });
  expect(JSON.stringify(queueStoreApi.persist.getOptions().partialize!(queueStoreApi.getState()))).not.toContain("version");
  expect(auditStoreApi.getState().report).toBeNull();
  expect(iqStoreApi.getState().report).toBeNull();
  expect(imageViewerStoreApi.getState().tiffBytes).toBeNull();
  expect(editIndexStoreApi.getState().request).toBeNull();
  expect(addIndexStoreApi.getState().request).toBeNull();
  expect(pageSegmentsStoreApi.getState()).toMatchObject({ request: null, committed: [], selected: [], error: null });
});

it("does not restore the previous metadata or ETag after switching back", () => {
  indexStoreApi.getState().setLoading("first");
  storeApi.getState().setJSON("first", splitMetadataJSON({ indexes: [] }));
  queueStoreApi.getState().setEtag("first", "first-version");
  indexStoreApi.getState().setLoading("second");
  expect(storeApi.getState().getJSON("first")).toBeNull();
  expect(queueStoreApi.getState()).toMatchObject({ session: "second", etag: null });
  indexStoreApi.getState().setLoading("first");
  expect(storeApi.getState().getJSON("first")).toBeNull();
  expect(queueStoreApi.getState().etag).toBeNull();
});

it("clears the old queue even if the replacement document was stored before view activation", () => {
  indexStoreApi.getState().setLoading("first");
  queueStoreApi.getState().setEtag("first", "first-version");
  storeApi.getState().setJSON("second", splitMetadataJSON({ indexes: [] }));
  indexStoreApi.getState().setLoading("second");
  expect(queueStoreApi.getState()).toMatchObject({ session: "second", etag: null, base: null, tasks: [] });
});

it("ignores a metadata response that arrives after switching sessions", async () => {
  let respond!: () => void;
  class WorkerMock {
    onmessage: ((event: MessageEvent) => void) | null = null;
    postMessage() { respond = () => this.onmessage?.({ data: { ok: true, data: {}, path: "old-path", etag: "old-version" } } as MessageEvent); }
    terminate() {}
  }
  vi.stubGlobal("Worker", WorkerMock);
  indexStoreApi.getState().setLoading("first");
  const { loadMetadata } = await import("../data/metadataClient");
  const pending = loadMetadata({ apiGatewayUrl: "https://gateway", authToken: "token", session: "first" }, null);
  indexStoreApi.getState().setLoading("second");
  respond();
  await pending;
  expect(queueStoreApi.getState()).toMatchObject({ session: "second", etag: null, path: null });
});

it.each([false, true])("ignores a late audit result, failed=%s", async failed => {
  let finish!: () => void;
  indexStoreApi.getState().setLoading("first");
  const pending = loadAuditReport({ session: "first", authToken: "token", background: true,
    workerClient: { loadReport: () => new Promise((resolve, reject) => { finish = () => failed ? reject(new Error("Old failure")) : resolve({ gaps: [] }); }) } } as Parameters<typeof loadAuditReport>[0]);
  indexStoreApi.getState().setLoading("second");
  finish();
  await pending;
  expect(auditStoreApi.getState()).toMatchObject({ activeSession: null, report: null, error: null });
});

it("returns no ETag immediately for a session without one", async () => {
  indexStoreApi.getState().setLoading("first");
  await expect(requestResource({ resource: "metadata_etag" }, "first")).resolves.toBeNull();
});

it("clears the previous ETag when refreshed metadata has none", async () => {
  indexStoreApi.getState().setLoading("current");
  queueStoreApi.getState().setEtag("current", "old-version");
  class WorkerMock {
    onmessage: ((event: MessageEvent) => void) | null = null;
    postMessage() { this.onmessage?.({ data: { ok: true, data: {} } } as MessageEvent); }
    terminate() {}
  }
  vi.stubGlobal("Worker", WorkerMock);
  const { loadMetadata } = await import("../data/metadataClient");
  await loadMetadata({ apiGatewayUrl: "https://gateway", authToken: "token", session: "current" }, null);
  expect(queueStoreApi.getState().etag).toBeNull();
});

it("retains the known ETag when reading its saved metadata URL", async () => {
  indexStoreApi.getState().setLoading("current");
  queueStoreApi.getState().setPath("current", "saved-url");
  queueStoreApi.getState().setEtag("current", "saved-version");
  class WorkerMock {
    onmessage: ((event: MessageEvent) => void) | null = null;
    postMessage() { this.onmessage?.({ data: { ok: true, data: {}, path: "saved-url" } } as MessageEvent); }
    terminate() {}
  }
  vi.stubGlobal("Worker", WorkerMock);
  const { loadMetadata } = await import("../data/metadataClient");
  await loadMetadata({ apiGatewayUrl: "https://gateway", authToken: "token", session: "current" }, "saved-url");
  expect(queueStoreApi.getState().etag).toBe("saved-version");
});

it("does not let another session's background read replace current metadata", async () => {
  indexStoreApi.getState().setLoading("current");
  queueStoreApi.getState().setEtag("current", "current-version");
  class WorkerMock {
    onmessage: ((event: MessageEvent) => void) | null = null;
    postMessage() { this.onmessage?.({ data: { ok: true, data: {}, path: "other-path", etag: "other-version" } } as MessageEvent); }
    terminate() {}
  }
  vi.stubGlobal("Worker", WorkerMock);
  const { loadMetadata } = await import("../data/metadataClient");
  await loadMetadata({ apiGatewayUrl: "https://gateway", authToken: "token", session: "other" }, null);
  expect(queueStoreApi.getState()).toMatchObject({ session: "current", etag: "current-version", path: null });
  expect(indexStoreApi.getState().activeSession).toBe("current");
});
