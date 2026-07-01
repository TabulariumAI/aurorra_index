import type { AuditReport, AuditWorkerClient, AuditWorkerConfig, AuditWorkerResult } from "../type/audit.types";

type WorkerError = Error & {
  code?: string;
  details?: unknown;
  status?: number;
};

function resolveError(message: string, payload: unknown): WorkerError {
  const error = new Error(message) as WorkerError;
  if (payload && typeof payload === "object") {
    const candidate = payload as { code?: unknown; details?: unknown; status?: unknown };
    if (typeof candidate.code === "string") error.code = candidate.code;
    if (typeof candidate.status === "number") error.status = candidate.status;
    if (Object.prototype.hasOwnProperty.call(candidate, "details")) error.details = candidate.details;
  }
  return error;
}

function runWorker<T>(command: unknown): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const worker = new Worker(new URL("./AuditWorker.ts", import.meta.url), { type: "module" });
    let settled = false;
    const cleanup = () => {
      worker.terminate();
    };

    worker.onmessage = (event) => {
      if (settled) return;
      settled = true;
      cleanup();

      const payload = event?.data as (AuditWorkerResult<T> & { data?: T });
      if (payload && payload.ok === true) {
        resolve(payload.data as T);
        return;
      }
      reject(resolveError(typeof payload?.error === "string" ? payload.error : "Audit request failed", payload));
    };

    worker.onerror = () => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new Error("Audit worker failed"));
    };

    worker.postMessage(command);
  });
}

export function createAuditWorkerClient(config: AuditWorkerConfig): AuditWorkerClient {
  const { apiBaseUrl } = config;
  return {
    loadReport(token, session) {
      return runWorker({
        apiBaseUrl,
        session,
        token,
        type: "auditData",
      });
    },
  };
}
