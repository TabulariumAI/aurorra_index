import type {
  IndexApplyResult,
  IndexReprocessResult,
  IndexWorkerClient,
  IndexWorkerConfig,
  MetadataPayload,
} from "../type/metadata.types";

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
    const worker = new Worker(new URL("./IndexWorker.ts", import.meta.url), { type: "module" });
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
      reject(resolveError(typeof payload?.error === "string" ? payload.error : "Index worker request failed", payload));
    };

    worker.onerror = () => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new Error("Index worker failed"));
    };

    worker.postMessage(command);
  });
}

export function createIndexWorkerClient(config: IndexWorkerConfig): IndexWorkerClient {
  const { apiBaseUrl } = config;
  return {
    confirmIndex(token, session, code) {
      return runWorker<IndexApplyResult>({ apiBaseUrl, code, session, token, type: "confirmIndex" });
    },
    dropIndex(token, session, code) {
      return runWorker<IndexApplyResult>({ apiBaseUrl, code, session, token, type: "dropIndex" });
    },
    indexData(token, session) {
      return runWorker<MetadataPayload>({ apiBaseUrl, session, token, type: "indexData" });
    },
    reprocessSegment(token, session, segment) {
      return runWorker<IndexReprocessResult>({ apiBaseUrl, segment, session, token, type: "reprocessSegment" });
    },
  };
}
