import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useMetadata } from "../hook/useMetadata";
import { indexStoreApi } from "../store/indexStore";
import { createDeferredState } from "../../indexing/data/deferredState";
import { storeApi } from "../../../store/state/store";
import type { IndexActionPayload, IndexMetadataProps, IndexMetadataRefresh, IndexWorkerClient, MetadataPayload } from "../type/metadata.types";

const segments = {
  ACKNOWLEDGMENT: "acknowledgment",
  CHAIN: "chain",
  COURT: "court",
  ENDORSEMENT: "endorsement",
  FEE: "fee",
  FEEFACTOR: "factor",
  FUND: "fund",
  HISTORY: "history",
  LEGAL: "legal",
  MONETARY: "monetary",
  PAGE: "page",
  PARTY: "party",
  PROPERTY: "property",
  REFERENCE: "reference",
  SECRETS: "secrets",
  TITLE: "title",
  TRANSACTION: "transaction",
  VITAL: "vital",
};

const baseMetadata: MetadataPayload = {
  fees: [],
  funds: [],
  heading: { class: "deed", title: "Warranty Deed" },
  indexes: [{ code: "idx-1", segment: "party", value: "Alice" }],
  pages: { num_of_pages: 1, recordables: [{ code: "page-1", name: "1" }] },
  secrets: [],
};

function createClient(): IndexWorkerClient {
  return {
    confirmIndex: vi.fn(async () => ({ data: "", status: "completed" as const, version: 1 })),
    dropIndex: vi.fn(async () => ({ data: "", status: "completed" as const, version: 1 })),
    indexData: vi.fn(async () => baseMetadata),
    patchStatus: vi.fn(async () => ({ data: "", status: "completed" as const, version: 1 })),
    reprocessSegment: vi.fn(async () => ({ data: "", status: "completed" as const })),
  };
}

const rowPayload: IndexActionPayload = {
  code: "idx-1",
  highlightOptions: { scroll: false },
  metadataIndex: null,
  page: 1,
  pageClass: "party",
  pageSegments: [],
  quote: "P:1",
  segment: "party",
  session: "session-1",
  type: "party",
  value: "Alice",
};

