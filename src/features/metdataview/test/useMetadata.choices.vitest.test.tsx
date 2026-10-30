import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import type { MetadataPayload } from "aurora-core";
import { useMetadata } from "../hook/useMetadata";
import { indexStoreApi } from "../store/metadataStore";
import { createDeferredState } from "../../indexing/data/deferredState";
import type { MetadataClient, MetadataProps } from "../type/metadataView.types";

const worker = vi.hoisted(() => ({ load: vi.fn() }));
vi.mock("../../choices/worker/choicesWorkerClient", () => ({ createSessionDataWorkerClient: () => worker }));
const choices = { items: [{ service: "PartyClauseIndexing", level: 1 }], jurisdiction: "Texas, Harris County" };
const data: MetadataPayload = { heading: { title: "Grant Deed" }, indexes: [], pages: { num_of_pages: 1 } };
const segments = { ACKNOWLEDGMENT: "acknowledgment", JUDGMENT: "judgment", ENDORSEMENT: "endorsement", FEE: "fee", FEEFACTOR: "factor", FUND: "fund", LEGAL: "legal", MONETARY: "monetary", PAGE: "page", PARTY: "party", PROPERTY: "property", REFERENCE: "reference", SECRETS: "secrets", TITLE: "title", TRANSACTION: "transaction", VITAL: "vital" };
function input(indexData: MetadataClient["indexData"]): MetadataProps {
  return { apiGatewayUrl: "https://api", authToken: "token", batchCode: null, callbacks: {}, deferredState: createDeferredState(),
    intervalMs: 0, retryIntervalMs: 0, retryLimit: 1, onQueueChange: vi.fn(), onReadyChange: vi.fn(), refresh: null, segments, session: "s",
    workerClient: { indexData, pagesData: vi.fn(), updatePageSegments: vi.fn(), patchIndex: vi.fn(), confirmIndex: vi.fn(), dropIndex: vi.fn(), patchStatus: vi.fn(), reprocessSegment: vi.fn() } };
}
beforeEach(() => { indexStoreApi.getState().resetMetadata(); worker.load.mockReset(); });

it("starts both requests without waiting and publishes metadata while choices are pending", async () => {
  let finish!: (value: typeof choices) => void;
  worker.load.mockReturnValue(new Promise(resolve => { finish = resolve; }));
  const metadata = vi.fn(async () => data);
  const props = input(metadata);
  const view = renderHook(() => useMetadata(props));
  await waitFor(() => expect(metadata).toHaveBeenCalledOnce());
  expect(worker.load).toHaveBeenCalledExactlyOnceWith("token", "s");
  await waitFor(() => expect(view.result.current.metadata?.heading?.title).toBe("Grant Deed"));
  expect(view.result.current.choices).toBeNull();
  await act(async () => finish(choices));
  expect(view.result.current.choices).toEqual(choices.items);
  expect(view.result.current.jurisdiction).toBe("Texas, Harris County");
});

it.each(["pending", "failed"])("does not block metadata when choices are %s", async outcome => {
  if (outcome === "failed") worker.load.mockRejectedValue(new Error("Choices unavailable"));
  else worker.load.mockResolvedValue(null);
  const props = input(vi.fn(async () => data));
  const view = renderHook(() => useMetadata(props));
  await waitFor(() => expect(view.result.current.store.status).toBe("success"));
  expect(view.result.current.metadata?.heading?.title).toBe("Grant Deed");
  expect(view.result.current.choices).toBeNull();
});

it.each(["reset", "switch"])("discards late choices after session %s", async action => {
  let finish!: (value: typeof choices) => void;
  worker.load.mockReturnValue(new Promise(resolve => { finish = resolve; }));
  const props = input(vi.fn(async () => data));
  renderHook(() => useMetadata(props));
  await waitFor(() => expect(worker.load).toHaveBeenCalledOnce());
  act(() => {
    if (action === "reset") indexStoreApi.getState().resetMetadata();
    else indexStoreApi.getState().selectSession("other");
  });
  await act(async () => finish(choices));
  expect(indexStoreApi.getState().choices).toBeNull();
});
