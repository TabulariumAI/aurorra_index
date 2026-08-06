import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { composeMetadataJSON, getPanelData, splitMetadataJSON } from "../data/metadataData";
import { indexStoreApi, useIndexStore } from "../store/metadataStore";
import { storeApi, useStore } from "../../../store/state/store";
import type { MetdataActionPayload, MetdataMetadataProps, MetdataPatchResult, MetdataWorkerClient, MetdataWorkerError, MetadataAction } from "../type/metadataView.types";
import { createIndexWorkerClient } from "../worker/metadataWorkerClient";

function toWorkerError(error: unknown, fallback = "Metadata request failed."): MetdataWorkerError {
  const candidate = error as { code?: string; details?: unknown; error?: string; message?: string; status?: number };
  return {
    code: candidate.code,
    details: candidate.details,
    error: candidate.error || candidate.message || fallback,
    status: candidate.status,
  };
}

async function waitForPatch(client: MetdataWorkerClient, token: string, session: string, intervalMs: number, result: MetdataPatchResult): Promise<void> {
  let patch = result;
  while (patch.status === "pending" || patch.status === "processing") {
    await new Promise<void>((resolve) => setTimeout(resolve, intervalMs));
    patch = await client.patchStatus(token, session, patch.version);
  }
  if (patch.status === "error") throw new Error(patch.data || "The refinement patch failed.");
}

