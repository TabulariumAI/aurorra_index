import type { MetadataWorkerCommand, MetadataResponse } from "../type/metadataView.types";

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

export function runMetadataWorker<T>(command: MetadataWorkerCommand): Promise<MetadataResponse<T>> {
  return new Promise<MetadataResponse<T>>((resolve, reject) => {
    const worker = new Worker(new URL("./MetadataWorker.ts", import.meta.url), { type: "module" });
    let settled = false;

    worker.onmessage = (event) => {
      if (settled) return;
      settled = true;
      worker.terminate();

      const payload = event?.data as { code?: string; data?: T; details?: unknown; error?: string; ok?: boolean; status?: number; path?: string; etag?: string };
      if (payload && payload.ok === true) {
        resolve(payload as MetadataResponse<T>);
        return;
      }
      reject(resolveError(typeof payload?.error === "string" ? payload.error : "Index worker request failed", payload));
    };

    worker.onerror = (event) => {
      if (settled) return;
      settled = true;
      worker.terminate();
      reject(event);
    };

    worker.postMessage(command);
  });
}
