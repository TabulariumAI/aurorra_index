import type { MetdataWorkerClient } from "../../metdataview/type/metadataView.types";
export type PageSegmentsWorkerError = {
  code?: string;
  details?: unknown;
  error: string;
  status?: number;
};

export type PageSegmentsWorkerResult<T> =
  | { ok: true; data: T }
  | ({ ok: false } & PageSegmentsWorkerError);

export type PageSegmentsWorkerCommand = {
  apiBaseUrl: string;
  pageCode: string;
  segments: string[];
  session: string;
  token: string;
  type: "updatePageSegments";
};

export type PageSegmentsWorkerClient = {
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
