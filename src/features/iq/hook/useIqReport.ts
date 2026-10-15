import { useCallback, useEffect, useMemo, useRef } from "react";
import { prepareIqReport, toIqError } from "../data/iqData";
import { iqStoreApi, useIqStore } from "../store/iqStore";
import type { IqPanelProps } from "../type/iq.types";
import { loadIqReport } from "../data/loadIqReport";
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

  useEffect(() => {
    callbacksRef.current = callbacks;
  }, [callbacks]);

  useEffect(() => () => callbacksRef.current.onIqCanceled?.(), []);

  const loadReport = useCallback(
    async (refresh: boolean) => {
      await loadIqReport({
        apiGatewayUrl, authToken: authToken ?? "", session, retryLimit, retryIntervalMs,
        restart: refresh, workerClient,
        onComplete(nextReport) {
          callbacksRef.current.onIqLoaded?.(nextReport);
          if (refresh) callbacksRef.current.onIqRefresh?.(nextReport);
        },
        onError(error) { callbacksRef.current.onIqError?.(error); },
      });
    },
    [apiGatewayUrl, authToken, workerClient, retryIntervalMs, retryLimit, session],
  );

  useEffect(() => {
    void loadReport(false);
  }, [loadReport]);

  const ackGate = useCallback(async (code: string) => {
    iqStoreApi.getState().ackStart(code);
    try {
      await ackClient.ackGate(authToken ?? "", session, code);
      iqStoreApi.getState().ackSuccess(code);
      callbacksRef.current.onIqAck?.(code);
    } catch (error) {
      const workerError = toIqError(error);
      iqStoreApi.getState().setError(workerError);
      callbacksRef.current.onIqError?.(workerError);
    }
  }, [authToken, ackClient, session]);

  return {
    ackingCodes: store.ackingCodes,
    error: store.error,
    loadReport,
    report,
    retryAttempt: store.retryAttempt,
    ackGate,
    status: store.status,
    view: report ? prepareIqReport(report) : null,
  };
}
