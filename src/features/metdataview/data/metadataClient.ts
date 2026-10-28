import { loadAuditReport } from "../../audit/data/loadAuditReport";
import { createAuditWorkerClient } from "../../audit/worker/auditWorkerClient";
import { createPageSegmentsWorkerClient } from "../../pagesegments/worker/pageSegmentsWorkerClient";
import { runMetadataWorker } from "../worker/metadataWorkerClient";
import type { MetadataPatchResult, MetadataReprocessResult, MetadataClient, MetadataConfig } from "../type/metadataView.types";
import type { MetadataPayload, MetadataError } from "aurora-core";
import type { GenerationInput } from "../../../shared/type/generation.types";
import { retryWorker } from "../../../shared/worker/retryWorker";
import { queueStoreApi } from "../../queue/store/queueStore";
import { indexStoreApi } from "../store/metadataStore";

export async function loadMetadata(input: GenerationInput, path: string | null): Promise<{ data: MetadataPayload; etag: string | null }> {
  const generation = queueStoreApi.getState().generation;
  const result = await runMetadataWorker<MetadataPayload>({ apiBaseUrl: input.apiGatewayUrl, token: input.authToken, session: input.session, type: "indexData", path });
  if (generation === queueStoreApi.getState().generation && (queueStoreApi.getState().session === null || queueStoreApi.getState().session === input.session)) {
    if (result.path) queueStoreApi.getState().setPath(input.session, result.path);
    if (path === null || result.etag !== undefined) queueStoreApi.getState().setEtag(input.session, result.etag ?? null);
  }
  return { data: result.data, etag: result.etag ?? null };
}

export function createMetadataClient(config: MetadataConfig): MetadataClient {
  const { apiBaseUrl, onRetry, retryIntervalMs, retryLimit } = config;
  const pagesClient = createPageSegmentsWorkerClient({ apiBaseUrl });
  const auditClient = createAuditWorkerClient({ apiBaseUrl, retryIntervalMs, retryLimit });
  const pagesData = async (token: string, session: string, refresh: boolean) => {
    const request = indexStoreApi.getState().setPageLoading(session);
    const generation = queueStoreApi.getState().generation;
    try {
      const result = await retryWorker(() => pagesClient.pagesData(token, session, refresh ? null : queueStoreApi.getState().session === session ? queueStoreApi.getState().pagePath : null), retryIntervalMs, retryLimit, onRetry);
      if (generation === queueStoreApi.getState().generation && indexStoreApi.getState().activeSession === session && indexStoreApi.getState().pageRequest === request) {
        queueStoreApi.getState().setPagePath(session, result.path);
        if (result.etag !== undefined) queueStoreApi.getState().setPageEtag(session, result.etag);
        indexStoreApi.getState().setPageError(session, null);
      }
      return result.data;
    } catch (error) {
      const failure = error as Error & MetadataError;
      if (generation === queueStoreApi.getState().generation && indexStoreApi.getState().activeSession === session && indexStoreApi.getState().pageRequest === request) {
        indexStoreApi.getState().setPageError(session, { ...(error instanceof ErrorEvent ? { cause: error } : {}), error: failure.message, code: failure.code, details: failure.details, status: failure.status });
      }
      throw error;
    }
  };
  return {
    updatePageSegments: pagesClient.updatePageSegments,
    pagesData,
    async patchIndex(token, session, segment, change) {
      return (await runMetadataWorker<MetadataPatchResult>({ apiBaseUrl, change, segment, session, token, type: "patchIndex" })).data;
    },
    async confirmIndex(token, session, code) {
      return (await runMetadataWorker<MetadataPatchResult>({ apiBaseUrl, code, session, token, type: "confirmIndex" })).data;
    },
    async dropIndex(token, session, code) {
      return (await runMetadataWorker<MetadataPatchResult>({ apiBaseUrl, code, session, token, type: "dropIndex" })).data;
    },
    async indexData(token, session, refresh) {
      if (indexStoreApi.getState().activeSession === null) indexStoreApi.getState().setLoading(session);
      const generation = queueStoreApi.getState().generation;
      const [result, pages] = await Promise.all([
        retryWorker(() => loadMetadata({ apiGatewayUrl: apiBaseUrl, authToken: token, session }, refresh ? null : queueStoreApi.getState().session === session ? queueStoreApi.getState().path : null), retryIntervalMs, retryLimit, onRetry),
        pagesData(token, session, Boolean(refresh)).catch(() => undefined),
      ]);
      if (generation === queueStoreApi.getState().generation && indexStoreApi.getState().activeSession === session) {
        void loadAuditReport({ authToken: token, session, background: true, workerClient: auditClient });
      }
      return { ...result.data, pages };
    },
    async patchStatus(token, session, version) {
      const result = await retryWorker(() => runMetadataWorker<MetadataPatchResult>({ apiBaseUrl, session, token, type: "patchStatus", version }), retryIntervalMs, retryLimit, onRetry);
      return result.data;
    },
    async reprocessSegment(token, session, segment) {
      return (await runMetadataWorker<MetadataReprocessResult>({ apiBaseUrl, segment, session, token, type: "reprocessSegment" })).data;
    },
  };
}
