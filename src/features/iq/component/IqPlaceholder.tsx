import { LoadPlaceholder, skeletonStyle } from "aurora-core";
import type { CSSProperties, JSX } from "react";
import { iqStyles } from "../style/iqStyles";

function SummaryPlaceholder({ margin, title }: { margin: CSSProperties["margin"]; title: string }): JSX.Element {
  return (
    <div style={{ ...iqStyles.summaryCard, margin }}>
      <div aria-hidden="true">
        <span style={{ ...skeletonStyle, width: "6rem", height: iqStyles.metricNumber.fontSize }} />
        <span style={{ ...skeletonStyle, ...iqStyles.metricSubtext, width: "4.5rem", height: "1lh" }} />
      </div>
      <div>
        <div style={iqStyles.metricLabel}>{title}</div>
        <div aria-hidden="true" style={{ ...skeletonStyle, ...iqStyles.metricTrack }} />
      </div>
    </div>
  );
}

export function IqPlaceholder(): JSX.Element {
  return (
    <>
      <LoadPlaceholder label="Loading IQ summary">
        <div style={iqStyles.panelHeader}><SummaryPlaceholder margin={iqStyles.summaryCard.margin} title="Indexing Quality (IQ)" /></div>
      </LoadPlaceholder>
      <div style={iqStyles.divider} />
      <LoadPlaceholder label="Loading indexing segments">
        <div style={iqStyles.sectionTitle}>Indexing Segments</div>
        <table style={iqStyles.segmentTable}>
          <thead><tr>
            {["Segment", "Expected", "Actual", "IQ"].map((label, index) => (
              <th key={label} style={iqStyles.segmentHeaderCell(index === 0 ? "left" : "right")}>{label}</th>
            ))}
          </tr></thead>
          <tbody aria-hidden="true">
            {["75%", "55%", "65%"].map(width => (
              <tr key={width}>
                {[0, 1, 2, 3].map(column => (
                  <td key={column} style={iqStyles.segmentCell(column === 0 ? "left" : "right")}>
                    <span style={{ alignItems: "center", display: "flex", height: "1lh", justifyContent: column === 0 ? "flex-start" : "flex-end" }}>
                      <span style={{ ...skeletonStyle, width: column === 0 ? width : "2rem" }} />
                    </span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </LoadPlaceholder>
      <LoadPlaceholder label="Loading IQ gates">
        <SummaryPlaceholder margin="1rem 0 0.25rem" title="Compliance Gates" />
        <div style={iqStyles.sectionTitle}>Compliance Gates</div>
        <ul aria-hidden="true" style={iqStyles.gateList}>
          {["90%", "70%"].map(width => (
            <li key={width} style={iqStyles.gateRow}>
              <span style={{ ...skeletonStyle, width: "5rem" }} />
              <span style={{ ...skeletonStyle, width }} />
            </li>
          ))}
        </ul>
      </LoadPlaceholder>
    </>
  );
}
