import { ErrorBoundary, LoadError, useTabs } from "aurora-core";
import { useState, type JSX } from "react";
import type { AuditPanelProps, AuditFilters as AuditFiltersState } from "../type/audit.types";
import { useAuditReport } from "../hook/useAuditReport";
import { AuditFilters } from "./AuditFilters";
import { AuditGaps } from "./AuditGaps";
import { AuditSummary } from "./AuditSummary";
import { AuditUsage } from "./AuditUsage";
import { auditCss, auditStyles } from "../style/auditStyles";

const initialFilters: AuditFiltersState = { changeType: "", process: "", segment: "" };
const auditTabs = ["Changes", "Usage"];

export function AuditPanel(props: AuditPanelProps): JSX.Element {
  const { report, error } = useAuditReport(props);
  const [filters, setFilters] = useState(initialFilters);
  const { active, controls, panel } = useTabs(auditTabs, "Audit views", {
    className: "audit-tabs", style: auditStyles.tabs, tabStyle: auditStyles.tab, hideSingle: false,
  });
  return <section aria-label="Audit panel" className="audit-panel" style={auditStyles.root}>
    <style>{auditCss}</style>
    {controls}
    <div aria-label="Audit & Usage body" data-panel-scroll="true" role="region" style={auditStyles.body}>
      <div {...panel}>
        <div hidden={active !== "Changes"}>
          <div data-audit-controls style={auditStyles.controlsRow}>
            <ErrorBoundary title="Audit filters" resetKey={report} fallback={(error, retry) => <div style={auditStyles.filterFailure}><LoadError title="Audit filters" detail={error.message} onRetry={retry} /></div>}><AuditFilters key={props.session} filters={filters} onFiltersChange={setFilters} report={report}
              session={props.session} onResource={props.onResource} /></ErrorBoundary>
            <ErrorBoundary title="Audit summary" resetKey={report} fallback={error => <AuditSummary report={report} filters={filters} error={error.message} />}><AuditSummary report={report} filters={filters} /></ErrorBoundary>
          </div>
        </div>
        {error && report === null ? null : <>
          <div hidden={active !== "Changes"}>
            <ErrorBoundary title="Audit gaps" resetKey={report}><AuditGaps report={report} filters={filters} /></ErrorBoundary>
          </div>
          <div hidden={active !== "Usage"}>
            <ErrorBoundary title="Audit usage" resetKey={report}><AuditUsage report={report} session={props.session} /></ErrorBoundary>
          </div>
        </>}
      </div>
    </div>
  </section>;
}
