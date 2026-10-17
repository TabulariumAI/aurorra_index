import { ChangeRecovery } from "aurora-core";
import { useQueueStore } from "../store/queueStore";

export function QueueActions({ id, code }: { id: string; code?: string }) {
  const task = useQueueStore((state) => state.tasks.find((task) => task.id === id));
  const retry = useQueueStore((state) => state.retry);
  const cancel = useQueueStore((state) => state.cancel);
  if (!task || task.status !== "failed") return null;
  return <ChangeRecovery error={task.error} onRetry={() => void retry(id)}
    onCancel={task.changes.slice(task.cursor).some((change) => change.action === "reprocess" ? code === undefined : change.code === code) ? () => cancel(id, code) : undefined} />;
}
