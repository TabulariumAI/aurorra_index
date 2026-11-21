import type { ExitBlocker, ExitReason, QueueStatus } from "aurora-core";
import type { IqWorkerClient, IqTransition } from "./iq.types";

export type IqTask = Omit<IqTransition, "status"> & {
  status: "queued" | "processing" | "failed";
  runtime: IqQueueRuntime;
};
export type IqQueueRuntime = {
  authToken: string;
  client: IqWorkerClient;
  onChange(event: IqTransition): void;
  onComplete?(code: string): void;
};
type IqSnapshot = { tasks: Omit<IqTask, "runtime">[]; queues: QueueStatus[] };
export type IqQueueState = {
  tasks: IqTask[];
  queues: QueueStatus[];
  snapshots: Record<string, IqSnapshot>;
  restore(owner: string, runtime: IqQueueRuntime): void;
  enqueue(session: string, kind: IqTask["kind"], code: string, runtime: IqQueueRuntime): void;
  retry(id: string): void;
  cancel(id: string): void;
  getBlockers(reason: ExitReason): ExitBlocker[];
  reset(): void;
};
