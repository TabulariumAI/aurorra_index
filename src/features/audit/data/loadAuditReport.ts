import { auditStoreApi } from "../store/auditStore";
import { queueStoreApi } from "../../queue/store/queueStore";
import type { AuditReport, AuditWorkerClient, AuditWorkerError } from "../type/audit.types";

export async function loadAuditReport(input: {
  authToken: string;
  session: string;
  background: boolean;
  workerClient: AuditWorkerClient;
}): Promise<AuditReport | AuditWorkerError | undefined> {
  const generation = queueStoreApi.getState().generation;
  const request = auditStoreApi.getState().setLoading(input.session, input.background);
  try {
    const report = await input.workerClient.loadReport(input.authToken, input.session);
    if (generation !== queueStoreApi.getState().generation || auditStoreApi.getState().request !== request) return;
    auditStoreApi.getState().setLoaded(input.session, report);
    return report;
  } catch (error) {
    const state = auditStoreApi.getState();
    if (generation !== queueStoreApi.getState().generation || state.request !== request
      || state.activeSession !== null && state.activeSession !== input.session) return;
    const candidate = error as { code?: unknown; details?: unknown; error?: unknown; message?: unknown; status?: unknown };
    const failure: AuditWorkerError = {
      ...(error instanceof ErrorEvent ? { cause: error } : {}),
      code: typeof candidate?.code === "string" ? candidate.code : undefined,
      details: candidate?.details,
      error: typeof candidate?.error === "string" ? candidate.error
        : typeof candidate?.message === "string" ? candidate.message : "Audit request failed.",
      status: typeof candidate?.status === "number" ? candidate.status : undefined,
    };
    state.setError(failure);
    return failure;
  }
}
