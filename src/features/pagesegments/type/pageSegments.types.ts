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

export type PageSegmentsComplete = {
  pageCode: string;
  session: string;
  segments: string[];
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
  apiGatewayUrl: string;
  authToken: string;
  choices: unknown;
  onClose: () => void;
  onComplete: (event: PageSegmentsComplete) => void;
  onError: (event: PageSegmentsFailure) => void;
  onReadyChange(ready: boolean): void;
  pageClass: string;
  pageCode: string;
  segments: string[];
  session: string;
  workerClient?: PageSegmentsWorkerClient;
};
