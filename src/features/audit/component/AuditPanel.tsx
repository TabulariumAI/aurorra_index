import { useEffect, useState, type JSX } from "react";
import { prepareAuditReport } from "../data/auditData";
import type { AuditPanelProps, AuditFilters as AuditFiltersState } from "../type/audit.types";
import { useAuditReport } from "../hook/useAuditReport";
import { AuditFilters } from "./AuditFilters";
import { AuditGaps } from "./AuditGaps";
import { AuditSummary } from "./AuditSummary";
import { auditStyles } from "../style/auditStyles";

const initialFilters: AuditFiltersState = { changeType: "", process: "" };
const loadingLabel = "Retrieving audit report...";

export function AuditPanel(props: AuditPanelProps): JSX.Element {
  const { report, status, error } = useAuditReport(props);
  const [filters, setFilters] = useState(initialFilters);
  const loading = status === "loading" || status === "refreshing";
  const view = report ? prepareAuditReport(report, filters) : null;

  useEffect(() => {
    props.onReadyChange(!loading && status !== "idle");
  }, [loading, props.onReadyChange, status]);

  useEffect(() => {
    props.onLoaderChange?.(loading ? [loadingLabel] : null);
  }, [loading, props.onLoaderChange]);

  return (
    <section aria-label="Audit panel" style={auditStyles.root}>
      {!loading ? <header data-audit-header style={auditStyles.header}>
        <div style={auditStyles.panelHeader}>
          <div data-audit-header-row="title" style={auditStyles.titleRow}>
            <h2 style={auditStyles.title}>Audit Report</h2>
            <div style={auditStyles.headerClose}>{props.previewAction}</div>
          </div>
          {view ? <div data-audit-header-row="controls" style={auditStyles.controlsRow}>
            <AuditFilters
              filters={filters}
              onFiltersChange={setFilters}
              report={view}
            />
            <AuditSummary filtered={view.filtered} total={view.total} />
          </div> : null}
        </div>
      </header> : null}
      {!loading ? <div aria-label="Audit report body" role="region" style={auditStyles.body}>
        {view ? <>
          {view.gaps.length > 0 ? (
            <AuditGaps gaps={view.gaps} />
          ) : (
            <div style={auditStyles.empty}>No gaps found.</div>
          )}
          {view.usageCosts.length > 0 ? <div style={auditStyles.usageCosts}>{view.usageCosts.join(" ")}</div> : null}
        </> : error ? null : <div style={auditStyles.empty}>No gaps found.</div>}
      </div> : null}
    </section>
  );
}
