import { useEffect, useMemo, useRef } from "react";
import { useAuditStore, auditStoreApi } from "../store/auditStore";
import type { AuditPanelProps } from "../type/audit.types";
import { createAuditWorkerClient } from "../worker/auditWorkerClient";
import { loadAuditReport } from "../data/loadAuditReport";

export function useAuditReport({
  apiGatewayUrl,
  authToken,
  callbacks,
  retryLimit,
  retryIntervalMs,
  session,
  workerClient,
}: AuditPanelProps) {
  const callbacksRef = useRef(callbacks);
  const client = useMemo(() => workerClient || createAuditWorkerClient({ apiBaseUrl: apiGatewayUrl, onRetry: (attempt) => auditStoreApi.getState().setRetryAttempt(attempt), retryIntervalMs, retryLimit }), [apiGatewayUrl, retryIntervalMs, retryLimit, workerClient]);
  const store = useAuditStore();

  useEffect(() => {
    callbacksRef.current = callbacks;
  }, [callbacks]);

  useEffect(() => () => callbacksRef.current.onAuditCanceled?.(), []);

  useEffect(() => {
    void loadAuditReport({ authToken: authToken ?? "", session, background: false, workerClient: client }).then(result => {
      if (!result) return;
      if ("error" in result) callbacksRef.current.onAuditError?.(result);
      else callbacksRef.current.onAuditLoaded?.(result);
    });
  }, [authToken, client, session]);

  return {
    error: store.activeSession === session ? store.error : null,
    report: store.activeSession === session ? store.report : null,
    retryAttempt: store.retryAttempt,
    status: store.status,
  };
}
