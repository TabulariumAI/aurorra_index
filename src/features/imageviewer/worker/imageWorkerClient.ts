import type {
  DataResponse,
  LocalPackage,
  PackageUrls,
  WorkerClient,
  WorkerConfig,
  WorkerResult,
} from "../type/imageViewer.types";

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
    const worker = new Worker(new URL("./ImageWorker.ts", import.meta.url), { type: "module" });
    let settled = false;

    worker.onmessage = (event) => {
      if (settled) return;
      settled = true;
      worker.terminate();

      const payload = event?.data as WorkerResult<T> & { data?: T };
      if (payload && payload.ok === true) {
        resolve(payload.data as T);
        return;
      }
      reject(resolveError(typeof payload?.error === "string" ? payload.error : "Image viewer request failed", payload));
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

export function createWorkerClient(config: WorkerConfig): WorkerClient {
  const { apiBaseUrl } = config;
  return {
    packageImage(token, session, refresh) {
      return runWorker<DataResponse>({ apiBaseUrl, session, token, type: "imagePackage", refresh });
    },
    downloadPackage(token: string, urls: PackageUrls) {
      return runWorker<LocalPackage>({ jsonUrl: urls.jsonUrl, tiffUrl: urls.tiffUrl, token, type: "imageDownload" });
    },
  };
}
