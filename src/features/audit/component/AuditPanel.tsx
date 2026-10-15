import { useCallback, useEffect, useMemo, useState, type JSX } from "react";
import { prepareAuditReport } from "../data/auditData";
import type { AuditPanelProps, AuditFilters as AuditFiltersState, AuditWorkerError } from "../type/audit.types";
import { useAuditReport } from "../hook/useAuditReport";
import { AuditFilters } from "./AuditFilters";
import { AuditGaps } from "./AuditGaps";
import { AuditSummary } from "./AuditSummary";
import { useAspects } from "../../../shared/hook/useAspects";
import { auditStyles } from "../style/auditStyles";
import { summarizeUsage, usageNames } from "../../usage/data/usageData";

const initialFilters: AuditFiltersState = { changeType: "", process: "", segment: "" };
function loadingLabel(attempt: number, retryLimit: number): readonly string[] {
  return ["Retrieving audit report...", `Attempt ${attempt} of ${retryLimit}`];
}

export function AuditPanel(props: AuditPanelProps): JSX.Element {
  const { report, retryAttempt, status, error } = useAuditReport(props);
  const [filters, setFilters] = useState(initialFilters);
  const request = useMemo(() => ({ session: props.session }), [props.session]);
  const [resourceReady, setResourceReady] = useState(false);
  const onResourceError = useCallback((error: AuditWorkerError) => {
    props.callbacks.onAuditError?.(error);
  }, [props.callbacks.onAuditError]);
  const { aspects, ready } = useAspects(request, props.onResource, setResourceReady, onResourceError);
  const reportLoading = status === "loading" || status === "refreshing";
  const loading = !resourceReady || reportLoading;
  const view = report ? prepareAuditReport(report, filters, Object.keys(aspects)) : null;
  const usage = report?.usage?.services ? summarizeUsage(report.usage.services.map(service => ({ ...service, session: props.session }))) : [];

  useEffect(() => {
    props.onReadyChange(!loading && status !== "idle");
  }, [loading, props.onReadyChange, status]);

  useEffect(() => {
    props.onLoaderChange?.(loading ? reportLoading ? loadingLabel(retryAttempt, props.retryLimit) : ["Retrieving audit report..."] : null);
  }, [loading, props.onLoaderChange, props.retryLimit, reportLoading, retryAttempt]);

  return (
    <section aria-label="Audit panel" style={auditStyles.root}>
      {!loading && ready ? <div aria-label="Audit report body" data-panel-scroll="true" role="region" style={auditStyles.body}>
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
          {usage.length > 0 ? <section aria-label="Audit usage" style={auditStyles.usage}>
            <h3 style={auditStyles.usageTitle}>Service usage</h3>
            <table aria-label="Audit service usage" style={auditStyles.usageTable}>
              <thead><tr><th scope="col" style={auditStyles.serviceCell}>Service</th>
                {["Cost", "Time", "Pages"].map(label => <th scope="col" key={label} style={auditStyles.usageCell}>{label}</th>)}
              </tr></thead>
              <tbody>{usage.map(service => <tr key={service.name}>
                <th scope="row" style={auditStyles.serviceCell}>{usageNames[service.name]}</th>
                <td style={auditStyles.usageCell}>${service.cost.toFixed(4)}</td>
                <td style={auditStyles.usageCell}>{service.time === null ? null : `${service.time.toFixed(2)} s`}</td>
                <td style={auditStyles.usageCell}>{service.pages}</td>
              </tr>)}</tbody>
            </table>
          </section> : null}
        </> : error ? null : <div style={auditStyles.empty}>No gaps found.</div>}
      </div> : null}
    </section>
  );
}
