import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { indexedDB } from "fake-indexeddb";
import { splitMetadataJSON } from "aurora-core";
import { useMetadata } from "../hook/useMetadata";
import { createDeferredState } from "../../indexing/data/deferredState";
import { storeApi } from "../../../store/state/store";
import { indexStoreApi } from "../store/metadataStore";
import { queueStoreApi } from "../../queue/store/queueStore";
import { auditStoreApi } from "../../audit/store/auditStore";
import type { AuditWorkerClient } from "../../audit/type/audit.types";
import { useUsage } from "../../usage/hook/useUsage";
import { syncUsage } from "../../usage/storage/usageStorage";
import type { UsageCommand } from "../../usage/type/usage.types";
import type { MetdataMetadataProps, MetdataWorkerCommand } from "../type/metadataView.types";

const auditClient = vi.hoisted(() => ({ loadReport: vi.fn<AuditWorkerClient["loadReport"]>() }));
vi.mock("../../audit/worker/auditWorkerClient", () => ({ createAuditWorkerClient: () => auditClient }));
vi.mock("../../pagesegments/worker/pageSegmentsWorkerClient", () => ({ createPageSegmentsWorkerClient: () => ({ pagesData: async () => ({ data: { num_of_pages: 1 }, path: "pages" }) }) }));

const metadata = { tags: ["auto_class:deed", "parcel:123"], heading: { title: "Deed" } };

beforeEach(() => {
  vi.stubGlobal("indexedDB", indexedDB);
  vi.stubGlobal("Worker", class {
    onmessage: ((event: MessageEvent) => void) | null = null;
    postMessage(command: MetdataWorkerCommand | UsageCommand) {
      if ("owner" in command) void syncUsage(command.owner, command.services, command.now).then(data => this.onmessage?.({ data: { ok: true, data } } as MessageEvent));
      else queueMicrotask(() => this.onmessage?.({ data: { ok: true, data: metadata } } as MessageEvent));
    }
    terminate() { this.onmessage = null; }
  });
  auditClient.loadReport.mockReset();
  queueStoreApi.getState().reset();
  indexStoreApi.getState().resetMetadata();
  auditStoreApi.getState().resetAudit();
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

it.each([false, true].flatMap(cached => [false, true].map(failed => ({ cached, failed }))))("loads Audit and updates usage after metadata, cached=$cached, auditFailed=$failed", async ({ cached, failed }) => {
  const owner = `metadata-${cached}-${failed}`;
  const previous = { session: "other", name: "extraction" as const, code: "retained", cost: 1, page_num: 1, timestamp: new Date().toISOString() };
  await syncUsage(owner, [previous], Date.now());
  if (cached) storeApi.getState().setJSON("source", splitMetadataJSON(metadata));
  let finish!: (report: Awaited<ReturnType<AuditWorkerClient["loadReport"]>>) => void;
  let reject!: (error: Error) => void;
  auditClient.loadReport.mockImplementationOnce(() => new Promise((resolve, fail) => { finish = resolve; reject = fail; }));
  const onMetadataLoaded = vi.fn();
  const props: MetdataMetadataProps = {
    apiGatewayUrl: "https://gateway", authToken: "token", session: "source", batchCode: null,
    callbacks: { onMetadataLoaded }, choices: null, deferredState: createDeferredState(), intervalMs: 0,
    onQueueChange: vi.fn(), onReadyChange: vi.fn(), refresh: null, retryIntervalMs: 0, retryLimit: 0,
    segments: { PAGE: "page", TITLE: "title", PARTY: "party", FEE: "fee", FUND: "fund", FEEFACTOR: "factor", LEGAL: "legal", MONETARY: "monetary", PROPERTY: "property", REFERENCE: "reference", SECRETS: "secrets", TRANSACTION: "transaction", VITAL: "vital", ACKNOWLEDGMENT: "acknowledgment", JUDGMENT: "judgment", ENDORSEMENT: "endorsement" },
  };
  const { result } = renderHook(() => ({ metadata: useMetadata(props), usage: useUsage(owner) }));
  await waitFor(() => expect(onMetadataLoaded).toHaveBeenCalledExactlyOnceWith(expect.objectContaining(metadata), "source"));
  expect(result.current.metadata.store.status).toBe("success");
  expect(auditClient.loadReport).toHaveBeenCalledExactlyOnceWith("token", "source");
  await waitFor(() => expect(result.current.usage.records).toEqual([previous]));
  if (failed) {
    act(() => reject(new Error("Audit unavailable")));
    await waitFor(() => expect(auditStoreApi.getState().error?.error).toBe("Audit unavailable"));
    expect(result.current.usage.records).toEqual([previous]);
  } else {
    act(() => finish({ gaps: [], usage: { services: [{ ...previous, code: "current", cost: 2 }] } }));
    await waitFor(() => expect(result.current.usage.records).toEqual(expect.arrayContaining([previous, { ...previous, session: "source", code: "current", cost: 2 }])));
    expect(await syncUsage(owner, [], Date.now())).toEqual(result.current.usage.records);
  }
  expect(result.current.metadata.metadata).toMatchObject(metadata);
  expect(result.current.metadata.store.status).toBe("success");
});
