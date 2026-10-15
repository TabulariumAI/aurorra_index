import type { IqReport, IqWorkerClient, IqWorkerConfig } from "../type/iq.types";
import type { GenerationInput } from "../../../shared/type/generation.types";
import { requestResource } from "../../metdataview/data/metadataResource";
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

export function generateIqReport(input: GenerationInput): Promise<IqReport> {
  return runWorkerOnce<IqReport>({ apiBaseUrl: input.apiGatewayUrl, session: input.session, token: input.authToken, type: "iqData", etag: null });
}

export function createIqWorkerClient(config: IqWorkerConfig): IqWorkerClient {
  const { apiBaseUrl, onRetry, retryIntervalMs, retryLimit } = config;
  const runReadWorker = <T>(command: unknown) => retryWorker(() => runWorkerOnce<T>(command), retryIntervalMs, retryLimit, onRetry);
  return {
    ackGate(token, session, code) {
      return runWorkerOnce({ apiBaseUrl, code, session, token, type: "iqAck" });
    },
    async loadReport(token, session, refresh) {
      const etag = refresh ? null : await requestResource({ resource: "metadata_etag" }, session);
      return runReadWorker({ apiBaseUrl, session, token, type: "iqData", etag });
    },
  };
}
