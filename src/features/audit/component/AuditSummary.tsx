import type { JSX } from "react";
import { auditStyles } from "../style/auditStyles";

type AuditSummaryProps = {
  filtered: number;
  total: number;
  costs: string[];
};

export function AuditSummary({ filtered, total, costs }: AuditSummaryProps): JSX.Element {
  return (
    <div style={auditStyles.summary}>
      <div style={auditStyles.summaryRow}>
        <div style={auditStyles.summaryBadge}>
          <span style={auditStyles.summaryBadgeCount}>{filtered}</span>
          <span style={auditStyles.summaryBadgeLabel}>Out of {total}</span>
        </div>
      </div>
      {costs.length > 0 ? (
        <div style={auditStyles.summaryCosts}>
          {costs.join(" ")}
        </div>
      ) : null}
    </div>
  );
}
