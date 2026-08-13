import type { ReactNode } from "react";

export type IqGateStatus = "PASS" | "FAIL" | "WARNING" | "INFO";
export type IqUiStatus = "success" | "fail" | "warning" | "info";
export type IqDecision = "Pass" | "Review" | "Reject";
export type IqBucket = "green" | "amber" | "red";
export type IqStatus = "idle" | "loading" | "refreshing" | "success" | "error";

export type IqGate = {
  code: string;
  status: IqGateStatus | string;
  description: string;
};

export type IqSegment = {
  segment_name: string;
  expected_weight: number;
  actual_weight: number;
  iq: number;
  explanations: string[];
};

export type IqReport = {
  iq_doc: number;
  decision: IqDecision | string;
  gates: IqGate[];
  segments: IqSegment[];
  explanation: string[];
};

export type IqGateView = {
  code: string;
  status: IqUiStatus;
  description: string;
  isFailure: boolean;
};

export type IqSegmentView = {
  id: string;
  displayId: string;
  expectedWeight: number;
  expectedDisplay: string;
  actualWeight: number;
  actualDisplay: string;
  iq: number;
  iqDisplay: string;
  explanations: string[];
};

export type IqReportView = {
  iq: {
    value: number;
    displayInt: number;
    bucket: IqBucket;
    decision: IqDecision;
  };
  gates: {
    items: IqGateView[];
    total: number;
    success: number;
    ratio: number;
    displayPercent: number;
    bucket: IqBucket;
    decision: IqDecision;
  };
  segments: IqSegmentView[];
  explanations: string[];
};

export type IqWorkerError = {
  code?: string;
  details?: unknown;
  error: string;
  status?: number;
};

export type IqWorkerResult<T> = { ok: true; data: T } | ({ ok: false } & IqWorkerError);

export type IqWorkerCommand =
  | { apiBaseUrl: string; session: string; token: string; type: "iqData" }
  | { apiBaseUrl: string; session: string; token: string; type: "iqPoll" }
  | { apiBaseUrl: string; session: string; token: string; type: "iqStart" }
  | { apiBaseUrl: string; session: string; code: string; token: string; type: "iqAck" };

export type IqWorkerConfig = {
  apiBaseUrl: string;
};

export type IqStartResult = {
  data: unknown;
  isComplete: boolean;
  status: string;
};

export type IqPollResult =
  | { data: null; isComplete: false; status: "pending" | "processing" }
  | { data: IqReport; isComplete: true; status: "completed" };

export type IqAckResult = {
  data: unknown;
  isComplete: true;
  status: string;
};

export type IqWorkerClient = {
  ackGate(token: string, session: string, code: string): Promise<IqAckResult>;
  loadReport(token: string, session: string): Promise<IqReport>;
  pollReport(token: string, session: string): Promise<IqPollResult>;
  startReport(token: string, session: string): Promise<IqStartResult>;
};

export type LoadIqInput = {
  apiGatewayUrl: string;
  authToken: string;
  onError(error: IqWorkerError): void;
  pollIntervalMs?: number;
  restart?: boolean;
  session: string;
  workerClient?: IqWorkerClient;
};

export type IqCallbacks = {
  onIqAck?: (code: string) => void;
  onIqCanceled?: () => void;
  onIqError?: (error: IqWorkerError) => void;
  onIqLoaded?: (report: IqReport) => void;
  onIqRefresh?: (report: IqReport) => void;
  onIqStarted?: (result: IqStartResult) => void;
};

export type IqPanelProps = {
  apiGatewayUrl: string;
  authToken: string | null;
  callbacks: IqCallbacks;
  onLoaderChange?(lines: readonly string[] | null): void;
  onReadyChange(ready: boolean): void;
  previewAction: ReactNode;
  session: string;
  workerClient?: IqWorkerClient;
};

export type IqStoreState = {
  activeSession: string | null;
  ackingCodes: ReadonlySet<string>;
  error: IqWorkerError | null;
  report: IqReport | null;
  status: IqStatus;
  ackStart(code: string): void;
  ackSuccess(code: string): void;
  resetIq(): void;
  setError(error: IqWorkerError): void;
  setLoaded(session: string, report: IqReport): void;
  setLoading(session: string): void;
  setRefreshing(session: string): void;
};
