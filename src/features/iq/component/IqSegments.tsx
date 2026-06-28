import type { JSX } from "react";
import { iqStyles } from "../style/iqStyles";
import type { IqSegmentView } from "../type/iq.types";

export function IqSegments({ segments }: { segments: IqSegmentView[] }): JSX.Element {
  const segmentsWithExplanations = segments.filter((segment) => segment.explanations.length > 0);

  return (
    <>
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
          {segments.map((segment) => (
            <tr key={segment.id}>
              <td style={iqStyles.segmentCell("left")}>{segment.displayId}</td>
              <td style={iqStyles.segmentCell("right")}>{segment.expectedDisplay}</td>
              <td style={iqStyles.segmentCell("right")}>{segment.actualDisplay}</td>
              <td style={iqStyles.segmentCell("right", true)}>{segment.iqDisplay}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {segmentsWithExplanations.map((segment) => (
        <div key={`${segment.id}-explanations`} style={iqStyles.explanationBlock}>
          <div style={iqStyles.explanationTitle}>Segment: {segment.displayId}</div>
          <ul style={iqStyles.explanationList}>
            {segment.explanations.map((explanation, index) => (
              <li key={`${segment.id}-${index}`}>{explanation}</li>
            ))}
          </ul>
        </div>
      ))}
    </>
  );
}
