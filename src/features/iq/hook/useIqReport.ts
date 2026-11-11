import { useCallback, useEffect, useMemo, useRef } from "react";
import { prepareIqReport, toIqError } from "../data/iqData";
import { iqStoreApi, useIqStore } from "../store/iqStore";
import type { IqPanelProps } from "../type/iq.types";
import { loadIqReport, refreshIqReport } from "../data/loadIqReport";
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
  const ackClient = useMemo(() => workerClient || createIqWorkerClient({ apiBaseUrl: apiGatewayUrl, retryIntervalMs, retryLimit }), [apiGatewayUrl, retryIntervalMs, retryLimit, workerClient]);
  const report = store.report;
  const view = useMemo(() => report ? prepareIqReport(report) : null, [report]);

  useEffect(() => {
    callbacksRef.current = callbacks;
  }, [callbacks]);

  useEffect(() => () => callbacksRef.current.onIqCanceled?.(), []);

  const loadReport = useCallback(
    async () => {
      await loadIqReport({
        apiGatewayUrl, authToken: authToken ?? "", session, retryLimit, retryIntervalMs,
        workerClient,
        onComplete(nextReport) {
          callbacksRef.current.onIqLoaded?.(nextReport);
        },
        onError(error) { callbacksRef.current.onIqError?.(error); },
      });
    },
    [apiGatewayUrl, authToken, workerClient, retryIntervalMs, retryLimit, session],
  );

  const refreshReport = useCallback(async () => {
    await refreshIqReport({
      apiGatewayUrl, authToken: authToken ?? "", session, retryLimit, retryIntervalMs, workerClient,
      onComplete(nextReport) {
        callbacksRef.current.onIqLoaded?.(nextReport);
        callbacksRef.current.onIqRefresh?.(nextReport);
      },
      onError(error) { callbacksRef.current.onIqError?.(error); },
    });
  }, [apiGatewayUrl, authToken, workerClient, retryIntervalMs, retryLimit, session]);

  useEffect(() => {
    void loadReport();
  }, [loadReport]);

  const ackGate = useCallback(async (code: string) => {
    const generation = iqStoreApi.getState().ackStart(session, code);
    if (generation === null) return;
    const callbacks = callbacksRef.current;
    try {
      await ackClient.ackGate(authToken ?? "", session, code);
      if (iqStoreApi.getState().ackFinish(session, generation, code, null)) callbacks.onIqAck?.(code);
    } catch (error) {
      const workerError = toIqError(error);
      if (iqStoreApi.getState().ackFinish(session, generation, code, workerError)) callbacks.onIqError?.(workerError);
    }
  }, [authToken, ackClient, session]);

  return {
    ackingCodes: store.ackingCodes,
    error: store.error,
    loadReport,
    refreshReport,
    report,
    retryAttempt: store.retryAttempt,
    ackGate,
    status: store.status,
    view,
  };
}
