import { useCallback, useEffect, useMemo, useRef } from "react";
import { prepareIqReport } from "../data/iqData";
import { useIqStore } from "../store/iqStore";
import type { IqPanelProps } from "../type/iq.types";
import { loadIqReport, refreshIqReport } from "../data/loadIqReport";
import { createIqWorkerClient } from "../worker/iqWorkerClient";
import { iqQueueStore } from "../store/iqQueueStore";

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
  const view = useMemo(() => {
    if (!report) return null;
    const view = prepareIqReport(report);
    if (view.gates.error === null) view.gates.data.items = view.gates.data.items.filter(gate => !store.removedCodes.has(gate.code));
    if (view.segments.error === null) for (const segment of view.segments.data) {
      if (segment.cues.error === null) segment.cues.data = segment.cues.data.filter(cue => !store.removedCodes.has(cue.code));
    }
    return view;
  }, [report, store.removedCodes]);

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

  const acknowledge = useCallback(async (code: string, cue: boolean) => {
    iqQueueStore.getState().enqueue(session, cue ? "cues" : "gates", code, {
      authToken: authToken ?? "", client: ackClient,
      onChange: event => callbacksRef.current.onIqChange?.(event),
      onComplete: code => callbacksRef.current.onIqAck?.(code),
    });
  }, [authToken, ackClient, session]);

  const ackGate = useCallback((code: string) => acknowledge(code, false), [acknowledge]);
  const ackCue = useCallback((code: string) => acknowledge(code, true), [acknowledge]);

  return {
    ackCue,
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
