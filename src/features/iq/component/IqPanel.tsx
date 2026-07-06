import { ProgressBar } from "aurorra-ui";
import type { JSX } from "react";
import { useIqReport } from "../hook/useIqReport";
import { iqStyles } from "../style/iqStyles";
import type { IqPanelProps } from "../type/iq.types";
import { IqGates } from "./IqGates";
import { IqSegments } from "./IqSegments";
import { IqSummary } from "./IqSummary";

export function IqPanel(props: IqPanelProps): JSX.Element | null {
  const { ackGate, ackingCodes, report, status, view } = useIqReport(props);
  const loading = status === "loading" || status === "refreshing";

  if (status === "error" && report === null) {
    return null;
  }

  return (
    <section aria-label="Indexing Quality" style={iqStyles.root}>
      {loading ? (
        <div style={iqStyles.progressOverlay}>
          <ProgressBar
            ariaLabel="IQ progress"
            continuous
            durationMs={10000}
            label="Retrieving IQ report..."
            running
            showText={false}
            visible
          />
        </div>
      ) : null}
      <div style={iqStyles.content}>
        {view === null ? (
          <>
            <div style={iqStyles.panelHeader}>{props.previewAction}</div>
            <div style={iqStyles.empty}>No IQ report found.</div>
          </>
        ) : (
          <>
            <div style={iqStyles.panelHeader}>
              <IqSummary iq={view.iq} />
              {props.previewAction}
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
      </div>
    </section>
  );
}
