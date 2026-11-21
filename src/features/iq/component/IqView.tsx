import { ErrorBadge, ErrorBoundary, LoadError, metadataSpinnerCss, SuccessIcon, useTabs } from "aurora-core";
import type { JSX } from "react";
import { Fragment } from "react";
import { iqColors, iqCss, iqStyles } from "../style/iqStyles";
import type { IqPending, IqReportView } from "../type/iq.types";

import { IqRow } from "./IqRow";
import { IqNotes } from "./IqNotes";
import { IqPlaceholder } from "./IqPlaceholder";

const iqTabs = ["Quality", "Compliance", "Notes"];

export function IqView({ view, pendingChanges, onAck, onAckCue, onRetry }: {
  view: IqReportView | null;
  pendingChanges: ReadonlyMap<string, IqPending>;
  onAck: (code: string) => void;
  onAckCue: (code: string) => void;
  onRetry?: () => void;
}): JSX.Element {
  const { active, controls, panel } = useTabs(iqTabs, "IQ views", {
    storageKey: "aurorra-index:iq-tab",
    className: "iq-tabs", style: iqStyles.tabs, tabStyle: iqStyles.tab, hideSingle: false,
  });
  if (view === null) return <>
    <style>{iqCss}</style>
    {controls}
    <div data-panel-scroll="true" style={iqStyles.content}>
      <div {...panel} className="iq-content">
        {iqTabs.map(tab => <div key={tab} hidden={active !== tab}><IqPlaceholder tab={tab} /></div>)}
      </div>
    </div>
  </>;
  const { iq, gates, segments, notes } = view;
  return <>
    <style>{iqCss}{metadataSpinnerCss}</style>
    {controls}
    <div data-panel-scroll="true" style={iqStyles.content}>
      <div {...panel} className="iq-content">
        <div hidden={active !== "Quality"}>
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
            {(segment.explanations.error !== null || segment.cues.error !== null || segment.explanations.data.length > 0 || segment.cues.data.length > 0) ? (
              <div data-status="warning" style={iqStyles.explanationBlock}>
                <div style={iqStyles.explanationTitle}>Segment: {segment.displayId}</div>
                {segment.explanations.error !== null ? <ErrorBadge label={segment.displayId} error={segment.explanations.error} /> : segment.explanations.data.length > 0 ? (
                  <ul style={iqStyles.explanationList}>
                    {segment.explanations.data.map((explanation, index) => <li key={index}>{explanation}</li>)}
                  </ul>
                ) : null}
                {segment.cues.error !== null ? <ErrorBadge label={`${segment.displayId} cues`} error={segment.cues.error} /> : (
                  <ul style={iqStyles.gateList}>
                    {segment.cues.data.map(cue => <IqRow key={cue.code} code={cue.code} cue={true}
                      pending={pendingChanges.get(cue.code)} onAck={onAckCue}>{cue.description}</IqRow>)}
                  </ul>
                )}
              </div>
            ) : null}
          </ErrorBoundary>)}
        </>}
      </ErrorBoundary>
      </div>
        <div hidden={active !== "Compliance"}>
          <ErrorBoundary title="Compliance gates" resetKey={view}>
            {gates.error !== null ? <LoadError title="Compliance gates" detail={gates.error} onRetry={onRetry} /> : (
              <>
                <div style={iqStyles.summaryCard}>
                  <div>
                    <div style={{ ...iqStyles.metricNumber, color: iqColors[gates.data.bucket].fg }}>{gates.data.displayPercent}%</div>
                    <div style={iqStyles.metricSubtext}>out of {gates.data.total} gates</div>
                  </div>
                  <div>
                    <div style={iqStyles.metricLabel}>Compliance Gates</div>
                    <div style={iqStyles.metricTrack}><div style={iqStyles.metricFill(gates.data.bucket, gates.data.displayPercent)} /></div>
                  </div>
                </div>
                {gates.data.items.length === 0 ? <div style={iqStyles.empty}>None</div> : (
                  <ul style={iqStyles.gateList}>
                    {gates.data.items.map(gate => <IqRow key={gate.code} code={gate.code} cue={false}
                      pending={pendingChanges.get(gate.code)} onAck={gate.clearable ? onAck : undefined} status={<>
                        {gate.status === "success" ? <SuccessIcon /> : <span aria-hidden="true" style={iqStyles.gateFlag(gate.status)} />}
                        <span>{gate.label}</span>
                      </>}>
                      {gate.description.split(/(?<=^Compliance is (?:not )?satisfied\.)(?=\s*\S)/).map((part, index) => (
                        <Fragment key={index}>{index > 0 ? <br /> : null}{part}</Fragment>
                      ))}
                    </IqRow>)}
                  </ul>
                )}
              </>
            )}
          </ErrorBoundary>
        </div>
        <div hidden={active !== "Notes"}>
          <IqNotes notes={notes} onRetry={onRetry} />
        </div>
      </div>
    </div>
  </>;
}