describe("useMetadata", () => {
  beforeEach(() => {
    indexStoreApi.getState().resetMetadata();
    storeApi.getState().resetAllState();
  });

  it("reloads metadata and preserves requested segment during reprocess", async () => {
    const client = createClient();
    const onActionComplete = vi.fn();
    const onActionError = vi.fn();
    const onJobEvent = vi.fn();
    vi.mocked(client.indexData)
      .mockResolvedValueOnce(baseMetadata)
      .mockResolvedValueOnce({ ...baseMetadata, heading: { title: "Reprocessed" } });

    const props: IndexMetadataProps = {
      authToken: "token",
      apiGatewayUrl: "https://doc.example.com",
      callbacks: { onActionComplete, onActionError, onJobEvent },
      choices: [],
      deferredState: createDeferredState({ segment: "legal", selectedIndex: null }),
      intervalMs: 0,
      onReadyChange: vi.fn(),
      refresh: null,
      segments,
      session: "session-1",
      workerClient: client,
    };

    const { result } = renderHook(() => useMetadata(props));

    await waitFor(() => expect(client.indexData).toHaveBeenCalledTimes(1));
    onJobEvent.mockClear();
    expect(result.current.openSegment).toBe("legal");

    await act(async () => {
      await result.current.onReprocess("party");
    });

    await waitFor(() => expect(client.reprocessSegment).toHaveBeenCalledWith("token", "session-1", "party"));
    await waitFor(() => expect(client.indexData).toHaveBeenCalledTimes(2));
    expect(result.current.openSegment).toBe("party");
    expect(onActionComplete).toHaveBeenCalledWith({ action: "reprocess", segment: "party", session: "session-1" });
    expect(onActionError).not.toHaveBeenCalled();
    expect(onJobEvent.mock.calls.map(([event]) => event.phase)).toEqual(["started", "completed", "started", "completed"]);
  });

  it("reloads metadata once for each matching host refresh event", async () => {
    const client = createClient();
    const onSegmentExpand = vi.fn();
    const props: IndexMetadataProps = {
      authToken: "token",
      apiGatewayUrl: "https://doc.example.com",
      callbacks: { onSegmentExpand },
      choices: [],
      deferredState: createDeferredState({ segment: "party", selectedIndex: null }),
      intervalMs: 0,
      onReadyChange: vi.fn(),
      refresh: null,
      segments,
      session: "session-1",
      workerClient: client,
    };
    const { result, rerender } = renderHook(
      ({ refresh }: { refresh: IndexMetadataRefresh | null }) => useMetadata({ ...props, refresh }),
      { initialProps: { refresh: null } as { refresh: IndexMetadataRefresh | null } },
    );

    await waitFor(() => expect(client.indexData).toHaveBeenCalledTimes(1));

    rerender({ refresh: { id: 1, segment: "legal", session: "session-1" } });

    await waitFor(() => expect(client.indexData).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(result.current.openSegment).toBe("legal"));
    expect(onSegmentExpand).toHaveBeenCalledWith("legal");

    rerender({ refresh: { id: 1, segment: "legal", session: "session-1" } });
    await act(async () => undefined);
    expect(client.indexData).toHaveBeenCalledTimes(2);

    rerender({ refresh: { id: 2, segment: "party", session: "session-2" } });
    await act(async () => undefined);
    expect(client.indexData).toHaveBeenCalledTimes(2);
  });

  it("marks confirm code state and emits a completion event", async () => {
    const client = createClient();
    const onActionComplete = vi.fn();
    const onJobEvent = vi.fn();
    const props: IndexMetadataProps = {
      authToken: "token",
      apiGatewayUrl: "https://doc.example.com",
      callbacks: { onActionComplete, onJobEvent },
      choices: [],
      deferredState: createDeferredState({ segment: "party", selectedIndex: null }),
      intervalMs: 0,
      onReadyChange: vi.fn(),
      refresh: null,
      segments,
      session: "session-1",
      workerClient: client,
    };

    const { result } = renderHook(() => useMetadata(props));
    await waitFor(() => expect(client.indexData).toHaveBeenCalledTimes(1));
    onJobEvent.mockClear();

    await act(async () => {
      await result.current.onConfirm(rowPayload);
    });

    expect(client.confirmIndex).toHaveBeenCalledWith("token", "session-1", "idx-1");
    expect(result.current.confirmedCodes.has("idx-1")).toBe(true);
    expect(onActionComplete).toHaveBeenCalledWith({ action: "confirm", code: "idx-1", session: "session-1" });
    expect(onJobEvent.mock.calls.map(([event]) => event.phase)).toEqual(["started", "completed"]);
  });

  it("waits for the patch status before applying confirm and drop state", async () => {
    const client = createClient();
    vi.mocked(client.confirmIndex).mockResolvedValueOnce({ data: "", status: "processing", version: 3 });
    vi.mocked(client.dropIndex).mockResolvedValueOnce({ data: "", status: "processing", version: 4 });
    vi.mocked(client.patchStatus)
      .mockResolvedValueOnce({ data: "", status: "completed", version: 3 })
      .mockResolvedValueOnce({ data: "", status: "completed", version: 4 });
    const onActionComplete = vi.fn();
    const props: IndexMetadataProps = {
      authToken: "token",
      apiGatewayUrl: "https://doc.example.com",
      callbacks: { onActionComplete },
      choices: [],
      deferredState: createDeferredState({ segment: "party", selectedIndex: null }),
      intervalMs: 0,
      onReadyChange: vi.fn(),
      refresh: null,
      segments,
      session: "session-1",
      workerClient: client,
    };

    const { result } = renderHook(() => useMetadata(props));
    await waitFor(() => expect(client.indexData).toHaveBeenCalledTimes(1));

    await act(async () => {
      await result.current.onConfirm(rowPayload);
      await result.current.onDrop(rowPayload);
    });

    expect(client.patchStatus).toHaveBeenNthCalledWith(1, "token", "session-1", 3);
    expect(client.patchStatus).toHaveBeenNthCalledWith(2, "token", "session-1", 4);
    expect(result.current.confirmedCodes.has("idx-1")).toBe(true);
    expect(result.current.removedCodes.has("idx-1")).toBe(true);
    expect(onActionComplete).toHaveBeenCalledTimes(2);
  });

  it("clears matching selection on drop and emits completion", async () => {
    const client = createClient();
    const onActionComplete = vi.fn();
    const onIndexFocus = vi.fn();
    const onJobEvent = vi.fn();
    const props: IndexMetadataProps = {
      authToken: "token",
      apiGatewayUrl: "https://doc.example.com",
      callbacks: { onActionComplete, onIndexFocus, onJobEvent },
      choices: [],
      deferredState: createDeferredState({ segment: "party", selectedIndex: { code: "idx-1", segment: "party" } }),
      intervalMs: 0,
      onReadyChange: vi.fn(),
      refresh: null,
      segments,
      session: "session-1",
      workerClient: client,
    };

    const { result } = renderHook(() => useMetadata(props));
    await waitFor(() => expect(client.indexData).toHaveBeenCalledTimes(1));
    onJobEvent.mockClear();

    await act(async () => {
      await result.current.onDrop(rowPayload);
    });

    expect(client.dropIndex).toHaveBeenCalledWith("token", "session-1", "idx-1");
    await waitFor(() => expect(result.current.selectedIndex).toBeNull());
    expect(onIndexFocus).toHaveBeenCalledWith(null);
    expect(onActionComplete).toHaveBeenCalledWith({ action: "drop", code: "idx-1", session: "session-1" });
    expect(result.current.removedCodes.has("idx-1")).toBe(true);
    expect(onJobEvent.mock.calls.map(([event]) => event.phase)).toEqual(["started", "completed"]);
  });

  it("emits action failures for mutation route errors", async () => {
    const client = createClient();
    vi.mocked(client.confirmIndex).mockRejectedValueOnce(Object.assign(new Error("Confirm failed"), { code: "index_confirm_failed", status: 500 }));
    vi.mocked(client.dropIndex).mockRejectedValueOnce(Object.assign(new Error("Drop failed"), { code: "index_drop_failed", status: 500 }));
    vi.mocked(client.reprocessSegment).mockRejectedValueOnce(Object.assign(new Error("Reprocess failed"), { code: "index_reprocess_failed", status: 500 }));

    const onActionComplete = vi.fn();
    const onActionError = vi.fn();
    const onJobEvent = vi.fn();
    const props: IndexMetadataProps = {
      authToken: "token",
      apiGatewayUrl: "https://doc.example.com",
      callbacks: { onActionComplete, onActionError, onJobEvent },
      choices: [],
      deferredState: createDeferredState({ segment: "party", selectedIndex: { code: "idx-1", segment: "party" } }),
      intervalMs: 0,
      onReadyChange: vi.fn(),
      refresh: null,
      segments,
      session: "session-1",
      workerClient: client,
    };

    const { result } = renderHook(() => useMetadata(props));
    await waitFor(() => expect(client.indexData).toHaveBeenCalledTimes(1));
    onJobEvent.mockClear();

    await act(async () => {
      await result.current.onConfirm(rowPayload);
    });
    expect(onActionError).toHaveBeenCalledWith(
      expect.objectContaining({
        action: { action: "confirm", code: "idx-1", session: "session-1" },
        error: expect.objectContaining({ code: "index_confirm_failed", error: "Confirm failed", status: 500 }),
      }),
    );
    await act(async () => {
      await result.current.onDrop(rowPayload);
    });
    expect(onActionError).toHaveBeenCalledWith(
      expect.objectContaining({
        action: { action: "drop", code: "idx-1", session: "session-1" },
        error: expect.objectContaining({ code: "index_drop_failed", error: "Drop failed", status: 500 }),
      }),
    );

    await act(async () => {
      await result.current.onReprocess("party");
    });
    expect(onActionError).toHaveBeenCalledWith(
      expect.objectContaining({
        action: { action: "reprocess", segment: "party", session: "session-1" },
        error: expect.objectContaining({ code: "index_reprocess_failed", error: "Reprocess failed", status: 500 }),
      }),
    );
    expect(onActionComplete).not.toHaveBeenCalled();
    expect(onJobEvent).toHaveBeenLastCalledWith(expect.objectContaining({ message: "Segment reprocessing failed", phase: "failed" }));
  });
});
