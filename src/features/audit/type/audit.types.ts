export type AuditStatus = "idle" | "loading" | "refreshing" | "success" | "error";

export type AuditGap = {
  solution: string;
  explanation: string;
  page: string;
  owner: string;
  timestamp: string;
  segment: string | null;
};

export type AuditUsage = {
  costs: string[];
};

export type AuditReport = {
  gaps: AuditGap[];
  usage?: AuditUsage;
};

export type AuditFilters = {
  changeType: string;
  process: string;
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
  total: number;
  usageCosts: string[];
};

export type AuditWorkerError = {
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
  onLoaderChange?(lines: readonly string[] | null): void;
  onReadyChange(ready: boolean): void;
  retryLimit: number;
  retryIntervalMs: number;
  session: string;
  workerClient?: AuditWorkerClient;
};

export type AuditStoreState = {
  activeSession: string | null;
  error: AuditWorkerError | null;
  report: AuditReport | null;
  refresh: { id: number; session: string } | null;
  refreshId: number;
  retryAttempt: number;
  status: AuditStatus;
  refreshAudit(session: string): void;
  resetAudit(): void;
  setError(error: AuditWorkerError): void;
  setLoaded(session: string, report: AuditReport): void;
  setLoading(session: string): void;
  setRetryAttempt(attempt: number): void;
  setRefreshing(session: string): void;
};
