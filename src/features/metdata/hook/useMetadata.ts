import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { composeMetadataJSON, getPanelData, splitMetadataJSON } from "../data/metadataData";
import { indexStoreApi, useIndexStore } from "../store/indexStore";
import { storeApi, useStore } from "../../../store/state/store";
import type { IndexActionPayload, IndexMetadataProps } from "../type/metadata.types";
import { createIndexWorkerClient } from "../worker/indexWorkerClient";

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
      try {
        const data = await client.indexData(authToken ?? "", session);
        storeApi.getState().setJSON(session, splitMetadataJSON(data));
        indexStoreApi.getState().setLoaded(session);
        setRemovedCodes(new Set());
        setConfirmedCodes(new Set());
        callbacks.onView?.(data);
        callbacks.onMetadataLoaded?.(data);
        if (refresh) callbacks.onRefresh?.(data);
      } catch (error) {
        const candidate = error as { code?: string; details?: unknown; message?: string; status?: number };
        const workerError = {
          code: candidate.code,
          details: candidate.details,
          error: candidate.message || "Metadata request failed.",
          status: candidate.status,
        };
        indexStoreApi.getState().setError(workerError);
        callbacks.onViewError?.(workerError);
        callbacks.onMetadataError?.(workerError);
      }
    },
    [authToken, callbacks, client, session],
  );

  useEffect(() => {
    void loadMetadata(false);
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
      const result = await callbacks.onDropIndex?.(payload);
      if (result) {
        setRemovedCodes((current) => new Set([...current, payload.code]));
        if (selectedIndex?.code === payload.code) {
          setSelectedIndex(null);
          callbacks.onIndexFocus?.(null);
        }
      }
    },
    [callbacks, selectedIndex?.code],
  );

  const onConfirm = useCallback(
    async (payload: IndexActionPayload) => {
      const result = await callbacks.onConfirmIndex?.(payload);
      if (result) {
        setConfirmedCodes((current) => new Set([...current, payload.code]));
      }
    },
    [callbacks],
  );

  return {
    confirmedCodes,
    loadMetadata,
    metadata,
    onConfirm,
    onDrop,
    openSegment,
    removedCodes,
    selectedIndex,
    setSectionOpen,
    store,
    panelData,
  };
}
