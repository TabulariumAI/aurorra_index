import type { PageSegmentsWorkerClient, PageSegmentsWorkerConfig } from "../type/pageSegments.types";

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

async function runWorker<T>(command: unknown): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const worker = new Worker(new URL("./PageSegmentsWorker.ts", import.meta.url), { type: "module" });
    let settled = false;
    const cleanup = () => {
      worker.terminate();
    };

    worker.onmessage = (event) => {
      if (settled) return;
      settled = true;
      cleanup();

      const payload = event?.data as { code?: string; data?: T; details?: unknown; error?: string; ok?: boolean; status?: number };
      if (payload && payload.ok === true) {
        resolve(payload.data as T);
        return;
      }
      reject(resolveError(typeof payload?.error === "string" ? payload.error : "Page segments worker request failed", payload));
    };

    worker.onerror = () => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new Error("Page segments worker failed"));
    };

    worker.postMessage(command);
  });
}

export function createPageSegmentsWorkerClient(config: PageSegmentsWorkerConfig): PageSegmentsWorkerClient {
  const { apiBaseUrl } = config;
  return {
    updatePageSegments(token, session, pageCode, segments) {
      return runWorker<void>({ apiBaseUrl, pageCode, segments, session, token, type: "updatePageSegments" });
    },
  };
}
