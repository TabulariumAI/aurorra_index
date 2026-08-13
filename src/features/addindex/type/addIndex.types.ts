import type { SelectedGroup } from "@tabulariumai/aurora-lens";

export type AddIndexSelection = {
  groups: SelectedGroup[];
  pageNumber: number;
};

export type AddIndexRequest = {
  aspect: string;
  source: string;
  value: string;
};

export type AddIndexComplete = AddIndexRequest & {
  session: string;
};

export type AddIndexResponse = {
  accepted: true;
  description: string;
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

export type AddIndexWorkerCommand = AddIndexRequest & {
  apiBaseUrl: string;
  session: string;
  token: string;
  type: "addIndex";
};

export type AddIndexWorkerClient = {
  addIndex(token: string, session: string, request: AddIndexRequest): Promise<AddIndexResponse>;
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
  selection: AddIndexSelection;
  session: string;
  workerClient?: AddIndexWorkerClient;
};
