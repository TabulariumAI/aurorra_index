import { ErrorBoundary } from "aurora-core";
import type { JSX } from "react";
import { useIqReport } from "../hook/useIqReport";
import { iqStyles } from "../style/iqStyles";
import type { IqPanelProps, IqReportView } from "../type/iq.types";
import { IqGates } from "./IqGates";
import { IqSegments } from "./IqSegments";
import { IqSummary } from "./IqSummary";
import { IqPlaceholder } from "./IqPlaceholder";
import { IqProgress } from "./IqProgress";

export function IqPanel(props: IqPanelProps): JSX.Element | null {
  const { ackGate, ackingCodes, report, retryAttempt, status, view } = useIqReport(props);
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
        {loading ? <IqPlaceholder /> : view === null ? (
          <div style={iqStyles.empty}>No IQ report found.</div>
        ) : (
          <>
            <div style={iqStyles.panelHeader}>
              <ErrorBoundary title="IQ summary" resetKey={report}><IqSummary view={view} /></ErrorBoundary>
            </div>
            <div style={iqStyles.divider} />
            <ErrorBoundary title="Indexing segments" resetKey={report}><IqSegments view={view} /></ErrorBoundary>
            <ErrorBoundary title="Compliance gates" resetKey={report}><IqGates ackingCodes={ackingCodes} view={view} onAck={ackGate} /></ErrorBoundary>
            <ErrorBoundary title="IQ notes" resetKey={report}><IqNotes view={view} /></ErrorBoundary>
          </>
        )}
      </div>
    </section>
  );
}

function IqNotes({ view }: { view: Pick<IqReportView, "explanations"> }) {
  const { explanations } = view;
  return explanations.length > 0 ? <>
    <div style={{ ...iqStyles.divider, margin: "0.75rem 0 0.5rem" }} />
    <div style={iqStyles.notesTitle}>Notes</div>
    <ul style={iqStyles.notesList}>{explanations.map((explanation, index) => <li key={index}>{explanation}</li>)}</ul>
  </> : null;
}
