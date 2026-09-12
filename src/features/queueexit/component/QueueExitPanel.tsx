import { ConfButton, formatLabel } from "aurora-core";
import { useQueueStore } from "../../queue/store/queueStore";
import { useQueueExitStore } from "../store/queueExitStore";
import { queueExitStyles as styles } from "../style/queueExitStyles";

export function QueueExitPanel() {
  const tasks = useQueueStore((state) => state.tasks);
  const decide = useQueueExitStore((state) => state.decide);
  return <section style={styles.root} aria-label="Unfinished index changes">
    <p style={styles.message}>Logging out will cancel these unfinished queue tasks. Requests already sent to the server cannot be undone.</p>
    <ul style={styles.list}>
      {tasks.map((task) => <li key={task.id} style={styles.task}>
        <strong>{task.session} · {formatLabel(task.segment)}</strong>
        <span>{formatLabel(task.status)}</span>
        <ul>{task.changes.slice(task.cursor).map((change) => <li key={change.code}>
          {formatLabel(change.patch?.action ?? change.action)} · {formatLabel(change.index.aspect)}
          <div style={styles.value}>{change.index.value}</div>
        </li>)}</ul>
        {task.cursor === task.changes.length && <span>Refreshing metadata</span>}
      </li>)}
    </ul>
    <div style={styles.actions}>
      <ConfButton label="Stay signed in" variant="secondary" requireConfirmation={false} onConfirm={() => decide(false)} />
      <ConfButton label="Cancel changes and log out" variant="danger" requireConfirmation={false} onConfirm={() => decide(true)} />
    </div>
  </section>;
}
