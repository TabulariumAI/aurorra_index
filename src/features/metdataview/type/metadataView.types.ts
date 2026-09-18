import type { QueueTransition } from "../../queue/type/queue.types";
import type { IndexChange } from "../../queue/type/queue.types";
import type { ReactNode } from "react";
import type {
  MetadataCallbacks,
  MetadataSelected,
  MetadataSegments,
  MetadataPayload,
  MetadataStatus,
  MetadataError,
} from "aurora-core";

export type MetdataChoice = {
  service: string;
  level: number | string;
};

export type MetdataDeferredState = {
  pageMap: ReadonlyMap<string, string>;
  segment: string | null;
  selectedIndex: MetadataSelected | null;
};

export type MetdataMetadataRefresh = {
  id: number;
  segment: string;
  session: string;
};

export type MetdataWorkerResult<T> =
  | { ok: true; data: T }
  | ({ ok: false } & MetadataError);

export type MetdataPatchResult = {
  data: string;
  status: "completed" | "error" | "pending" | "processing";
  version: number;
};

export type MetdataReprocessResult = {
  data: string;
  status: "completed";
};

export type MetdataWorkerCommand = ({
  apiBaseUrl: string;
  session: string;
  token: string;
} & (
  | { type: "indexData" }
  | { type: "patchIndex"; segment: string; change: IndexChange }
  | { segment: string; type: "reprocessSegment" }
  | { code: string; type: "confirmIndex" }
  | { code: string; type: "dropIndex" }
  | { type: "patchStatus"; version: number }
));

export type MetdataWorkerClient = {
  updatePageSegments(token: string, session: string, pageCode: string, segments: string[]): Promise<void>;
  patchIndex(token: string, session: string, segment: string, change: IndexChange): Promise<MetdataPatchResult>;
  confirmIndex(token: string, session: string, code: string): Promise<MetdataPatchResult>;
  dropIndex(token: string, session: string, code: string): Promise<MetdataPatchResult>;
  indexData(token: string, session: string): Promise<MetadataPayload>;
  patchStatus(token: string, session: string, version: number): Promise<MetdataPatchResult>;
  reprocessSegment(token: string, session: string, segment: string): Promise<MetdataReprocessResult>;
};

export type MetdataWorkerConfig = {
  apiBaseUrl: string;
  onRetry?(attempt: number): void;
  retryIntervalMs: number;
  retryLimit: number;
};

export type MetdataStoreState = {
  openSegment: string | null;
  getSegment(pageSegment: string): string;
  activeSession: string | null;
  error: MetadataError | null;
  refresh: MetdataMetadataRefresh | null;
  refreshId: number;
  retryAttempt: number;
  status: MetadataStatus;
  refreshMetadata(session: string, segment: string): void;
  setError(error: MetadataError): void;
  setLoaded(session: string): void;
  setLoading(session: string): void;
  setRetryAttempt(attempt: number): void;
  resetMetadata(): void;
  resetView(): void;
  invalidateSession(session: string): void;
};

export type MetdataMetadataProps = {
  onQueueChange(event: QueueTransition): void;
  authToken: string | null;
  apiGatewayUrl: string;
  batchCode: string | null;
  headerActions?: ReactNode;
  callbacks: MetadataCallbacks;
  choices: unknown;
  children?: ReactNode;
  deferredState: MetdataDeferredState;
  intervalMs: number;
  onLoaderChange?(lines: readonly string[] | null): void;
  onReadyChange(ready: boolean): void;
  refresh: MetdataMetadataRefresh | null;
  retryLimit: number;
  retryIntervalMs: number;
  segments: MetadataSegments;
  session: string;
  workerClient?: MetdataWorkerClient;
};
