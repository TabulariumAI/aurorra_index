import type { MetadataPayload } from "aurora-core";
import type { QueueTransition } from "../../queue/type/queue.types";
import type { MetdataWorkerClient } from "../../metdataview/type/metadataView.types";
export type PageSegmentsWorkerError = {
  code?: string;
  details?: unknown;
  error: string;
  status?: number;
};

export type PageSegmentsWorkerResult<T> =
  | { ok: true; data: T; path?: string; etag?: string }
  | ({ ok: false } & PageSegmentsWorkerError);

export type PagesData = NonNullable<MetadataPayload["pages"]>;

export type PageSegmentsWorkerCommand = {
  apiBaseUrl: string;
  session: string;
  token: string;
} & ({ type: "updatePageSegments"; pageCode: string; segments: string[] } | { type: "pagesData"; path?: string | null });

export type PageSegmentsWorkerClient = {
  pagesData(token: string, session: string, path?: string | null): Promise<{ data: PagesData; path: string; etag?: string }>;
  updatePageSegments(token: string, session: string, pageCode: string, segments: string[]): Promise<void>;
};

export type PageSegmentsWorkerConfig = {
  apiBaseUrl: string;
};

export type PageSegmentsRequest = {
  code: string;
  pageClass: string;
  segments: string[];
};

export type PageSegmentsFailure = {
  error: PageSegmentsWorkerError;
  pageCode: string;
  session: string;
};

export type PageSegmentsPanelProps = {
  onQueueChange(event: QueueTransition): void;
  batchCode: string | null;
  intervalMs: number;
  retryIntervalMs: number;
  retryLimit: number;
  apiGatewayUrl: string;
  authToken: string;
  choices: unknown;
  onClose: () => void;
  onError: (event: PageSegmentsFailure) => void;
  onReadyChange(ready: boolean): void;
  pageClass: string;
  pageCode: string;
  segments: string[];
  session: string;
  workerClient?: MetdataWorkerClient;
};
