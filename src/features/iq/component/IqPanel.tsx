import { useEffect, type JSX } from "react";
import { useIqReport } from "../hook/useIqReport";
import { iqStyles } from "../style/iqStyles";
import type { IqPanelProps } from "../type/iq.types";
import { IqGates } from "./IqGates";
import { IqSegments } from "./IqSegments";
import { IqSummary } from "./IqSummary";

function loadingLabel(attempt: number, retryLimit: number): readonly string[] {
  return ["Retrieving IQ report...", `Attempt ${attempt} of ${retryLimit}`];
}

export function IqPanel(props: IqPanelProps): JSX.Element | null {
  const { ackGate, ackingCodes, report, retryAttempt, status, view } = useIqReport(props);
  const loading = status === "loading" || status === "refreshing";

  useEffect(() => {
    props.onReadyChange(!loading && status !== "idle");
  }, [loading, props.onReadyChange, status]);

  useEffect(() => {
    props.onLoaderChange?.(loading ? loadingLabel(retryAttempt, props.retryLimit) : null);
  }, [loading, props.onLoaderChange, props.retryLimit, retryAttempt]);

  if (status === "error" && report === null) {
    return null;
  }

  return (
    <section aria-label="Indexing Quality" style={iqStyles.root}>
      {!loading ? <div data-panel-scroll="true" style={iqStyles.content}>
        {view === null ? (
          <div style={iqStyles.empty}>No IQ report found.</div>
        ) : (
          <>
            <div style={iqStyles.panelHeader}>
              <IqSummary iq={view.iq} />
            </div>
            <div style={iqStyles.divider} />
            <div style={iqStyles.sectionTitle}>Indexing Segments ({view.segments.length})</div>
            <IqSegments segments={view.segments} />
            <IqGates ackingCodes={ackingCodes} gates={view.gates} onAck={ackGate} />
            {view.explanations.length > 0 ? (
              <>
                <div style={{ ...iqStyles.divider, margin: "0.75rem 0 0.5rem" }} />
                <div style={iqStyles.notesTitle}>Notes</div>
                <ul style={iqStyles.notesList}>
                  {view.explanations.map((explanation, index) => (
                    <li key={index}>{explanation}</li>
                  ))}
                </ul>
              </>
            ) : null}
          </>
        )}
      </div> : null}
    </section>
  );
}
