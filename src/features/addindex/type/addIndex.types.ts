import type { SelectedGroup } from "@tabulariumai/aurora-lens";

export type AddIndexSelection = {
  groups: SelectedGroup[];
  pageNumber: number;
};

export type AddIndexRequest = {
  aspect: string;
  explanation: string;
  label: string;
  segment: string;
  value: string;
};

export type AddIndexComplete = AddIndexRequest & {
  session: string;
};

export type AddIndexResponse = {
  data: string;
  status: "completed" | "error" | "pending" | "processing";
  version: number;
};

export type AddIndexWorkerError = {
  code?: string;
  details?: unknown;
  error: string;
  status?: number;
};

export type AddIndexWorkerResult<T> =
  | { ok: true; data: T }
  | ({ ok: false } & AddIndexWorkerError);

type AddIndexWorkerBase = {
  apiBaseUrl: string;
  session: string;
  token: string;
};

export type AddIndexWorkerCommand =
  | (AddIndexWorkerBase & AddIndexRequest & { type: "addIndex" })
  | (AddIndexWorkerBase & { type: "patchStatus"; version: number });

export type AddIndexWorkerClient = {
  addIndex(token: string, session: string, request: AddIndexRequest): Promise<AddIndexResponse>;
  patchStatus(token: string, session: string, version: number): Promise<AddIndexResponse>;
};

export type AddIndexWorkerConfig = {
  apiBaseUrl: string;
};

export type AddIndexStoreState = {
  selection: AddIndexSelection | null;
  close(): void;
  open(selection: AddIndexSelection): void;
};

export type AddIndexPanelProps = {
  apiGatewayUrl: string;
  authToken: string;
  onClose(): void;
  onComplete(event: AddIndexComplete): void;
  onError(error: AddIndexWorkerError): void;
  onReadyChange(ready: boolean): void;
  intervalMs: number;
  segment: string;
  selection: AddIndexSelection;
  session: string;
  workerClient?: AddIndexWorkerClient;
};
