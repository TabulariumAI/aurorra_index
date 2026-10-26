import { useState, type JSX } from "react";
import { prepareAuditReport } from "../data/auditData";
import type { AuditPanelProps, AuditFilters as AuditFiltersState } from "../type/audit.types";
import { useAuditReport } from "../hook/useAuditReport";
import { AuditFilters } from "./AuditFilters";
import { AuditGaps } from "./AuditGaps";
import { AuditSummary } from "./AuditSummary";
import { AuditUsage } from "./AuditUsage";
import { auditStyles } from "../style/auditStyles";

const initialFilters: AuditFiltersState = { changeType: "", process: "", segment: "" };

export function AuditPanel(props: AuditPanelProps): JSX.Element {
  const { report, error } = useAuditReport(props);
  const [filters, setFilters] = useState(initialFilters);
  const view = report ? prepareAuditReport(report, filters, []) : null;
  return <section aria-label="Audit panel" style={auditStyles.root}>
    <div aria-label="Audit report body" data-panel-scroll="true" role="region" style={auditStyles.body}>
      <div data-audit-controls style={auditStyles.controlsRow}>
        <AuditFilters key={props.session} filters={filters} onFiltersChange={setFilters} report={report}
          session={props.session} onResource={props.onResource} />
        <AuditSummary filtered={view?.filtered ?? null} total={view?.total ?? null} />
      </div>
      {error && report === null ? null : <>
        <AuditGaps gaps={view?.gaps ?? null} />
        <AuditUsage report={report} session={props.session} />
      </>}
    </div>
  </section>;
}
