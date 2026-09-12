import type { MetadataError, ResourceRequest } from "aurora-core";
import type { MetdataWorkerClient } from "../../metdataview/type/metadataView.types";
import type { SelectedGroup } from "@tabulariumai/aurora-lens";

export type AddIndexSelection = {
  groups: SelectedGroup[];
  pageNumber: number;
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
  onError(error: MetadataError): void;
  onReadyChange(ready: boolean): void;
  onResource(request: ResourceRequest): Promise<unknown>;
  intervalMs: number;
  batchCode: string | null;
  retryIntervalMs: number;
  retryLimit: number;
  segment: string;
  selection: AddIndexSelection;
  session: string;
  workerClient?: MetdataWorkerClient;
};
