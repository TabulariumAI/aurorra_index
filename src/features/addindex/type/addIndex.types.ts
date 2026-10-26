import type { QueueTransition } from "../../queue/type/queue.types";
import type { MetadataError, ResourceRequest } from "aurora-core";
import type { MetadataClient } from "../../metdataview/type/metadataView.types";
import type { SelectedGroup } from "@tabulariumai/aurora-lens";

export type AddIndexSelection = {
  groups: SelectedGroup[];
  pageName: string;
};

export type AddIndexRequest = AddIndexSelection | { segment: string };

export type AddIndexStoreState = {
  request: AddIndexRequest | null;
  close(): void;
  open(request: AddIndexRequest): void;
};

export type AddIndexPanelProps = {
  onQueueChange(event: QueueTransition): void;
  apiGatewayUrl: string;
  authToken: string;
  onClose(): void;
  onError(error: MetadataError): void;
  onReadyChange(ready: boolean): void;
  onResource(request: ResourceRequest): void;
  intervalMs: number;
  batchCode: string | null;
  retryIntervalMs: number;
  retryLimit: number;
  segment: string;
  request: AddIndexRequest;
  session: string;
  workerClient?: MetadataClient;
};
