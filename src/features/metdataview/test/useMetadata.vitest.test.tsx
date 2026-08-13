import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useMetadata } from "../hook/useMetadata";
import { indexStoreApi } from "../store/metadataStore";
import { createDeferredState } from "../../indexing/data/deferredState";
import { storeApi } from "../../../store/state/store";
import type { MetdataActionPayload, MetdataMetadataProps, MetdataMetadataRefresh, MetdataWorkerClient, MetadataPayload } from "../type/metadataView.types";

const segments = {
  ACKNOWLEDGMENT: "acknowledgment",
  COURT: "court",
  ENDORSEMENT: "endorsement",
  FEE: "fee",
  FEEFACTOR: "factor",
  FUND: "fund",
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

function createClient(): MetdataWorkerClient {
  return {
    confirmIndex: vi.fn(async () => ({ data: "", status: "completed" as const, version: 1 })),
    dropIndex: vi.fn(async () => ({ data: "", status: "completed" as const, version: 1 })),
    indexData: vi.fn(async () => baseMetadata),
    patchStatus: vi.fn(async () => ({ data: "", status: "completed" as const, version: 1 })),
    reprocessSegment: vi.fn(async () => ({ data: "", status: "completed" as const })),
  };
}

const choices = [{ level: 1, service: "PartyClauseIndexing" }];

const rowPayload: MetdataActionPayload = {
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
    vi.mocked(client.indexData)
      .mockResolvedValueOnce(baseMetadata)
      .mockResolvedValueOnce({ ...baseMetadata, heading: { title: "Reprocessed" } });

    const props: MetdataMetadataProps = {
      authToken: "token",
      apiGatewayUrl: "https://doc.example.com",
      callbacks: { onActionComplete, onActionError },
      choices,
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
    expect(result.current.choices).toEqual(choices);
    expect(result.current.openSegment).toBe("legal");

    await act(async () => {
      await result.current.onReprocess("party");
    });

    await waitFor(() => expect(client.reprocessSegment).toHaveBeenCalledWith("token", "session-1", "party"));
    await waitFor(() => expect(client.indexData).toHaveBeenCalledTimes(2));
    expect(result.current.openSegment).toBe("party");
    expect(onActionComplete).toHaveBeenCalledWith({ action: "reprocess", segment: "party", session: "session-1" });
    expect(onActionError).not.toHaveBeenCalled();
  });

  it("keeps reprocess progress local until the segment request completes", async () => {
    const client = createClient();
    let complete: (() => void) | undefined;
    vi.mocked(client.reprocessSegment).mockImplementationOnce(() => new Promise<{ data: string; status: "completed" }>((resolve) => {
      complete = () => resolve({ data: "", status: "completed" });
    }));
    const props: MetdataMetadataProps = {
      authToken: "token",
      apiGatewayUrl: "https://doc.example.com",
      callbacks: {},
      choices,
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
    void act(() => {
      void result.current.onReprocess("party");
    });
    await waitFor(() => expect(client.reprocessSegment).toHaveBeenCalledWith("token", "session-1", "party"));
    expect(result.current.reprocessingSegment).toBe("party");

    act(() => complete?.());
    await waitFor(() => expect(result.current.reprocessingSegment).toBeNull());
  });

  it("uses cached metadata without downloading it again", async () => {
    const client = createClient();
    storeApi.getState().setJSON("session-1", {
      chainJSON: {},
      financialJSON: { fees: [], funds: [] },
      headingJSON: { heading: { class: "deed", title: "Warranty Deed" } },
      indexJSON: { indexes: [{ code: "idx-1", segment: "party", value: "Alice" }] },
      legalJSON: {},
      pagesJSON: { pages: { num_of_pages: 1, recordables: [{ code: "page-1", name: "1" }] } },
      secretsJSON: { secrets: [] },
    });
    const onMetadataLoaded = vi.fn();
    const props: MetdataMetadataProps = {
      authToken: "token",
      apiGatewayUrl: "https://doc.example.com",
      callbacks: { onMetadataLoaded },
      choices: null,
      deferredState: createDeferredState(),
      intervalMs: 0,
      onReadyChange: vi.fn(),
      refresh: null,
      segments,
      session: "session-1",
      workerClient: client,
    };

    const { result } = renderHook(() => useMetadata(props));

    await waitFor(() => expect(indexStoreApi.getState().status).toBe("success"));
    expect(client.indexData).not.toHaveBeenCalled();
    expect(result.current.choices).toBeNull();
    expect(onMetadataLoaded).toHaveBeenCalledWith(baseMetadata);
  });

  it("reports a rejecting host load callback as a view error", async () => {
    const client = createClient();
    const onMetadataError = vi.fn();
    const onViewError = vi.fn();
    const props: MetdataMetadataProps = {
      authToken: "token",
      apiGatewayUrl: "https://doc.example.com",
      callbacks: {
        onMetadataError,
        onMetadataLoaded: () => {
          throw new Error("Required choices are missing.");
        },
        onViewError,
      },
      choices: null,
      deferredState: createDeferredState(),
      intervalMs: 0,
      onReadyChange: vi.fn(),
      refresh: null,
      segments,
      session: "session-1",
      workerClient: client,
    };

    renderHook(() => useMetadata(props));

    await waitFor(() => expect(indexStoreApi.getState().status).toBe("error"));
    expect(indexStoreApi.getState().error).toMatchObject({ error: "Required choices are missing." });
    expect(onViewError).toHaveBeenCalledWith(expect.objectContaining({ error: "Required choices are missing." }));
    expect(onMetadataError).toHaveBeenCalledWith(expect.objectContaining({ error: "Required choices are missing." }));
  });

  it("clears prior view actions when switching to cached metadata", async () => {
    const client = createClient();
    const props: Omit<MetdataMetadataProps, "session"> = {
      authToken: "token",
      apiGatewayUrl: "https://doc.example.com",
      callbacks: {},
      choices,
      deferredState: createDeferredState(),
      intervalMs: 0,
      onReadyChange: vi.fn(),
      refresh: null,
      segments,
      workerClient: client,
    };
    const { result, rerender } = renderHook(
      ({ session }: { session: string }) => useMetadata({ ...props, session }),
      { initialProps: { session: "session-1" } },
    );

    await waitFor(() => expect(client.indexData).toHaveBeenCalledTimes(1));
    await act(async () => {
      await result.current.onConfirm(rowPayload);
    });
    expect(result.current.confirmedCodes.has("idx-1")).toBe(true);
    const cached = storeApi.getState().getJSON("session-1");
    if (!cached) throw new Error("Metadata cache was not populated.");
    storeApi.getState().setJSON("session-2", cached);

    rerender({ session: "session-2" });

    await waitFor(() => expect(indexStoreApi.getState().activeSession).toBe("session-2"));
    expect(client.indexData).toHaveBeenCalledTimes(1);
    expect(result.current.confirmedCodes).toEqual(new Set());
  });

  it("reloads metadata once for each matching host refresh event", async () => {
    const client = createClient();
    const onSegmentExpand = vi.fn();
    const props: MetdataMetadataProps = {
      authToken: "token",
      apiGatewayUrl: "https://doc.example.com",
      callbacks: { onSegmentExpand },
      choices,
      deferredState: createDeferredState({ segment: "party", selectedIndex: null }),
      intervalMs: 0,
      onReadyChange: vi.fn(),
      refresh: null,
      segments,
      session: "session-1",
      workerClient: client,
    };
    const { result, rerender } = renderHook(
      ({ refresh }: { refresh: MetdataMetadataRefresh | null }) => useMetadata({ ...props, refresh }),
      { initialProps: { refresh: null } as { refresh: MetdataMetadataRefresh | null } },
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
    const props: MetdataMetadataProps = {
      authToken: "token",
      apiGatewayUrl: "https://doc.example.com",
      callbacks: { onActionComplete },
      choices,
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
    });

    expect(client.confirmIndex).toHaveBeenCalledWith("token", "session-1", "idx-1");
    expect(result.current.confirmedCodes.has("idx-1")).toBe(true);
    expect(onActionComplete).toHaveBeenCalledWith({ action: "confirm", code: "idx-1", session: "session-1" });
  });

  it("waits for the patch status before applying confirm and drop state", async () => {
    const client = createClient();
    vi.mocked(client.confirmIndex).mockResolvedValueOnce({ data: "", status: "processing", version: 3 });
    vi.mocked(client.dropIndex).mockResolvedValueOnce({ data: "", status: "processing", version: 4 });
    vi.mocked(client.patchStatus)
      .mockResolvedValueOnce({ data: "", status: "completed", version: 3 })
      .mockResolvedValueOnce({ data: "", status: "completed", version: 4 });
    const onActionComplete = vi.fn();
    const props: MetdataMetadataProps = {
      authToken: "token",
      apiGatewayUrl: "https://doc.example.com",
      callbacks: { onActionComplete },
      choices,
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
    const props: MetdataMetadataProps = {
      authToken: "token",
      apiGatewayUrl: "https://doc.example.com",
      callbacks: { onActionComplete, onIndexFocus },
      choices,
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

    await act(async () => {
      await result.current.onDrop(rowPayload);
    });

    expect(client.dropIndex).toHaveBeenCalledWith("token", "session-1", "idx-1");
    await waitFor(() => expect(result.current.selectedIndex).toBeNull());
    expect(onIndexFocus).toHaveBeenCalledWith(null);
    expect(onActionComplete).toHaveBeenCalledWith({ action: "drop", code: "idx-1", session: "session-1" });
    expect(result.current.removedCodes.has("idx-1")).toBe(true);
  });

  it("emits action failures for mutation route errors", async () => {
    const client = createClient();
    vi.mocked(client.confirmIndex).mockRejectedValueOnce(Object.assign(new Error("Confirm failed"), { code: "index_confirm_failed", status: 500 }));
    vi.mocked(client.dropIndex).mockRejectedValueOnce(Object.assign(new Error("Drop failed"), { code: "index_drop_failed", status: 500 }));
    vi.mocked(client.reprocessSegment).mockRejectedValueOnce(Object.assign(new Error("Reprocess failed"), { code: "index_reprocess_failed", status: 500 }));

    const onActionComplete = vi.fn();
    const onActionError = vi.fn();
    const props: MetdataMetadataProps = {
      authToken: "token",
      apiGatewayUrl: "https://doc.example.com",
      callbacks: { onActionComplete, onActionError },
      choices,
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
    expect(result.current.reprocessingSegment).toBeNull();
    expect(onActionComplete).not.toHaveBeenCalled();
  });
});
