import type { ChoicesBackendData, ChoicesWorkerClient, ChoicesWorkerConfig, ChoicesWorkerResult } from "../type/choices.types";

type ChoicesWorkerError = Error & {
  code?: string;
  status?: number;
  details?: unknown;
};

function resolveError(message: string, error: unknown): ChoicesWorkerError {
  const err = new Error(message) as ChoicesWorkerError;
  if (typeof error === "object" && error !== null) {
    const candidate = error as { code?: unknown; status?: unknown; details?: unknown };
    if (typeof candidate.code === "string") {
      err.code = candidate.code;
    }
    if (typeof candidate.status === "number") {
      err.status = candidate.status;
    }
    if (Object.prototype.hasOwnProperty.call(candidate, "details")) {
      err.details = candidate.details;
    }
  }

  return err;
}

export function createSessionDataWorkerClient(config: ChoicesWorkerConfig): ChoicesWorkerClient {
  return {
    load(token, session) {
      return new Promise<ChoicesBackendData>((resolve, reject) => {
        const worker = new Worker(new URL("./ChoicesWorker.ts", import.meta.url), { type: "module" });
        let settled = false;

        worker.onmessage = (event) => {
          if (settled) {
            return;
          }
          settled = true;
          worker.terminate();

          const payload = event.data as ChoicesWorkerResult<ChoicesBackendData>;
          if (payload.ok) {
            resolve(payload.data);
            return;
          }

          reject(resolveError(payload.error, payload));
        };

        worker.onerror = (event) => {
          if (settled) {
            return;
          }
          settled = true;
          worker.terminate();
          reject(event);
        };

        worker.postMessage({ type: "load", token, session, config });
      });
    },
  };
}
