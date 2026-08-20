import type { JSX } from "react";
import { auditStyles } from "../style/auditStyles";

type AuditSummaryProps = {
  filtered: number;
  total: number;
};

export function AuditSummary({ filtered, total }: AuditSummaryProps): JSX.Element {
  return (
    <div style={auditStyles.summary}>
      <div style={auditStyles.summaryRow}>
        <div style={auditStyles.summaryBadge}>
          <span style={auditStyles.summaryBadgeCount}>{filtered}</span>
          <span style={auditStyles.summaryBadgeLabel}>Out of {total}</span>
        </div>
      </div>
    </div>
  );
}
