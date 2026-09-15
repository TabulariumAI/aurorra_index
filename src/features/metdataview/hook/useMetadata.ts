import { queueStoreApi } from "../../queue/store/queueStore";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  composeMetadataJSON,
  getPanelData,
  type MetadataActionPayload,
  type MetadataError,
  type MetadataAction,
} from "aurora-core";
import { indexStoreApi, useIndexStore } from "../store/metadataStore";
import { storeApi, useStore } from "../../../store/state/store";
import type { MetdataMetadataProps } from "../type/metadataView.types";
import { createIndexWorkerClient } from "../worker/metadataWorkerClient";

function toWorkerError(error: unknown, fallback = "Metadata request failed."): MetadataError {
  const candidate = error as { code?: string; details?: unknown; error?: string; message?: string; status?: number };
  return {
    code: candidate.code,
    details: candidate.details,
    error: candidate.error || candidate.message || fallback,
    status: candidate.status,
  };
}

export function useMetadata({
  authToken,
  batchCode,
  apiGatewayUrl,
  callbacks,
  choices,
  deferredState,
  intervalMs,
  onQueueChange,
  refresh,
  retryIntervalMs,
  retryLimit,
  segments,
  session,
  workerClient,
}: MetdataMetadataProps) {
  const callbacksRef = useRef(callbacks);
  const store = useIndexStore();
  const json = useStore((state) => state.getJSON(session));
  const metadata = useMemo(() => composeMetadataJSON(json), [json]);
  const panelData = useMemo(() => (metadata ? getPanelData(metadata) : null), [metadata]);
  const openSegment = store.openSegment;
  const [selectedIndex, setSelectedIndex] = useState(deferredState.selectedIndex);
  const [reprocessingSegment, setReprocessingSegment] = useState<string | null>(null);
  const refreshIdRef = useRef<number | null>(null);
  const client = useMemo(() => workerClient || createIndexWorkerClient({ apiBaseUrl: apiGatewayUrl, onRetry: (attempt) => indexStoreApi.getState().setRetryAttempt(attempt), retryIntervalMs, retryLimit }), [apiGatewayUrl, retryIntervalMs, retryLimit, workerClient]);

  useEffect(() => {
    callbacksRef.current = callbacks;
  }, [callbacks]);

  useEffect(() => () => callbacksRef.current.onViewCanceled?.(), []);

  const loadMetadata = useCallback(
    async (refresh: boolean) => {
      const cached = refresh ? null : composeMetadataJSON(storeApi.getState().getJSON(session));
      if (cached) {
        indexStoreApi.getState().setLoaded(session);
        callbacks.onView?.(cached);
        callbacks.onMetadataLoaded?.(cached);
        return cached;
      }
      indexStoreApi.getState().setLoading(session);
      callbacks.onViewStarted?.();
      try {
        const data = await client.indexData(authToken ?? "", session);
        queueStoreApi.getState().setMetadata(session, data);
        indexStoreApi.getState().setLoaded(session);
        callbacks.onView?.(data);
        callbacks.onMetadataLoaded?.(data);
        if (refresh) callbacks.onRefresh?.(data);
        return data;
      } catch (error) {
        const workerError = toWorkerError(error);
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
        indexStoreApi.setState({ openSegment: refresh.segment });
      })
      .catch(() => undefined);
  }, [loadMetadata, refresh, session]);

  useEffect(() => {
    indexStoreApi.setState({ openSegment: deferredState.segment || segments.PAGE });
    setSelectedIndex(deferredState.selectedIndex);
  }, [deferredState.segment, deferredState.selectedIndex, segments.PAGE, session]);

  useEffect(() => {
    const segment = indexStoreApi.getState().openSegment;
    if (segment) callbacksRef.current.onSegmentExpand?.(segment);
  }, [openSegment, session]);

  const setSectionOpen = useCallback(
    (segment: string, open: boolean) => {
      if (!open) return;
      indexStoreApi.setState({ openSegment: segment });
    },
    [],
  );

  const onDrop = useCallback(async (payload: MetadataActionPayload) => {
    await queueStoreApi.getState().enqueue({ action: "drop", code: payload.code, session, segment: payload.segment!, batch: batchCode },
      { authToken: authToken!, client, intervalMs, onChange: onQueueChange });
    if (selectedIndex?.code === payload.code) {
      setSelectedIndex(null);
      callbacks.onIndexFocus?.(null);
    }
  }, [onQueueChange, authToken, batchCode, callbacks, client, intervalMs, selectedIndex?.code, session]);

  const onConfirm = useCallback(async (payload: MetadataActionPayload) => {
    await queueStoreApi.getState().enqueue({ action: "confirm", code: payload.code, session, segment: payload.segment!, batch: batchCode },
      { authToken: authToken!, client, intervalMs, onChange: onQueueChange });
  }, [onQueueChange, authToken, batchCode, client, intervalMs, session]);

  const onReprocess = useCallback(
    async (segment: string) => {
      const action: MetadataAction = { action: "reprocess", segment, session };
      setReprocessingSegment(segment);
      try {
        try {
          await client.reprocessSegment(authToken ?? "", session, segment);
        } catch (error) {
          const workerError = toWorkerError(error, "Reprocess request failed.");
          callbacks.onActionError?.({ action, error: workerError });
          return;
        }
        try {
          await loadMetadata(true);
          indexStoreApi.setState({ openSegment: segment });
          callbacks.onActionComplete?.(action);
        } catch (error) {
          callbacks.onActionError?.({ action, error: toWorkerError(error, "Metadata refresh failed.") });
        }
      } finally {
        setReprocessingSegment(null);
      }
    },
    [authToken, callbacks, client, loadMetadata, session],
  );

  return {
    choices,
    loadMetadata,
    metadata,
    onConfirm,
    onDrop,
    onReprocess,
    openSegment,
    reprocessingSegment,
    retryAttempt: store.retryAttempt,
    selectedIndex,
    setSectionOpen,
    store,
    panelData,
  };
}
