import type { IqWorkerClient, IqWorkerConfig } from "../type/iq.types";

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
    const worker = new Worker(new URL("./IqWorker.ts", import.meta.url), { type: "module" });
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
      reject(resolveError(typeof payload?.error === "string" ? payload.error : "IQ worker request failed", payload));
    };

    worker.onerror = () => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new Error("IQ worker failed"));
    };

    worker.postMessage(command);
  });
}

export function createIqWorkerClient(config: IqWorkerConfig): IqWorkerClient {
  const { apiBaseUrl } = config;
  return {
    ackGate(token, session, code) {
      return runWorker({ apiBaseUrl, code, session, token, type: "iqAck" });
    },
    loadReport(token, session) {
      return runWorker({ apiBaseUrl, session, token, type: "iqData" });
    },
    startReport(token, session) {
      return runWorker({ apiBaseUrl, session, token, type: "iqStart" });
    },
  };
}
