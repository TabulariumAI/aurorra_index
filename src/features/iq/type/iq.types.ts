import type { ReactNode } from "react";

export type IqGateStatus = "PASS" | "FAIL" | "WARNING" | "INFO";
export type IqUiStatus = "success" | "fail" | "warning";
export type IqBucket = "green" | "amber" | "red";
export type IqStatus = "idle" | "loading" | "refreshing" | "success" | "error";
export type IqPending = { busy: boolean; actions: ReactNode };

export type IqGate = {
  code: string;
  status: IqGateStatus | string;
  description: string;
};

export type IqCue = { code: string; aspect: string; description: string };

export type IqSegment = {
  segment_name: string;
  expected_weight: number;
  actual_weight: number;
  iq: number;
  explanations: string[];
  cues: IqCue[];
};

export type IqNote = {
  segment: string | null;
  message: string;
};

export type IqReport = {
  iq_doc: number;
  gates: IqGate[];
  segments: IqSegment[];
  notes: IqNote[];
};

export type IqGateView = {
  code: string;
  status: IqUiStatus;
  description: string;
  isFailure: boolean;
  label: string;
  clearable: boolean;
};

export type IqSection<T> = { data: T; error: null } | { data: null; error: string };

export type IqSegmentView = {
  id: string;
  displayId: string;
  expectedWeight: number;
  expectedDisplay: string;
  actualWeight: number;
  actualDisplay: string;
  iq: number;
  iqDisplay: string;
  explanations: IqSection<string[]>;
  cues: IqSection<IqCue[]>;
};

export type IqNoteView = IqNote & {
  status: "success" | "warning" | "neutral";
};

export type IqReportView = {
  iq: IqSection<{
    value: number;
    displayInt: number;
    bucket: IqBucket;
  }>;
  gates: IqSection<{
    items: IqGateView[];
    total: number;
    success: number;
    ratio: number;
    displayPercent: number;
    bucket: IqBucket;
  }>;
  segments: IqSection<IqSegmentView[]>;
  notes: IqSection<IqNoteView[]>;
};

export type IqWorkerError = {
  cause?: unknown;
  code?: string;
  details?: unknown;
  error: string;
  status?: number;
};

export type IqWorkerResult<T> = { ok: true; data: T } | ({ ok: false } & IqWorkerError);

export type IqWorkerEvent = { type: "iqDownload" };

export type IqWorkerCommand = { apiBaseUrl: string; session: string; token: string } & (
  | { type: "iqData"; etag: string | null }
  | { type: "iqAck"; code: string }
  | { type: "iqCueAck"; code: string }
);

export type IqWorkerConfig = {
  apiBaseUrl: string;
  onDownload?(): void;
  onRetry?(attempt: number): void;
  retryIntervalMs: number;
  retryLimit: number;
};

export type IqAckResult = {
  etag: string;
  data: unknown;
  isComplete: true;
  status: string;
};

export type IqWorkerClient = {
  ackGate(token: string, session: string, code: string): Promise<IqAckResult>;
  ackCue(token: string, session: string, code: string): Promise<IqAckResult>;
  loadReport(token: string, session: string, etag: string | null): Promise<IqResource>;
};

export type IqModel = { class: string; jurisdiction: string | null; etag: string };
export type IqResource = { etag?: string; reportEtag?: string; acknowledgements?: { code: string; status: string }[]; report: IqReport; metadataEtag?: string; verificationEtag?: string; verificationModel?: IqModel };

export type LoadIqInput = {
  apiGatewayUrl: string;
  authToken: string;
  retryIntervalMs: number;
  onError(error: IqWorkerError): void;
  onComplete?(report: IqReport): void;
  retryLimit: number;
  session: string;
  workerClient?: IqWorkerClient;
};

export type IqTransition = {
  id: string;
  session: string;
  kind: "gates" | "cues";
  code: string;
  error: string | null;
  status: "queued" | "processing" | "failed" | "completed" | "retried" | "canceled";
};

export type IqCallbacks = {
  onIqChange?: (event: IqTransition) => void;
  onIqAck?: (code: string) => void;
  onIqCanceled?: () => void;
  onIqError?: (error: IqWorkerError) => void;
  onIqLoaded?: (report: IqReport) => void;
  onIqRefresh?: (report: IqReport) => void;
};

export type IqPanelProps = {
  apiGatewayUrl: string;
  authToken: string | null;
  callbacks: IqCallbacks;
  retryLimit: number;
  retryIntervalMs: number;
  session: string;
  workerClient?: IqWorkerClient;
};

export type IqStoreState = {
  etag: string | null | undefined;
  reportEtag: string | null | undefined;
  removedCodes: Set<string>;
  metadataEtag: string | null | undefined;
  verificationEtag: string | null | undefined;
  verificationModel: IqModel | null | undefined;
  generation: number;
  reportGeneration: number;
  activeSession: string | null;
  error: IqWorkerError | null;
  report: IqReport | null;
  retryAttempt: number;
  status: IqStatus;
  resetIq(): void;
  setError(error: IqWorkerError): void;
  setLoaded(session: string, report: IqReport, metadataEtag?: string, verificationEtag?: string, verificationModel?: IqModel, source?: Pick<IqResource, "etag" | "reportEtag" | "acknowledgements">): void;
  setAcknowledged(code: string, etag: string): void;
  setVerificationModel(session: string, model: IqModel): void;
  setLoading(session: string, refresh: boolean): void;
  setRetryAttempt(attempt: number): void;
};
