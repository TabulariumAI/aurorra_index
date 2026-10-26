import { formatLabel, LoadPlaceholder, type MetadataError, type ResourceRequest } from "aurora-core";
import { useMemo, useState } from "react";
import { auditStyles } from "../style/auditStyles";
import type { AuditFilters as AuditFiltersState, AuditReport } from "../type/audit.types";
import { prepareAuditReport } from "../data/auditData";
import { useAspects } from "../../../shared/hook/useAspects";

type AuditFiltersProps = {
  onFiltersChange: (filters: AuditFiltersState) => void;
  filters: AuditFiltersState;
  report: AuditReport | null;
  session: string;
  onResource(request: ResourceRequest): void;
};

const changeOptions = [
  ["", "All"],
  ["ADD", "Addition"],
  ["REMOVE", "Remove"],
  ["CORRECTION", "Correction"],
];

const processOptions = [
  ["", "All"],
  ["VERIFICATION", "Verification"],
  ["ENRICHMENT", "Enrichment"],
  ["Reprocess |", "Reprocess"],
  ["USER", "User change"],
  ["OTHER", "Other"],
];

export function AuditFilters({ filters, onFiltersChange, report: data, session, onResource }: AuditFiltersProps) {
  const request = useMemo(() => ({ session }), [session]);
  const [resourceReady, setResourceReady] = useState(false);
  const [error, setError] = useState<MetadataError | null>(null);
  const { aspects, ready } = useAspects(request, session, onResource, setResourceReady, setError);
  if (data === null) return <LoadPlaceholder label="Loading audit filters" />;
  const report = prepareAuditReport(data, filters, Object.keys(aspects));
  const allChanges = Object.values(report.changeCounts).reduce((total, count) => total + count, 0);
  const allProcesses = Object.values(report.processCounts).reduce((total, count) => total + count, 0);

  return (
    <div style={auditStyles.filters}>
      <div style={auditStyles.filterRow}>
        <label style={{ ...auditStyles.filterLabel, ...auditStyles.filterSelectGroup }}>
          <span>Change type</span>
          <select
            aria-label="Change type"
            onChange={(event) => onFiltersChange({ ...filters, changeType: event.target.value })}
            style={auditStyles.filterSelect}
            value={filters.changeType}
          >
            {changeOptions.map(([value, label]) => (
              <option
                key={`change-${value || "all"}`}
                value={value}
              >
                {`${label} (${value === "" ? allChanges : report.changeCounts[
                  value === "ADD" ? "add" : value === "REMOVE" ? "remove" : value === "CORRECTION" ? "correction" : "other"
                ]})`}
              </option>
            ))}
          </select>
        </label>
        <label style={{ ...auditStyles.filterLabel, ...auditStyles.filterSelectGroup }}>
          <span>Process</span>
          <select
            aria-label="Process"
            onChange={(event) => onFiltersChange({ ...filters, process: event.target.value })}
            style={auditStyles.filterSelect}
            value={filters.process}
          >
            {processOptions.map(([value, label]) => (
              <option
                key={`process-${value || "all"}`}
                value={value}
              >
                {`${label} (${value === "" ? allProcesses : report.processCounts[
                  value === "VERIFICATION" ? "verification" : value === "ENRICHMENT" ? "enrichment" : value === "Reprocess |" ? "reprocess" : value === "USER" ? "user" : "other"
                ]})`}
              </option>
            ))}
          </select>
        </label>
        <label style={{ ...auditStyles.filterLabel, ...auditStyles.filterSelectGroup }}>
          <span>Segment</span>
          {!resourceReady ? <LoadPlaceholder label="Loading segment options" /> : error ? (
            <span role="alert" style={auditStyles.filterError}>Segment options could not be loaded. Refresh the audit report to try again.</span>
          ) : ready ? <select
            aria-label="Segment"
            onChange={(event) => onFiltersChange({ ...filters, segment: event.target.value })}
            style={auditStyles.filterSelect}
            value={filters.segment}
          >
            <option value="">{`All (${report.segmentTotal})`}</option>
            {Object.entries(report.segmentCounts).map(([segment, count]) => (
              <option key={segment} value={segment}>{`${formatLabel(segment)} (${count})`}</option>
            ))}
          </select> : null}
        </label>
      </div>
    </div>
  );
}
