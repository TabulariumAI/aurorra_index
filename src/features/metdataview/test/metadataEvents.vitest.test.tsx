import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { createDeferredState } from "../../indexing/data/deferredState";
import { useMetadata } from "../hook/useMetadata";
import { indexStoreApi, selectSession } from "../store/metadataStore";
import { queueStoreApi } from "../../queue/store/queueStore";
import type { MetadataProps } from "../type/metadataView.types";

afterEach(() => indexStoreApi.getState().resetMetadata());

it.each([undefined, null, '"selected-version"'])("accepts the selected session's optional ETag: %s", etag => {
  selectSession({ session: "selected", etag });
  expect(indexStoreApi.getState()).toMatchObject({ activeSession: null, status: "idle" });
  expect(queueStoreApi.getState()).toMatchObject({ session: "selected", etag: etag === undefined ? null : etag });
});

it("emits metadata updates after loading and refreshing through the existing Index event callback", async () => {
  const onQueueChange = vi.fn();
  let etag: string | null = "one";
  const props: MetadataProps = {
    apiGatewayUrl: "https://gateway", authToken: "token", batchCode: "batch", callbacks: {}, choices: [],
    deferredState: createDeferredState({}), intervalMs: 0, onQueueChange, onReadyChange: vi.fn(), refresh: null,
    retryIntervalMs: 0, retryLimit: 0, session: "selected", segments: {
      ACKNOWLEDGMENT: "acknowledgment", ENDORSEMENT: "endorsement", FEE: "fee", FEEFACTOR: "factor",
      FUND: "fund", JUDGMENT: "judgment", LEGAL: "legal", MONETARY: "monetary", PAGE: "page",
      PARTY: "party", PROPERTY: "property", REFERENCE: "reference", SECRETS: "secrets", TITLE: "title",
      TRANSACTION: "transaction", VITAL: "vital",
    },
    workerClient: { indexData: vi.fn(async () => { queueStoreApi.getState().setEtag("selected", etag); return { tags: ["deed"] }; }),
      pagesData: vi.fn(), updatePageSegments: vi.fn(), patchIndex: vi.fn(), confirmIndex: vi.fn(), dropIndex: vi.fn(), patchStatus: vi.fn(), reprocessSegment: vi.fn() },
  };
  const view = renderHook(() => useMetadata(props));
  await waitFor(() => expect(onQueueChange).toHaveBeenCalledWith(expect.objectContaining({ type: "metadata-updated", session: "selected", etag: "one", tags: ["deed"] })));
  etag = null;
  await act(async () => { await view.result.current.loadMetadata(true); });
  expect(onQueueChange).toHaveBeenLastCalledWith(expect.objectContaining({ type: "metadata-updated", session: "selected", etag: null, tags: ["deed"] }));
  view.unmount();
});
