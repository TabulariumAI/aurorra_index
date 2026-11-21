vi.mock("../../choices/worker/choicesWorkerClient", async importOriginal => ({ ...await importOriginal<typeof import("../../choices/worker/choicesWorkerClient")>(), createSessionDataWorkerClient: () => ({ load: async () => null }) }));
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

it("never exposes a selected session without its supplied ETag", () => {
  const changes: { session: string | null; etag: string | null }[] = [];
  const unsubscribe = queueStoreApi.subscribe(({ session, etag }) => changes.push({ session, etag }));
  try {
    for (const session of ["first", "second", "first"]) {
      selectSession({ session, etag: session + "-version" });
      indexStoreApi.getState().setLoading(session);
      indexStoreApi.getState().setLoaded(session);
    }
    expect(changes.filter(change => change.session !== null).length).toBeGreaterThanOrEqual(3);
    for (const change of changes) if (change.session !== null) expect(change.etag).toBe(change.session + "-version");
  } finally { unsubscribe(); }
});

it("retains loaded and refreshed ETags without publishing metadata mutations", async () => {
  const onQueueChange = vi.fn();
  let etag: string | null = "one";
  const props: MetadataProps = { formatError: (error: unknown) => (error as Error).message,
    apiGatewayUrl: "https://gateway", authToken: "token", batchCode: "batch", callbacks: {},
    deferredState: createDeferredState({}), intervalMs: 0, onQueueChange, refresh: null,
    retryIntervalMs: 0, retryLimit: 0, session: "selected", segments: {
      ACKNOWLEDGMENT: "acknowledgment", ENDORSEMENT: "endorsement", FEE: "fee", FEEFACTOR: "factor",
      FUND: "fund", JUDGMENT: "judgment", LEGAL: "legal", MONETARY: "monetary", PAGE: "page",
      PARTY: "party", PROPERTY: "property", REFERENCE: "reference", SECRETS: "secrets", TITLE: "title",
      TRANSACTION: "transaction", VITAL: "vital",
    },
    workerClient: { indexData: vi.fn(async () => { queueStoreApi.getState().setEtag("selected", etag); return { heading: { title: "Deed" } }; }),
      pagesData: vi.fn(), updatePageSegments: vi.fn(), patchIndex: vi.fn(), confirmIndex: vi.fn(), dropIndex: vi.fn(), patchStatus: vi.fn(), clearSegment: vi.fn(), reprocessSegment: vi.fn() },
  };
  const view = renderHook(() => useMetadata(props));
  await waitFor(() => expect(view.result.current.metadata?.heading?.title).toBe("Deed"));
  expect(queueStoreApi.getState().etag).toBe("one");
  expect(onQueueChange).not.toHaveBeenCalled();
  etag = null;
  await act(async () => { await view.result.current.loadMetadata(true); });
  expect(queueStoreApi.getState().etag).toBeNull();
  expect(onQueueChange).not.toHaveBeenCalled();
  view.unmount();
});
