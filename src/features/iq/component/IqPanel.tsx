import type { JSX } from "react";
import { ChangeRecovery } from "aurora-core";
import { useIqReport } from "../hook/useIqReport";
import { iqStyles } from "../style/iqStyles";
import type { IqPanelProps, IqPending } from "../type/iq.types";
import { IqView } from "./IqView";
import { IqProgress } from "./IqProgress";
import { iqQueueStore } from "../store/iqQueueStore";

export function IqPanel(props: IqPanelProps): JSX.Element | null {
  const { ackCue, ackGate, loadReport, report, retryAttempt, status, view } = useIqReport(props);
  const loading = status === "idle" || status === "loading";
  const tasks = iqQueueStore(state => state.tasks);
  const pendingChanges = new Map<string, IqPending>(tasks.filter(task => task.session === props.session).map(task => [task.code, {
    busy: task.status !== "failed",
    actions: task.status === "failed" ? <ChangeRecovery error={task.error}
      onRetry={() => iqQueueStore.getState().retry(task.id)} onCancel={() => iqQueueStore.getState().cancel(task.id)} /> : null,
  }]));

  if (status === "refreshing") {
    return <IqProgress key={`${props.session}-${retryAttempt}-generate`} intervalMs={props.retryIntervalMs} />;
  }

  if (status === "error" && report === null) {
    return null;
  }

  return (
    <section aria-label="Indexing Quality" style={iqStyles.root}>
      {!loading && view === null ? (
        <div style={iqStyles.empty}>No IQ report found.</div>
      ) : (
        <IqView key={props.session} view={loading ? null : view} pendingChanges={pendingChanges} onAck={ackGate} onAckCue={ackCue} onRetry={loadReport} />
      )}
    </section>
  );
}
