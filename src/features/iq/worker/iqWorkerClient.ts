import type { IqReport, IqResource, IqWorkerClient, IqWorkerConfig } from "../type/iq.types";
import type { GenerationInput } from "../../../shared/type/generation.types";
import { retryWorker } from "../../../shared/worker/retryWorker";

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

async function runWorkerOnce<T>(command: unknown): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const worker = new Worker(new URL("./IqWorker.ts", import.meta.url), { type: "module" });
    let settled = false;

    worker.onmessage = (event) => {
      if (settled) return;
      settled = true;
      worker.terminate();

      const payload = event?.data as { code?: string; data?: T; details?: unknown; error?: string; ok?: boolean; status?: number };
      if (payload && payload.ok === true) {
        resolve(payload.data as T);
        return;
      }
      reject(resolveError(typeof payload?.error === "string" ? payload.error : "IQ worker request failed", payload));
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

export async function generateIqReport(input: GenerationInput): Promise<IqReport> {
  return (await runWorkerOnce<IqResource>({ apiBaseUrl: input.apiGatewayUrl, session: input.session, token: input.authToken, type: "iqData", etag: null })).report;
}

export function createIqWorkerClient(config: IqWorkerConfig): IqWorkerClient {
  const { apiBaseUrl, onRetry, retryIntervalMs, retryLimit } = config;
  return {
    ackGate(token, session, code) {
      return runWorkerOnce({ apiBaseUrl, code, session, token, type: "iqAck" });
    },
    loadReport(token, session, etag) {
      return retryWorker(() => runWorkerOnce<IqResource>({ apiBaseUrl, session, token, type: "iqData", etag }), retryIntervalMs, retryLimit, onRetry);
    },
  };
}