export function useMetadata({
  authToken,
  apiGatewayUrl,
  callbacks,
  choices,
  deferredState,
  intervalMs,
  refresh,
  segments,
  session,
  workerClient,
}: MetdataMetadataProps) {
  const callbacksRef = useRef(callbacks);
  const store = useIndexStore();
  const json = useStore((state) => state.getJSON(session));
  const metadata = useMemo(() => composeMetadataJSON(json), [json]);
  const panelData = useMemo(() => (metadata ? getPanelData(metadata) : null), [metadata]);
  const [openSegment, setOpenSegment] = useState<string | null>(deferredState.segment || segments.PAGE);
  const [selectedIndex, setSelectedIndex] = useState(deferredState.selectedIndex);
  const [removedCodes, setRemovedCodes] = useState<Set<string>>(() => new Set());
  const [confirmedCodes, setConfirmedCodes] = useState<Set<string>>(() => new Set());
  const refreshIdRef = useRef<number | null>(null);
  const client = useMemo(() => workerClient || createIndexWorkerClient({ apiBaseUrl: apiGatewayUrl }), [apiGatewayUrl, workerClient]);

  useEffect(() => {
    callbacksRef.current = callbacks;
  }, [callbacks]);

  useEffect(() => () => callbacksRef.current.onViewCanceled?.(), []);

  const loadMetadata = useCallback(
    async (refresh: boolean) => {
      const cached = refresh ? null : composeMetadataJSON(storeApi.getState().getJSON(session));
      if (cached) {
        indexStoreApi.getState().setLoaded(session);
        setRemovedCodes(new Set());
        setConfirmedCodes(new Set());
        callbacks.onView?.(cached);
        callbacks.onMetadataLoaded?.(cached);
        return cached;
      }
      indexStoreApi.getState().setLoading(session);
      callbacks.onViewStarted?.();
      const jobId = crypto.randomUUID();
      callbacks.onJobEvent?.({ jobId, message: "Loading metadata", phase: "started", session });
      try {
        const data = await client.indexData(authToken ?? "", session);
        callbacks.onJobEvent?.({ jobId, message: "Metadata loaded", phase: "completed", session });
        storeApi.getState().setJSON(session, splitMetadataJSON(data));
        indexStoreApi.getState().setLoaded(session);
        setRemovedCodes(new Set());
        setConfirmedCodes(new Set());
        callbacks.onView?.(data);
        callbacks.onMetadataLoaded?.(data);
        if (refresh) callbacks.onRefresh?.(data);
        return data;
      } catch (error) {
        const workerError = toWorkerError(error);
        callbacks.onJobEvent?.({ error: workerError.error, jobId, message: "Metadata load failed", phase: "failed", session });
        indexStoreApi.getState().setError(workerError);
        callbacks.onViewError?.(workerError);
        callbacks.onMetadataError?.(workerError);
        throw workerError;
      }
    },
    [authToken, callbacks, client, session],
  );

  useEffect(() => {
    void loadMetadata(false).catch(() => undefined);
  }, [loadMetadata]);

  useEffect(() => {
    if (!refresh || refresh.session !== session || refresh.id === refreshIdRef.current) return;
    refreshIdRef.current = refresh.id;
    void loadMetadata(true)
      .then(() => {
        setOpenSegment(refresh.segment);
        callbacksRef.current.onSegmentExpand?.(refresh.segment);
      })
      .catch(() => undefined);
  }, [loadMetadata, refresh, session]);

  useEffect(() => {
    setOpenSegment(deferredState.segment || segments.PAGE);
    setSelectedIndex(deferredState.selectedIndex);
  }, [deferredState.segment, deferredState.selectedIndex, segments.PAGE]);

  const setSectionOpen = useCallback(
    (segment: string, open: boolean) => {
      if (!open) return;
      setOpenSegment(segment);
      callbacks.onSegmentExpand?.(segment);
    },
    [callbacks],
  );

  const onDrop = useCallback(
    async (payload: MetdataActionPayload) => {
      const action: MetadataAction = { action: "drop", code: payload.code, session };
      const jobId = crypto.randomUUID();
      callbacks.onJobEvent?.({ jobId, message: "Deleting index", phase: "started", session });
      try {
        const result = await client.dropIndex(authToken ?? "", session, payload.code);
        await waitForPatch(client, authToken ?? "", session, intervalMs, result);
        callbacks.onJobEvent?.({ jobId, message: "Index deleted", phase: "completed", session });
        setRemovedCodes((current) => new Set([...current, payload.code]));
        if (selectedIndex?.code === payload.code) {
          setSelectedIndex(null);
          callbacks.onIndexFocus?.(null);
        }
        callbacks.onActionComplete?.(action);
      } catch (error) {
        const workerError = toWorkerError(error, "Drop index request failed.");
        callbacks.onJobEvent?.({ error: workerError.error, jobId, message: "Index deletion failed", phase: "failed", session });
        callbacks.onActionError?.({ action, error: workerError });
      }
    },
    [authToken, callbacks, client, intervalMs, selectedIndex?.code, session],
  );

  const onConfirm = useCallback(
    async (payload: MetdataActionPayload) => {
      const action: MetadataAction = { action: "confirm", code: payload.code, session };
      const jobId = crypto.randomUUID();
      callbacks.onJobEvent?.({ jobId, message: "Confirming index", phase: "started", session });
      try {
        const result = await client.confirmIndex(authToken ?? "", session, payload.code);
        await waitForPatch(client, authToken ?? "", session, intervalMs, result);
        callbacks.onJobEvent?.({ jobId, message: "Index confirmed", phase: "completed", session });
        setConfirmedCodes((current) => new Set([...current, payload.code]));
        callbacks.onActionComplete?.(action);
      } catch (error) {
        const workerError = toWorkerError(error, "Confirm index request failed.");
        callbacks.onJobEvent?.({ error: workerError.error, jobId, message: "Index confirmation failed", phase: "failed", session });
        callbacks.onActionError?.({ action, error: workerError });
      }
    },
    [authToken, callbacks, client, intervalMs, session],
  );

  const onReprocess = useCallback(
    async (segment: string) => {
      const action: MetadataAction = { action: "reprocess", segment, session };
      const jobId = crypto.randomUUID();
      callbacks.onJobEvent?.({ jobId, message: "Reprocessing segment", phase: "started", session });
      try {
        await client.reprocessSegment(authToken ?? "", session, segment);
        callbacks.onJobEvent?.({ jobId, message: "Segment reprocessed", phase: "completed", session });
      } catch (error) {
        const workerError = toWorkerError(error, "Reprocess request failed.");
        callbacks.onJobEvent?.({ error: workerError.error, jobId, message: "Segment reprocessing failed", phase: "failed", session });
        callbacks.onActionError?.({ action, error: workerError });
        return;
      }
      try {
        await loadMetadata(true);
        setOpenSegment(segment);
        callbacks.onSegmentExpand?.(segment);
        callbacks.onActionComplete?.(action);
      } catch (error) {
        callbacks.onActionError?.({ action, error: toWorkerError(error, "Metadata refresh failed.") });
      }
    },
    [authToken, callbacks, client, loadMetadata, session],
  );

  return {
    confirmedCodes,
    choices,
    loadMetadata,
    metadata,
    onConfirm,
    onDrop,
    onReprocess,
    openSegment,
    removedCodes,
    selectedIndex,
    setSectionOpen,
    store,
    panelData,
  };
}
