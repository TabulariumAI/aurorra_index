import { ProgressBar } from "aurorra-ui";
import { useState, type JSX } from "react";
import { prepareAuditReport } from "../data/auditData";
import type { AuditPanelProps, AuditFilters as AuditFiltersState } from "../type/audit.types";
import { useAuditReport } from "../hook/useAuditReport";
import { AuditFilters } from "./AuditFilters";
import { AuditGaps } from "./AuditGaps";
import { AuditSummary } from "./AuditSummary";
import { auditStyles } from "../style/auditStyles";

const initialFilters: AuditFiltersState = { changeType: "", process: "" };

export function AuditPanel(props: AuditPanelProps): JSX.Element {
  const { report, status, error } = useAuditReport(props);
  const [filters, setFilters] = useState(initialFilters);
  const loading = status === "loading" || status === "refreshing";

  if (!report) {
    return (
      <section aria-label="Audit panel" style={auditStyles.root}>
        {loading ? (
          <div style={auditStyles.progressOverlay}>
            <ProgressBar
              ariaLabel="Audit progress"
              continuous
              durationMs={10_000}
              label="Retrieving audit report..."
              running
              showText={false}
              visible
            />
          </div>
        ) : null}
        {error ? null : <div style={auditStyles.empty}>No gaps found.</div>}
      </section>
    );
  }

  const view = prepareAuditReport(report, filters);
  const updateFilter = (nextFilter: AuditFiltersState) => {
    setFilters(nextFilter);
  };

  return (
    <section aria-label="Audit panel" style={auditStyles.root}>
      {loading ? (
        <div style={auditStyles.progressOverlay}>
          <ProgressBar
            ariaLabel="Audit progress"
            continuous
            durationMs={10_000}
            label="Retrieving audit report..."
            running
            showText={false}
            visible
          />
        </div>
      ) : null}
      <div style={auditStyles.content}>
        <div style={auditStyles.panelHeader}>
          <AuditFilters
            filters={filters}
            onFiltersChange={updateFilter}
            report={view}
          />
          <AuditSummary
            filtered={view.filtered}
            total={view.total}
            costs={view.usageCosts}
          />
        </div>
        <div style={auditStyles.sectionTitle}>Audit gaps</div>
        {view.gaps.length > 0 ? (
          <AuditGaps gaps={view.gaps} />
        ) : (
          <div style={auditStyles.empty}>No gaps found.</div>
        )}
      </div>
    </section>
  );
}
