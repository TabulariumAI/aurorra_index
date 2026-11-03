import { ErrorBoundary, ErrorBadge } from "aurora-core";
import type { JSX } from "react";
import { iqStyles } from "../style/iqStyles";
import type { IqReportView, IqSegmentView } from "../type/iq.types";

export function IqSegments({ view }: { view: Pick<IqReportView, "segments"> }): JSX.Element {
  const { segments } = view;
  const orderedSegments = [...segments].sort((left, right) => right.expectedWeight - left.expectedWeight);

  return (
    <>
      <div style={iqStyles.sectionTitle}>Indexing Segments ({segments.length})</div>
      <table style={iqStyles.segmentTable}>
        <thead>
          <tr>
            <th style={iqStyles.segmentHeaderCell("left")}>Segment</th>
            <th style={iqStyles.segmentHeaderCell("right")}>Expected</th>
            <th style={iqStyles.segmentHeaderCell("right")}>Actual</th>
            <th style={iqStyles.segmentHeaderCell("right")}>IQ</th>
          </tr>
        </thead>
        <tbody>
          {orderedSegments.map((segment) => (
            <ErrorBoundary key={segment.id} title={segment.displayId} resetKey={segment}
              fallback={error => <tr><td colSpan={4} style={iqStyles.segmentCell("left")}><ErrorBadge label={segment.displayId} error={error.message} /></td></tr>}>
              <SegmentRow segment={segment} />
            </ErrorBoundary>
          ))}
        </tbody>
      </table>
      {orderedSegments.map(segment => <ErrorBoundary key={`${segment.id}-explanations`} title={segment.displayId} resetKey={segment}
        fallback={error => <ErrorBadge label={segment.displayId} error={error.message} />}>
        <SegmentExplanations segment={segment} />
      </ErrorBoundary>)}
    </>
  );
}

function SegmentRow({ segment }: { segment: IqSegmentView }) {
  return <tr>
    <td style={iqStyles.segmentCell("left")}>{segment.displayId}</td>
    <td style={iqStyles.segmentCell("right")}>{segment.expectedDisplay}</td>
    <td style={iqStyles.segmentCell("right")}>{segment.actualDisplay}</td>
    <td style={iqStyles.segmentCell("right", true)}>{segment.iqDisplay}</td>
  </tr>;
}

function SegmentExplanations({ segment }: { segment: IqSegmentView }) {
  if (!segment.explanations.length) return null;
  return <div style={iqStyles.explanationBlock}>
    <div style={iqStyles.explanationTitle}>Segment: {segment.displayId}</div>
    <ul style={iqStyles.explanationList}>
      {segment.explanations.map((explanation, index) => <li key={`${segment.id}-${index}`}>{explanation}</li>)}
    </ul>
  </div>;
}
