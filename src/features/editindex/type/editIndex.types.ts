import type { MetadataError, MetadataIndex, ResourceRequest } from "aurora-core";
import type { MetdataWorkerClient } from "../../metdataview/type/metadataView.types";

export type EditIndexRequest = { index: MetadataIndex; segment: string; session: string };
export type EditIndexStoreState = {
  request: EditIndexRequest | null;
  open(request: EditIndexRequest): void;
  close(): void;
};
export type EditIndexPanelProps = {
  apiGatewayUrl: string;
  authToken: string;
  batchCode: string | null;
  intervalMs: number;
  retryIntervalMs: number;
  retryLimit: number;
  request: EditIndexRequest;
  onClose(): void;
  onError(error: MetadataError): void;
  onReadyChange(ready: boolean): void;
  onResource(request: ResourceRequest): Promise<unknown>;
  workerClient?: MetdataWorkerClient;
};
