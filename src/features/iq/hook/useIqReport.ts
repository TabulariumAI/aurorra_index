import { useCallback, useEffect, useMemo, useRef } from "react";
import { prepareIqReport, toIqError } from "../data/iqData";
import { iqStoreApi, useIqStore } from "../store/iqStore";
import type { IqPanelProps } from "../type/iq.types";
import { createIqWorkerClient } from "../worker/iqWorkerClient";

export function useIqReport({
  apiGatewayUrl,
  authToken,
  callbacks,
  retryLimit,
  retryIntervalMs,
  session,
  workerClient,
}: IqPanelProps) {
  const callbacksRef = useRef(callbacks);
  const store = useIqStore();
  const client = useMemo(() => workerClient || createIqWorkerClient({ apiBaseUrl: apiGatewayUrl, onRetry: (attempt) => iqStoreApi.getState().setRetryAttempt(attempt), retryIntervalMs, retryLimit }), [apiGatewayUrl, retryIntervalMs, retryLimit, workerClient]);
  const report = store.report;

  useEffect(() => {
    callbacksRef.current = callbacks;
  }, [callbacks]);

  useEffect(() => () => callbacksRef.current.onIqCanceled?.(), []);

  const loadReport = useCallback(
    async (refresh: boolean) => {
      if (refresh) {
        iqStoreApi.getState().setRefreshing(session);
      } else {
        iqStoreApi.getState().setLoading(session);
      }
      try {
        const nextReport = await client.loadReport(authToken ?? "", session);
        iqStoreApi.getState().setLoaded(session, nextReport);
        callbacksRef.current.onIqLoaded?.(nextReport);
        if (refresh) callbacksRef.current.onIqRefresh?.(nextReport);
      } catch (error) {
        const workerError = toIqError(error);
        iqStoreApi.getState().setError(workerError);
        callbacksRef.current.onIqError?.(workerError);
      }
    },
    [authToken, client, session],
  );

  useEffect(() => {
    void loadReport(false);
  }, [loadReport]);

  const startReport = useCallback(async () => {
    try {
      const result = await client.startReport(authToken ?? "", session);
      callbacksRef.current.onIqStarted?.(result);
    } catch (error) {
      const workerError = toIqError(error);
      iqStoreApi.getState().setError(workerError);
      callbacksRef.current.onIqError?.(workerError);
    }
  }, [authToken, client, session]);

  const ackGate = useCallback(async (code: string) => {
    iqStoreApi.getState().ackStart(code);
    try {
      await client.ackGate(authToken ?? "", session, code);
      iqStoreApi.getState().ackSuccess(code);
      callbacksRef.current.onIqAck?.(code);
    } catch (error) {
      const workerError = toIqError(error);
      iqStoreApi.getState().setError(workerError);
      callbacksRef.current.onIqError?.(workerError);
    }
  }, [authToken, client, session]);

  return {
    ackingCodes: store.ackingCodes,
    error: store.error,
    loadReport,
    report,
    retryAttempt: store.retryAttempt,
    startReport,
    ackGate,
    status: store.status,
    view: report ? prepareIqReport(report) : null,
  };
}
