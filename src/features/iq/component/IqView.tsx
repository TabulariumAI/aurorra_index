import * as Tooltip from "@radix-ui/react-tooltip";
import { ConfButton, ErrorBadge, ErrorBoundary, LoadError, SuccessIcon } from "aurora-core";
import type { JSX } from "react";
import { iqColors, iqStyles } from "../style/iqStyles";
import type { IqReportView } from "../type/iq.types";

export function IqView({ view, ackingCodes, onAck, onRetry }: {
  view: IqReportView;
  ackingCodes: ReadonlySet<string>;
  onAck: (code: string) => void;
  onRetry?: () => void;
}): JSX.Element {
  const { iq, gates, segments, explanations } = view;
  return <>
    <div style={iqStyles.panelHeader}>
      <ErrorBoundary title="IQ summary" resetKey={view}>
        {iq.error !== null ? <LoadError title="IQ summary" detail={iq.error} onRetry={onRetry} /> : (
          <div style={iqStyles.summaryCard}>
            <div>
              <div style={{ ...iqStyles.metricNumber, color: iqColors[iq.data.bucket].fg }}>{iq.data.displayInt}%</div>
              <div style={iqStyles.metricSubtext}>out of 100</div>
            </div>
            <div>
              <div style={iqStyles.metricLabel}>Indexing Quality (IQ)</div>
              <div style={iqStyles.metricTrack}><div style={iqStyles.metricFill(iq.data.bucket, iq.data.value)} /></div>
            </div>
          </div>
        )}
      </ErrorBoundary>
    </div>
    <div style={iqStyles.divider} />
    <ErrorBoundary title="Indexing segments" resetKey={view}>
      {segments.error !== null ? <LoadError title="Indexing segments" detail={segments.error} onRetry={onRetry} /> : <>
        <div style={iqStyles.sectionTitle}>Indexing Segments ({segments.data.length})</div>
        <table style={iqStyles.segmentTable}>
          <thead><tr>
            <th style={iqStyles.segmentHeaderCell("left")}>Segment</th>
            <th style={iqStyles.segmentHeaderCell("right")}>Expected</th>
            <th style={iqStyles.segmentHeaderCell("right")}>Actual</th>
            <th style={iqStyles.segmentHeaderCell("right")}>IQ</th>
          </tr></thead>
          <tbody>
            {segments.data.map(segment => <tr key={segment.id}>
              <td style={iqStyles.segmentCell("left")}>{segment.displayId}</td>
              <td style={iqStyles.segmentCell("right")}>{segment.expectedDisplay}</td>
              <td style={iqStyles.segmentCell("right")}>{segment.actualDisplay}</td>
              <td style={iqStyles.segmentCell("right", true)}>{segment.iqDisplay}</td>
            </tr>)}
          </tbody>
        </table>
        {segments.data.map(segment => <ErrorBoundary key={segment.id} title={segment.displayId} resetKey={segment}
          fallback={error => <ErrorBadge label={segment.displayId} error={error.message} />}>
          {segment.explanations.error !== null ? <ErrorBadge label={segment.displayId} error={segment.explanations.error} /> : segment.explanations.data.length > 0 ? (
            <div style={iqStyles.explanationBlock}>
              <div style={iqStyles.explanationTitle}>Segment: {segment.displayId}</div>
              <ul style={iqStyles.explanationList}>
                {segment.explanations.data.map((explanation, index) => <li key={index}>{explanation}</li>)}
              </ul>
            </div>
          ) : null}
        </ErrorBoundary>)}
      </>}
    </ErrorBoundary>
    <ErrorBoundary title="Compliance gates" resetKey={view}>
      {gates.error !== null ? <LoadError title="Compliance gates" detail={gates.error} onRetry={onRetry} /> : (
        <Tooltip.Provider delayDuration={250}>
          <div style={{ ...iqStyles.summaryCard, margin: "1rem 0 0.25rem" }}>
            <div>
              <div style={{ ...iqStyles.metricNumber, color: iqColors[gates.data.bucket].fg }}>{gates.data.displayPercent}%</div>
              <div style={iqStyles.metricSubtext}>out of {gates.data.total} gates</div>
            </div>
            <div>
              <div style={iqStyles.metricLabel}>Compliance Gates</div>
              <div style={iqStyles.metricTrack}><div style={iqStyles.metricFill(gates.data.bucket, gates.data.displayPercent)} /></div>
            </div>
          </div>
          <div style={iqStyles.sectionTitle}>Compliance Gates ({gates.data.total})</div>
          {gates.data.items.length === 0 ? <div style={iqStyles.empty}>None</div> : (
            <ul style={iqStyles.gateList}>
              {gates.data.items.map(gate => <li data-gate-code={gate.code} key={gate.code} style={iqStyles.gateRow}>
                <div style={iqStyles.gateStatus}>
                  {gate.status === "success" ? <SuccessIcon /> : <span aria-hidden="true" style={iqStyles.gateFlag(gate.status)} />}
                  <span>{gate.label}</span>
                </div>
                <span style={iqStyles.gateText}>{gate.description}</span>
                <div style={iqStyles.gateAction}>
                  {gate.clearable ? <Tooltip.Root>
                    <Tooltip.Trigger asChild>
                      <ConfButton
                        aria-label="Clear gate"
                        disabled={ackingCodes.has(gate.code)}
                        label={
                          <svg aria-hidden="true" viewBox="0 0 24 24" width="1.15rem" height="1.15rem" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
                            <path d="m16 3 5 5a2 2 0 0 1 0 3l-9 9H7l-4-4a2 2 0 0 1 0-3L13 3a2 2 0 0 1 3 0Z" />
                            <path d="m8 8 8 8M12 20h9" />
                          </svg>
                        }
                        onConfirm={() => onAck(gate.code)}
                        size="icon"
                        variant="danger"
                      />
                    </Tooltip.Trigger>
                    <Tooltip.Portal>
                      <Tooltip.Content sideOffset={6} style={{ background: "#0f172a", borderRadius: "0.2rem", color: "#fff", fontSize: "0.75rem", padding: "0.35rem 0.5rem", zIndex: 60 }}>
                        Clear gate
                      </Tooltip.Content>
                    </Tooltip.Portal>
                  </Tooltip.Root> : null}
                </div>
              </li>)}
            </ul>
          )}
        </Tooltip.Provider>
      )}
    </ErrorBoundary>
    <ErrorBoundary title="IQ notes" resetKey={view}>
      {explanations.error !== null ? <LoadError title="IQ notes" detail={explanations.error} onRetry={onRetry} /> : explanations.data.length > 0 ? <>
        <div style={{ ...iqStyles.divider, margin: "0.75rem 0 0.5rem" }} />
        <div style={iqStyles.notesTitle}>Notes</div>
        <ul style={iqStyles.notesList}>{explanations.data.map((explanation, index) => <li key={index}>{explanation}</li>)}</ul>
      </> : null}
    </ErrorBoundary>
  </>;
}
