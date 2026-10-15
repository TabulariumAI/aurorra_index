import type {
  DataResponse,
  LocalPackage,
  PackageResponse,
  PackageUrls,
  WorkerClient,
  WorkerConfig,
  WorkerResult,
} from "../type/imageViewer.types";
import type { GenerationInput } from "../../../shared/type/generation.types";

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
    const cleanup = () => worker.terminate();

    worker.onmessage = (event) => {
      if (settled) return;
      settled = true;
      cleanup();

      const payload = event?.data as WorkerResult<T> & { data?: T };
      if (payload && payload.ok === true) {
        resolve(payload.data as T);
        return;
      }
      reject(resolveError(typeof payload?.error === "string" ? payload.error : "Image viewer request failed", payload));
    };

    worker.onerror = () => {
      if (settled) return;
      settled = true;
      cleanup();
      reject(new Error("Image viewer worker failed"));
    };

    worker.postMessage(command);
  });
}

export function generateImagePackage(input: GenerationInput): Promise<PackageResponse> {
  return runWorker<PackageResponse>({ apiBaseUrl: input.apiGatewayUrl, session: input.session, token: input.authToken, type: "imagePackage" });
}

export function createWorkerClient(config: WorkerConfig): WorkerClient {
  const { apiBaseUrl } = config;
  return {
    packageImage(token, session) {
      return generateImagePackage({ apiGatewayUrl: apiBaseUrl, authToken: token, session });
    },
    imageStatus(token, session) {
      return runWorker<PackageResponse>({ apiBaseUrl, session, token, type: "imageStatus" });
    },
    imageData(token, session) {
      return runWorker<DataResponse>({ apiBaseUrl, session, token, type: "imageData" });
    },
    downloadPackage(token: string, urls: PackageUrls) {
      return runWorker<LocalPackage>({ jsonUrl: urls.jsonUrl, tiffUrl: urls.tiffUrl, token, type: "imageDownload" });
    },
  };
}
