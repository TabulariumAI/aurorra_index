import type { JSX } from "react";
import { iqStyles } from "../style/iqStyles";
import type { IqBucket, IqReportView } from "../type/iq.types";

const metricFg = {
  green: "#065f46",
  amber: "#92400e",
  red: "#991b1b",
} satisfies Record<IqBucket, string>;

export function IqSummary({ iq }: { iq: IqReportView["iq"] }): JSX.Element {
  return (
    <div style={iqStyles.summaryCard}>
      <div>
        <div style={{ ...iqStyles.metricNumber, color: metricFg[iq.bucket] }}>
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
