import type { SessionChoices } from "../../choices/type/choices.types";
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
  PageScope,
} from "aurora-core";

export type MetadataChoice = {
  service: string;
  level: number | string;
};

export type MetadataDeferredState = {
  pageMap: ReadonlyMap<string, string>;
  segment: string | null;
  selectedIndex: MetadataSelected | null;
};

export type MetadataRefresh = {
  id: number;
  segment: string;
  session: string;
};

export type MetadataResponse<T> = { ok: true; data: T; path?: string; etag?: string };

export type MetadataWorkerResult<T> =
  | MetadataResponse<T>
  | ({ ok: false } & MetadataError);

export type MetadataPatchResult = {
  data: string;
  status: "completed" | "error" | "pending" | "processing";
  version: number;
};

export type MetadataReprocessResult = {
  data: string;
  status: "completed";
};

export type MetadataWorkerCommand = ({
  apiBaseUrl: string;
  session: string;
  token: string;
} & (
  | { type: "indexData"; path?: string | null }
  | { type: "patchIndex"; segment: string; change: IndexChange }
  | { segment: string; type: "reprocessSegment" }
  | { code: string; type: "confirmIndex" }
  | { code: string; type: "dropIndex" }
  | { type: "patchStatus"; version: number }
));

export type MetadataClient = {
  pagesData(token: string, session: string, refresh: boolean): Promise<NonNullable<MetadataPayload["pages"]>>;
  updatePageSegments(token: string, session: string, pageCode: string, segments: string[]): Promise<void>;
  patchIndex(token: string, session: string, segment: string, change: IndexChange): Promise<MetadataPatchResult>;
  confirmIndex(token: string, session: string, code: string): Promise<MetadataPatchResult>;
  dropIndex(token: string, session: string, code: string): Promise<MetadataPatchResult>;
  indexData(token: string, session: string, refresh: boolean): Promise<MetadataPayload>;
  patchStatus(token: string, session: string, version: number): Promise<MetadataPatchResult>;
  reprocessSegment(token: string, session: string, segment: string): Promise<MetadataReprocessResult>;
};

export type MetadataConfig = {
  apiBaseUrl: string;
  onRetry?(attempt: number): void;
  retryIntervalMs: number;
  retryLimit: number;
};

export type MetadataStoreState = {
  choices: SessionChoices | null;
  selectSession(session: string): void;
  openSegment: string | null;
  getSegment(pageSegment: string): string;
  activeSession: string | null;
  error: MetadataError | null;
  pageError: MetadataError | null;
  pageRequest: string | null;
  refresh: MetadataRefresh | null;
  refreshId: number;
  retryAttempt: number;
  status: MetadataStatus;
  refreshMetadata(session: string, segment: string): void;
  setError(error: MetadataError): void;
  setPageError(session: string, error: MetadataError | null): void;
  setPageLoading(session: string): string;
  setLoaded(session: string): void;
  setLoading(session: string): void;
  setRetryAttempt(attempt: number): void;
  resetMetadata(): void;
  resetView(): void;
  invalidateSession(session: string): void;
};

export type MetadataProps = {
  onQueueChange(event: QueueTransition): void;
  authToken: string | null;
  apiGatewayUrl: string;
  batchCode: string | null;
  headerActions?: ReactNode;
  callbacks: MetadataCallbacks;
  pageScope?: PageScope | null;
  children?: ReactNode;
  deferredState: MetadataDeferredState;
  intervalMs: number;
  onLoaderChange?(lines: readonly string[] | null): void;
  onReadyChange(ready: boolean): void;
  refresh: MetadataRefresh | null;
  retryLimit: number;
  retryIntervalMs: number;
  segments: MetadataSegments;
  session: string;
  workerClient?: MetadataClient;
};
