import { useCallback, useEffect, useMemo, useRef } from "react";
import { prepareIqReport, toIqError } from "../data/iqData";
import { iqStoreApi, useIqStore } from "../store/iqStore";
import type { IqPanelProps } from "../type/iq.types";
import { createIqWorkerClient } from "../worker/iqWorkerClient";

export function useIqReport({
  apiGatewayUrl,
  authToken,
  callbacks,
  session,
  workerClient,
}: IqPanelProps) {
  const callbacksRef = useRef(callbacks);
  const store = useIqStore();
  const client = useMemo(() => workerClient || createIqWorkerClient({ apiBaseUrl: apiGatewayUrl }), [apiGatewayUrl, workerClient]);
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
      const jobId = crypto.randomUUID();
      callbacksRef.current.onJobEvent?.({ job: "iq.load", jobId, message: "Loading IQ report", phase: "started", session });
      try {
        const nextReport = await client.loadReport(authToken ?? "", session);
        callbacksRef.current.onJobEvent?.({ job: "iq.load", jobId, message: "IQ report loaded", phase: "completed", session });
        iqStoreApi.getState().setLoaded(session, nextReport);
        callbacksRef.current.onIqLoaded?.(nextReport);
        if (refresh) callbacksRef.current.onIqRefresh?.(nextReport);
      } catch (error) {
        const workerError = toIqError(error);
        callbacksRef.current.onJobEvent?.({ error: workerError.error, job: "iq.load", jobId, message: "IQ report load failed", phase: "failed", session });
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
    const jobId = crypto.randomUUID();
    callbacksRef.current.onJobEvent?.({ job: "iq.start", jobId, message: "Starting IQ report", phase: "started", session });
    try {
      const result = await client.startReport(authToken ?? "", session);
      callbacksRef.current.onJobEvent?.({ job: "iq.start", jobId, message: "IQ report started", phase: "completed", session });
      callbacksRef.current.onIqStarted?.(result);
    } catch (error) {
      const workerError = toIqError(error);
      callbacksRef.current.onJobEvent?.({ error: workerError.error, job: "iq.start", jobId, message: "IQ report start failed", phase: "failed", session });
      iqStoreApi.getState().setError(workerError);
      callbacksRef.current.onIqError?.(workerError);
    }
  }, [authToken, client, session]);

  const ackGate = useCallback(async (code: string) => {
    iqStoreApi.getState().ackStart(code);
    const jobId = crypto.randomUUID();
    callbacksRef.current.onJobEvent?.({ job: "iq.ack", jobId, message: "Acknowledging IQ gate", phase: "started", session });
    try {
      await client.ackGate(authToken ?? "", session, code);
      callbacksRef.current.onJobEvent?.({ job: "iq.ack", jobId, message: "IQ gate acknowledged", phase: "completed", session });
      iqStoreApi.getState().ackSuccess(code);
      callbacksRef.current.onIqAck?.(code);
    } catch (error) {
      const workerError = toIqError(error);
      callbacksRef.current.onJobEvent?.({ error: workerError.error, job: "iq.ack", jobId, message: "IQ gate acknowledgement failed", phase: "failed", session });
      iqStoreApi.getState().setError(workerError);
      callbacksRef.current.onIqError?.(workerError);
    }
  }, [authToken, client, session]);

  return {
    ackingCodes: store.ackingCodes,
    error: store.error,
    loadReport,
    report,
    startReport,
    ackGate,
    status: store.status,
    view: report ? prepareIqReport(report) : null,
  };
}
