import { formatLabel } from "aurora-core";
import { auditStyles } from "../style/auditStyles";
import type { AuditFilters as AuditFiltersState, AuditReportView } from "../type/audit.types";

type AuditFiltersProps = {
  onFiltersChange: (filters: AuditFiltersState) => void;
  filters: AuditFiltersState;
  report: AuditReportView;
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

export function AuditFilters({ filters, onFiltersChange, report }: AuditFiltersProps) {
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
          <select
            aria-label="Segment"
            onChange={(event) => onFiltersChange({ ...filters, segment: event.target.value })}
            style={auditStyles.filterSelect}
            value={filters.segment}
          >
            <option value="">{`All (${report.segmentTotal})`}</option>
            {Object.entries(report.segmentCounts).map(([segment, count]) => (
              <option key={segment} value={segment}>{`${formatLabel(segment)} (${count})`}</option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
