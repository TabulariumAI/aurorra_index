import { useEffect, useState, type JSX, type ReactNode } from "react";
import { prepareAuditReport } from "../data/auditData";
import type { AuditPanelProps, AuditFilters as AuditFiltersState } from "../type/audit.types";
import { useAuditReport } from "../hook/useAuditReport";
import { AuditFilters } from "./AuditFilters";
import { AuditGaps } from "./AuditGaps";
import { AuditSummary } from "./AuditSummary";
import { auditStyles } from "../style/auditStyles";

const initialFilters: AuditFiltersState = { changeType: "", process: "" };
const loadingLabel = "Retrieving audit report...";

function AuditHeader({ children }: { children: ReactNode }): JSX.Element {
  return (
    <header data-audit-header style={auditStyles.header}>
      {children}
    </header>
  );
}

function AuditBody({ children }: { children: ReactNode }): JSX.Element {
  return (
    <div aria-label="Audit report body" role="region" style={auditStyles.body}>
      {children}
    </div>
  );
}

export function AuditPanel(props: AuditPanelProps): JSX.Element {
  const { report, status, error } = useAuditReport(props);
  const [filters, setFilters] = useState(initialFilters);
  const loading = status === "loading" || status === "refreshing";

  useEffect(() => {
    props.onReadyChange(!loading && status !== "idle");
  }, [loading, props.onReadyChange, status]);

  useEffect(() => {
    props.onLoaderChange?.(loading ? [loadingLabel] : null);
  }, [loading, props.onLoaderChange]);

  if (!report) {
    return (
      <section aria-label="Audit panel" style={auditStyles.root}>
        {!loading ? <AuditHeader>
          <div style={auditStyles.panelHeader}>
            <div data-audit-header-row="primary" style={auditStyles.headerTopRow}>
              <div style={auditStyles.headerSpacer} />
              <div style={auditStyles.headerClose}>{props.previewAction}</div>
            </div>
          </div>
        </AuditHeader> : null}
        {!loading ? <AuditBody>{error ? null : <div style={auditStyles.empty}>No gaps found.</div>}</AuditBody> : null}
      </section>
    );
  }

  const view = prepareAuditReport(report, filters);

  return (
    <section aria-label="Audit panel" style={auditStyles.root}>
      {!loading ? <AuditHeader>
        <div style={auditStyles.panelHeader}>
          <div data-audit-header-row="primary" style={auditStyles.headerTopRow}>
            <AuditFilters
              filters={filters}
              onFiltersChange={setFilters}
              report={view}
            />
            <div style={auditStyles.headerClose}>{props.previewAction}</div>
          </div>
          <div style={auditStyles.headerSummary}>
            <AuditSummary
              filtered={view.filtered}
              total={view.total}
              costs={view.usageCosts}
            />
          </div>
        </div>
      </AuditHeader> : null}
      {!loading ? <AuditBody>
        <div style={auditStyles.sectionTitle}>Audit gaps</div>
        {view.gaps.length > 0 ? (
          <AuditGaps gaps={view.gaps} />
        ) : (
          <div style={auditStyles.empty}>No gaps found.</div>
        )}
      </AuditBody> : null}
    </section>
  );
}
