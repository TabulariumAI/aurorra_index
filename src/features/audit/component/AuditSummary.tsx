import type { JSX } from "react";
import { ErrorBadge, LoadPlaceholder, skeletonStyle } from "aurora-core";
import { auditStyles } from "../style/auditStyles";
import { prepareAuditReport } from "../data/auditData";
import type { AuditFilters, AuditReport } from "../type/audit.types";

type AuditSummaryProps = {
  report: AuditReport | null;
  filters: AuditFilters;
  error?: string;
};

export function AuditSummary({ report, filters, error }: AuditSummaryProps): JSX.Element {
  const view = !error && report ? prepareAuditReport(report, filters, []) : null;
  return (
    <div style={auditStyles.summary}>
      <div style={auditStyles.summaryRow}>
        <div style={auditStyles.summaryBadge}>
          {error ? <ErrorBadge label="Audit summary" error={error} /> : view === null ? <LoadPlaceholder compact label="Loading audit summary"><div aria-hidden="true" style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}><span style={{ ...skeletonStyle, width: "2rem", height: auditStyles.summaryBadgeCount.fontSize }} /><span style={{ ...skeletonStyle, width: "3.5rem", height: auditStyles.summaryBadgeLabel.fontSize }} /></div></LoadPlaceholder> : <>
            <span style={auditStyles.summaryBadgeCount}>{view.filtered}</span>
            <span style={auditStyles.summaryBadgeLabel}>Out of {view.total}</span>
          </>}
        </div>
      </div>
    </div>
  );
}
