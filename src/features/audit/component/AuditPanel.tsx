import { useEffect, useState, type JSX } from "react";
import { prepareAuditReport } from "../data/auditData";
import type { AuditPanelProps, AuditFilters as AuditFiltersState } from "../type/audit.types";
import { useAuditReport } from "../hook/useAuditReport";
import { AuditFilters } from "./AuditFilters";
import { AuditGaps } from "./AuditGaps";
import { AuditSummary } from "./AuditSummary";
import { auditStyles } from "../style/auditStyles";

const initialFilters: AuditFiltersState = { changeType: "", process: "" };
function loadingLabel(attempt: number, retryLimit: number): readonly string[] {
  return ["Retrieving audit report...", `Attempt ${attempt} of ${retryLimit}`];
}

export function AuditPanel(props: AuditPanelProps): JSX.Element {
  const { report, retryAttempt, status, error } = useAuditReport(props);
  const [filters, setFilters] = useState(initialFilters);
  const loading = status === "loading" || status === "refreshing";
  const view = report ? prepareAuditReport(report, filters) : null;

  useEffect(() => {
    props.onReadyChange(!loading && status !== "idle");
  }, [loading, props.onReadyChange, status]);

  useEffect(() => {
    props.onLoaderChange?.(loading ? loadingLabel(retryAttempt, props.retryLimit) : null);
  }, [loading, props.onLoaderChange, props.retryLimit, retryAttempt]);

  return (
    <section aria-label="Audit panel" style={auditStyles.root}>
      {!loading ? <div aria-label="Audit report body" role="region" style={auditStyles.body}>
        {view ? <>
          <div data-audit-controls style={auditStyles.controlsRow}>
            <AuditFilters
              filters={filters}
              onFiltersChange={setFilters}
              report={view}
            />
            <AuditSummary filtered={view.filtered} total={view.total} />
          </div>
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
