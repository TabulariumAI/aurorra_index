import type { JSX } from "react";
import { LoadPlaceholder } from "aurora-core";
import { auditStyles } from "../style/auditStyles";

type AuditSummaryProps = {
  filtered: number | null;
  total: number | null;
};

export function AuditSummary({ filtered, total }: AuditSummaryProps): JSX.Element {
  return (
    <div style={auditStyles.summary}>
      <div style={auditStyles.summaryRow}>
        <div style={auditStyles.summaryBadge}>
          {filtered === null || total === null ? <LoadPlaceholder compact label="Loading audit summary" /> : <>
            <span style={auditStyles.summaryBadgeCount}>{filtered}</span>
            <span style={auditStyles.summaryBadgeLabel}>Out of {total}</span>
          </>}
        </div>
      </div>
    </div>
  );
}
