import type { MetadataIndex, MetadataPayload, QueueStatus } from "aurora-core";
import type { MetdataPatchResult, MetdataWorkerClient } from "../../metdataview/type/metadataView.types";

export type IndexChange = {
  action: "add" | "update" | "remove";
  allow_enrichment?: boolean;
  explanation: string;
  new_index_label: string | null;
  new_index_aspect: string | null;
  new_index_value: string | null;
  new_index_page?: string | null;
  new_index_source?: string | null;
  new_index_ambiguous: string | null;
  old_index_label: string | null;
  old_index_aspect: string | null;
  old_index_value: string | null;
};

export type QueueRequest = {
  batch: string | null;
  session: string;
  segment: string;
} & ({ data: string } | { action: "confirm" | "drop"; code: string } | { action: "page"; code: string; segments: string[] } | { action: "reprocess" });

export type QueueTransition = {
  session: string;
  batch: string | null;
  status: "queued" | "processing" | "completed" | "failed" | "retried" | "canceled";
  changes: readonly QueueChange[];
  error: string | null;
};

export type QueueRuntime = {
  onChange(event: QueueTransition): void;
  authToken: string;
  intervalMs: number;
  client: MetdataWorkerClient;
};

export type QueueChange = { action: "reprocess"; segment: string } | ({
  code: string;
  index: MetadataIndex;
} & ({ action: "confirm" | "drop" | "patch"; patch: IndexChange | null } | { action: "page"; patch: null; segments: string[] }));

export type QueueTask = {
  id: string;
  batch: string | null;
  session: string;
  segment: string;
  changes: QueueChange[];
  cursor: number;
  result: MetdataPatchResult | null;
  status: "queued" | "processing" | "completed" | "failed";
  error: string | null;
  runtime: QueueRuntime;
};

export type QueueState = {
  snapshots: Record<string, { tasks: Omit<QueueTask, "runtime">[]; queues: QueueStatus[]; bases: Record<string, MetadataPayload>; paths: Record<string, string> }>;
  paths: Record<string, string>;
  generation: number;
  tasks: QueueTask[];
  queues: QueueStatus[];
  restore(scope: string, runtime: QueueRuntime): void;
  enqueue(request: QueueRequest, runtime: QueueRuntime): Promise<{ status: "accepted" }>;
  retry(id: string): Promise<{ status: "accepted" }>;
  cancel(id: string, code?: string): void;
  setMetadata(session: string, metadata: MetadataPayload): void;
  setPath(session: string, path: string): void;
  reset(): void;
};
