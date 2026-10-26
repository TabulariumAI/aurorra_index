import { loadAuditReport } from "../../audit/data/loadAuditReport";
import { createAuditWorkerClient } from "../../audit/worker/auditWorkerClient";
import { createPageSegmentsWorkerClient } from "../../pagesegments/worker/pageSegmentsWorkerClient";
import type { MetdataPatchResult, MetdataReprocessResult, MetdataWorkerClient, MetdataWorkerConfig } from "../type/metadataView.types";
import type { MetadataPayload } from "aurora-core";
import { retryWorker } from "../../../shared/worker/retryWorker";
import { queueStoreApi } from "../../queue/store/queueStore";
import { indexStoreApi } from "../store/metadataStore";
import type { MetdataWorkerCommand } from "../type/metadataView.types";

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

async function runWorkerOnce<T>(command: MetdataWorkerCommand): Promise<T> {
  const generation = queueStoreApi.getState().generation;
  return new Promise<T>((resolve, reject) => {
    const worker = new Worker(new URL("./metdataWorker.ts", import.meta.url), { type: "module" });
    let settled = false;
    const cleanup = () => {
      worker.terminate();
    };

    worker.onmessage = (event) => {
      if (settled) return;
      settled = true;
      cleanup();

      const payload = event?.data as { code?: string; data?: T; details?: unknown; error?: string; ok?: boolean; status?: number; path?: string; etag?: string };
      if (payload && payload.ok === true) {
        if (command.type === "indexData" && payload.path && generation === queueStoreApi.getState().generation) queueStoreApi.getState().setPath(command.session, payload.path);
        if (command.type === "indexData" && payload.etag !== undefined && generation === queueStoreApi.getState().generation) queueStoreApi.getState().setEtag(command.session, payload.etag);
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

export function createIndexWorkerClient(config: MetdataWorkerConfig): MetdataWorkerClient {
  const { apiBaseUrl, onRetry, retryIntervalMs, retryLimit } = config;
  const pagesClient = createPageSegmentsWorkerClient({ apiBaseUrl });
  const auditClient = createAuditWorkerClient({ apiBaseUrl, retryIntervalMs, retryLimit });
  const runReadWorker = <T>(command: MetdataWorkerCommand) => retryWorker(() => runWorkerOnce<T>(command), retryIntervalMs, retryLimit, onRetry);
  const pagesData = async (token: string, session: string, refresh: boolean) => {
    const generation = queueStoreApi.getState().generation;
    const request = indexStoreApi.getState().setPageLoading(session);
    try {
      const result = await retryWorker(() => pagesClient.pagesData(token, session, refresh ? null : queueStoreApi.getState().pagePaths[session] ?? null), retryIntervalMs, retryLimit, onRetry);
      if (generation === queueStoreApi.getState().generation && indexStoreApi.getState().pageRequests[session] === request) {
        queueStoreApi.getState().setPagePath(session, result.path);
        if (result.etag !== undefined) queueStoreApi.getState().setPageEtag(session, result.etag);
        indexStoreApi.getState().setPageError(session, null);
      }
      return result.data;
    } catch (error) {
      const failure = error as WorkerError;
      if (generation === queueStoreApi.getState().generation && indexStoreApi.getState().pageRequests[session] === request) {
        indexStoreApi.getState().setPageError(session, { error: failure.message, code: failure.code, details: failure.details, status: failure.status });
      }
      throw error;
    }
  };
  return {
    updatePageSegments: pagesClient.updatePageSegments,
    pagesData,
    patchIndex(token, session, segment, change) {
      return runWorkerOnce<MetdataPatchResult>({ apiBaseUrl, change, segment, session, token, type: "patchIndex" });
    },
    confirmIndex(token, session, code) {
      return runWorkerOnce<MetdataPatchResult>({ apiBaseUrl, code, session, token, type: "confirmIndex" });
    },
    dropIndex(token, session, code) {
      return runWorkerOnce<MetdataPatchResult>({ apiBaseUrl, code, session, token, type: "dropIndex" });
    },
    async indexData(token, session, refresh) {
      const generation = queueStoreApi.getState().generation;
      const [metadata, pages] = await Promise.all([
        runReadWorker<MetadataPayload>({ apiBaseUrl, session, token, type: "indexData", path: refresh ? null : queueStoreApi.getState().paths[session] ?? null }),
        pagesData(token, session, Boolean(refresh)).catch(() => undefined),
      ]);
      if (generation === queueStoreApi.getState().generation) {
        void loadAuditReport({ authToken: token, session, background: true, workerClient: auditClient });
      }
      return { ...metadata, pages };
    },
    patchStatus(token, session, version) {
      return runReadWorker<MetdataPatchResult>({ apiBaseUrl, session, token, type: "patchStatus", version });
    },
    reprocessSegment(token, session, segment) {
      return runWorkerOnce<MetdataReprocessResult>({ apiBaseUrl, segment, session, token, type: "reprocessSegment" });
    },
  };
}
