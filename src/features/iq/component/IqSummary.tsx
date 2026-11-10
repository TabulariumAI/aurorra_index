import type { JSX } from "react";
import { iqColors, iqStyles } from "../style/iqStyles";
import type { IqReportView } from "../type/iq.types";

export function IqSummary({ view }: { view: Pick<IqReportView, "iq"> }): JSX.Element {
  const { iq } = view;
  return (
    <div style={iqStyles.summaryCard}>
      <div>
        <div style={{ ...iqStyles.metricNumber, color: iqColors[iq.bucket].fg }}>
          {iq.displayInt}%
        </div>
        <div style={iqStyles.metricSubtext}>out of 100</div>
      </div>
      <div>
        <div style={iqStyles.metricLabel}>Indexing Quality (IQ)</div>
        <div style={iqStyles.metricTrack}>
          <div style={iqStyles.metricFill(iq.bucket, iq.value)} />
        </div>
      </div>
    </div>
  );
}
