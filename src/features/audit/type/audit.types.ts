import type { ResourceRequest } from "aurora-core";

export type AuditStatus = "idle" | "loading" | "refreshing" | "success" | "error";

export type AuditPatch = {
  code: string | null;
  solution: string;
  field: string;
  explanation: string;
  identifier: { value: string | null; label: string | null; aspect: string | null } | null;
  value: string | null;
  label: string | null;
  aspect: string | null;
  ambiguous: string | null;
  source: string | null;
  page: string | null;
  segment: string | null;
  owner: string;
};

export type AuditGap = {
  solution: string;
  explanation: string;
  page: string;
  owner: string;
  timestamp: string;
  segment: string | null;
  patch?: AuditPatch;
};

export type AuditUsageService = {
  name: "extraction" | "iq_refinement" | "refinement" | "model_generation";
  cost: number;
  time?: number;
  page_num: number;
  code: string;
  timestamp: string;
};

export type AuditUsage = {
  services?: AuditUsageService[] | null;
};

export type AuditReport = {
  gaps: AuditGap[];
  usage?: AuditUsage;
};

export type AuditFilters = {
  changeType: string;
  process: string;
  segment: string;
};

export type AuditGapView = {
  aspect: string;
  aspectLabel: string;
  changeType: string;
  changeTypeLabel: string;
  date: string;
  dateLabel: string;
  message: string;
  page: number | string;
  process: string;
  processLabel: string;
  segment: string | null;
  patch?: AuditPatch;
};

export type AuditReportView = {
  changeCounts: {
    add: number;
    correction: number;
    other: number;
    remove: number;
  };
  filtered: number;
  gaps: AuditGapView[];
  processCounts: {
    enrichment: number;
    other: number;
    reprocess: number;
    user: number;
    verification: number;
  };
  segmentCounts: Record<string, number>;
  segmentTotal: number;
  total: number;
};

export type AuditWorkerError = {
  cause?: unknown;
  code?: string;
  details?: unknown;
  error: string;
  status?: number;
};

export type AuditWorkerResult<T> =
  | { ok: true; data: T }
  | ({ ok: false } & AuditWorkerError);

export type AuditWorkerCommand =
  | { apiBaseUrl: string; session: string; token: string; type: "auditData" };

export type AuditWorkerConfig = {
  apiBaseUrl: string;
  onRetry?(attempt: number): void;
  retryIntervalMs: number;
  retryLimit: number;
};

export type AuditWorkerClient = {
  loadReport(token: string, session: string): Promise<AuditReport>;
};

export type AuditCallbacks = {
  onAuditCanceled?: () => void;
  onAuditError?: (error: AuditWorkerError) => void;
  onAuditLoaded?: (report: AuditReport) => void;
};

export type AuditPanelProps = {
  apiGatewayUrl: string;
  authToken: string | null;
  callbacks: AuditCallbacks;
  onResource(request: ResourceRequest): void;
  retryLimit: number;
  retryIntervalMs: number;
  session: string;
  workerClient?: AuditWorkerClient;
};

export type AuditStoreState = {
  activeSession: string | null;
  error: AuditWorkerError | null;
  report: AuditReport | null;
  request: string | null;
  refresh: { id: number; session: string } | null;
  refreshId: number;
  retryAttempt: number;
  status: AuditStatus;
  refreshAudit(session: string): void;
  resetAudit(): void;
  setError(error: AuditWorkerError): void;
  setLoaded(session: string, report: AuditReport): void;
  setLoading(session: string, background: boolean): string;
  setRetryAttempt(attempt: number): void;
  setRefreshing(session: string): void;
};
