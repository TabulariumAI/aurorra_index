import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { composeMetadataJSON, getPanelData, splitMetadataJSON } from "../data/metadataData";
import { indexStoreApi, useIndexStore } from "../store/indexStore";
import { storeApi, useStore } from "../../../store/state/store";
import type { IndexActionPayload, IndexMetadataProps, IndexWorkerError, MetadataAction } from "../type/metadata.types";
import { createIndexWorkerClient } from "../worker/indexWorkerClient";

function toWorkerError(error: unknown, fallback = "Metadata request failed."): IndexWorkerError {
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
  apiGatewayUrl,
  callbacks,
  deferredState,
  segments,
  session,
  workerClient,
}: IndexMetadataProps) {
  const callbacksRef = useRef(callbacks);
  const store = useIndexStore();
  const json = useStore((state) => state.getJSON(session));
  const metadata = useMemo(() => composeMetadataJSON(json), [json]);
  const panelData = useMemo(() => (metadata ? getPanelData(metadata) : null), [metadata]);
  const [openSegment, setOpenSegment] = useState<string | null>(deferredState.segment || segments.PAGE);
  const [selectedIndex, setSelectedIndex] = useState(deferredState.selectedIndex);
  const [removedCodes, setRemovedCodes] = useState<Set<string>>(() => new Set());
  const [confirmedCodes, setConfirmedCodes] = useState<Set<string>>(() => new Set());
  const client = useMemo(() => workerClient || createIndexWorkerClient({ apiBaseUrl: apiGatewayUrl }), [apiGatewayUrl, workerClient]);

  useEffect(() => {
    callbacksRef.current = callbacks;
  }, [callbacks]);

  useEffect(() => () => callbacksRef.current.onViewCanceled?.(), []);

  const loadMetadata = useCallback(
    async (refresh: boolean) => {
      indexStoreApi.getState().setLoading(session);
      callbacks.onViewStarted?.();
      const jobId = crypto.randomUUID();
      callbacks.onJobEvent?.({ job: "metadata.load", jobId, message: "Loading metadata", phase: "started", session });
      try {
        const data = await client.indexData(authToken ?? "", session);
        callbacks.onJobEvent?.({ job: "metadata.load", jobId, message: "Metadata loaded", phase: "completed", session });
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
        callbacks.onJobEvent?.({ error: workerError.error, job: "metadata.load", jobId, message: "Metadata load failed", phase: "failed", session });
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
    async (payload: IndexActionPayload) => {
      const action: MetadataAction = { action: "drop", code: payload.code, session };
      const jobId = crypto.randomUUID();
      callbacks.onJobEvent?.({ job: "metadata.drop", jobId, message: "Deleting index", phase: "started", session });
      try {
        await client.dropIndex(authToken ?? "", session, payload.code);
        callbacks.onJobEvent?.({ job: "metadata.drop", jobId, message: "Index deleted", phase: "completed", session });
        setRemovedCodes((current) => new Set([...current, payload.code]));
        if (selectedIndex?.code === payload.code) {
          setSelectedIndex(null);
          callbacks.onIndexFocus?.(null);
        }
        callbacks.onActionComplete?.(action);
      } catch (error) {
        const workerError = toWorkerError(error, "Drop index request failed.");
        callbacks.onJobEvent?.({ error: workerError.error, job: "metadata.drop", jobId, message: "Index deletion failed", phase: "failed", session });
        callbacks.onActionError?.({ action, error: workerError });
      }
    },
    [authToken, callbacks, client, selectedIndex?.code, session],
  );

  const onConfirm = useCallback(
    async (payload: IndexActionPayload) => {
      const action: MetadataAction = { action: "confirm", code: payload.code, session };
      const jobId = crypto.randomUUID();
      callbacks.onJobEvent?.({ job: "metadata.confirm", jobId, message: "Confirming index", phase: "started", session });
      try {
        await client.confirmIndex(authToken ?? "", session, payload.code);
        callbacks.onJobEvent?.({ job: "metadata.confirm", jobId, message: "Index confirmed", phase: "completed", session });
        setConfirmedCodes((current) => new Set([...current, payload.code]));
        callbacks.onActionComplete?.(action);
      } catch (error) {
        const workerError = toWorkerError(error, "Confirm index request failed.");
        callbacks.onJobEvent?.({ error: workerError.error, job: "metadata.confirm", jobId, message: "Index confirmation failed", phase: "failed", session });
        callbacks.onActionError?.({ action, error: workerError });
      }
    },
    [authToken, callbacks, client, session],
  );

  const onReprocess = useCallback(
    async (segment: string) => {
      const action: MetadataAction = { action: "reprocess", segment, session };
      const jobId = crypto.randomUUID();
      callbacks.onJobEvent?.({ job: "metadata.reprocess", jobId, message: "Reprocessing segment", phase: "started", session });
      try {
        await client.reprocessSegment(authToken ?? "", session, segment);
        callbacks.onJobEvent?.({ job: "metadata.reprocess", jobId, message: "Segment reprocessed", phase: "completed", session });
      } catch (error) {
        const workerError = toWorkerError(error, "Reprocess request failed.");
        callbacks.onJobEvent?.({ error: workerError.error, job: "metadata.reprocess", jobId, message: "Segment reprocessing failed", phase: "failed", session });
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
