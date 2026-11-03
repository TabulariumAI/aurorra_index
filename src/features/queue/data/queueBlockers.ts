import { formatLabel, type ExitBlocker, type ExitReason } from "aurora-core";
import { queueStoreApi } from "../store/queueStore";

export function getBlockers(_reason: ExitReason): ExitBlocker[] {
  const { tasks } = queueStoreApi.getState();
  if (!tasks.length) return [];
  return [{ id: "index", title: "Index changes", items: tasks.map(task => {
    const changes = task.changes.slice(task.cursor).map(change => change.action === "reprocess"
      ? "Reprocess" : `${formatLabel(change.patch?.action ?? change.action)} · ${formatLabel(change.index.aspect)} · ${change.index.value}`);
    return `${task.session} · ${formatLabel(task.segment)} · ${formatLabel(task.status)} · ${changes.length ? changes.join("; ") : "Refreshing metadata"}`;
  }), cancel: () => queueStoreApi.getState().reset() }];
}
