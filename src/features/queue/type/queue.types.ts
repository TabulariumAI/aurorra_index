import type { MetadataIndex, MetadataPayload, QueueNotice } from "aurora-core";
import type { MetdataPatchResult, MetdataWorkerClient } from "../../metdataview/type/metadataView.types";

export type IndexChange = {
  action: "add" | "update" | "remove";
  explanation: string;
  new_index_label: string | null;
  new_index_aspect: string | null;
  new_index_value: string | null;
  new_index_ambiguous: string | null;
  old_index_label: string | null;
  old_index_aspect: string | null;
  old_index_value: string | null;
};

export type QueueRequest = {
  batch: string | null;
  session: string;
  segment: string;
} & ({ data: string } | { action: "confirm" | "drop"; code: string } | { action: "page"; code: string; segments: string[] });

export type QueueRuntime = {
  authToken: string;
  intervalMs: number;
  client: MetdataWorkerClient;
};

export type QueueChange = {
  code: string;
  index: MetadataIndex;
} & ({ action: "confirm" | "drop" | "patch"; patch: IndexChange | null } | { action: "page"; patch: null; segments: string[] });

export type QueueTask = {
  id: string;
  batch: string | null;
  session: string;
  segment: string;
  changes: QueueChange[];
  cursor: number;
  result: MetdataPatchResult | null;
  status: "queued" | "processing" | "failed";
  error: string | null;
  runtime: QueueRuntime;
};

export type QueueState = {
  snapshots: Record<string, { tasks: Omit<QueueTask, "runtime">[]; queues: QueueNotice[]; bases: Record<string, MetadataPayload> }>;
  tasks: QueueTask[];
  queues: QueueNotice[];
  restore(scope: string, runtime: QueueRuntime): void;
  enqueue(request: QueueRequest, runtime: QueueRuntime): Promise<{ status: "accepted" }>;
  retry(id: string): Promise<{ status: "accepted" }>;
  cancel(id: string, code: string): void;
  setMetadata(session: string, metadata: MetadataPayload): void;
  reset(): void;
};
