import type {
  AddIndexResponse,
  AddIndexWorkerClient,
  AddIndexWorkerCommand,
  AddIndexWorkerConfig,
  AddIndexWorkerResult,
} from "../type/addIndex.types";

function runWorker(command: AddIndexWorkerCommand): Promise<AddIndexResponse> {
  return new Promise<AddIndexResponse>((resolve, reject) => {
    const worker = new Worker(new URL("./AddIndexWorker.ts", import.meta.url), { type: "module" });
    let settled = false;

    worker.onmessage = (event) => {
      if (settled) return;
      settled = true;
      worker.terminate();

      const payload = event.data as AddIndexWorkerResult<AddIndexResponse>;
      if (payload.ok) {
        resolve(payload.data);
        return;
      }
      const error = new Error(payload.error) as Error & {
        code?: string;
        details?: unknown;
        status?: number;
      };
      if (payload.code !== undefined) error.code = payload.code;
      if (payload.details !== undefined) error.details = payload.details;
      if (payload.status !== undefined) error.status = payload.status;
      reject(error);
    };

    worker.onerror = (event) => {
      if (settled) return;
      settled = true;
      worker.terminate();
      reject(new Error(event.message));
    };

    worker.postMessage(command);
  });
}

export function createAddIndexWorkerClient(config: AddIndexWorkerConfig): AddIndexWorkerClient {
  const { apiBaseUrl } = config;
  return {
    addIndex(token, session, request) {
      return runWorker({
        apiBaseUrl,
        aspect: request.aspect,
        session,
        source: request.source,
        token,
        type: "addIndex",
        value: request.value,
      });
    },
  };
}
