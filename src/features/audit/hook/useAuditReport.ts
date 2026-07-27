import { useCallback, useEffect, useMemo, useRef } from "react";
import { useAuditStore, auditStoreApi } from "../store/auditStore";
import type { AuditPanelProps, AuditWorkerError } from "../type/audit.types";
import { createAuditWorkerClient } from "../worker/auditWorkerClient";

function normalizeError(error: unknown): AuditWorkerError {
  const candidate = error as {
    code?: unknown;
    details?: unknown;
    error?: unknown;
    message?: unknown;
    status?: unknown;
  };
  return {
    code: typeof candidate?.code === "string" ? candidate.code : undefined,
    details: candidate?.details,
    error:
      typeof candidate?.error === "string"
        ? candidate.error
        : typeof candidate?.message === "string"
          ? candidate.message
          : "Audit request failed.",
    status: typeof candidate?.status === "number" ? candidate.status : undefined,
  };
}

export function useAuditReport({
  apiGatewayUrl,
  authToken,
  callbacks,
  session,
  workerClient,
}: AuditPanelProps) {
  const callbacksRef = useRef(callbacks);
  const client = useMemo(() => workerClient || createAuditWorkerClient({ apiBaseUrl: apiGatewayUrl }), [apiGatewayUrl, workerClient]);
  const store = useAuditStore();

  useEffect(() => {
    callbacksRef.current = callbacks;
  }, [callbacks]);

  useEffect(() => () => callbacksRef.current.onAuditCanceled?.(), []);

  const loadReport = useCallback(async () => {
    auditStoreApi.getState().setLoading(session);
    const jobId = crypto.randomUUID();
    callbacksRef.current.onJobEvent?.({ jobId, message: "Loading audit report", phase: "started", session });
    try {
      const report = await client.loadReport(authToken ?? "", session);
      callbacksRef.current.onJobEvent?.({ jobId, message: "Audit report loaded", phase: "completed", session });
      auditStoreApi.getState().setLoaded(session, report);
      callbacksRef.current.onAuditLoaded?.(report);
    } catch (error) {
      const workerError = normalizeError(error);
      callbacksRef.current.onJobEvent?.({ error: workerError.error, jobId, message: "Audit report load failed", phase: "failed", session });
      auditStoreApi.getState().setError(workerError);
      callbacksRef.current.onAuditError?.(workerError);
    }
  }, [authToken, client, session]);

  useEffect(() => {
    void loadReport();
  }, [loadReport]);

  return {
    error: store.error,
    report: store.report,
    status: store.status,
  };
}
