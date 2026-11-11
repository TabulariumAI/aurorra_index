import type { JSX } from "react";
import { useIqReport } from "../hook/useIqReport";
import { iqStyles } from "../style/iqStyles";
import type { IqPanelProps } from "../type/iq.types";
import { IqView } from "./IqView";
import { IqPlaceholder } from "./IqPlaceholder";
import { IqProgress } from "./IqProgress";

export function IqPanel(props: IqPanelProps): JSX.Element | null {
  const { ackGate, ackingCodes, loadReport, report, retryAttempt, status, view } = useIqReport(props);
  const loading = status === "idle" || status === "loading";

  if (status === "refreshing") {
    return <IqProgress key={`${props.session}-${retryAttempt}`} intervalMs={props.retryIntervalMs} />;
  }

  if (status === "error" && report === null) {
    return null;
  }

  return (
    <section aria-label="Indexing Quality" style={iqStyles.root}>
      <div data-panel-scroll="true" style={iqStyles.content}>
        {loading ? <IqPlaceholder key={props.session} /> : view === null ? (
          <div style={iqStyles.empty}>No IQ report found.</div>
        ) : (
          <IqView view={view} ackingCodes={ackingCodes} onAck={ackGate} onRetry={loadReport} />
        )}
      </div>
    </section>
  );
}
