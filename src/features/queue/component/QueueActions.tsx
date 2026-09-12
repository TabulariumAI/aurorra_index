import { ConfButton } from "aurora-core";
import { useQueueStore } from "../store/queueStore";
import { queueStyles } from "../style/queueStyles";

export function QueueActions({ id, code }: { id: string; code: string }) {
  const task = useQueueStore((state) => state.tasks.find((task) => task.id === id));
  const retry = useQueueStore((state) => state.retry);
  const cancel = useQueueStore((state) => state.cancel);
  if (!task || task.status !== "failed") return null;
  return <div style={queueStyles.recovery}>
    <div style={queueStyles.actions}>
      <ConfButton label="Retry change" onConfirm={() => void retry(id)} requireConfirmation={false} showPrompt={false} variant="primary" size="sm" style={queueStyles.button} />
      {task.changes.slice(task.cursor).some((change) => change.code === code) ? <ConfButton label="Cancel change" onConfirm={() => cancel(id, code)} requireConfirmation={false} showPrompt={false} variant="secondary" size="sm" style={queueStyles.button} /> : null}
    </div>
    {task.error ? <div role="alert" title={task.error} style={queueStyles.error}>{task.error}</div> : null}
  </div>;
}
