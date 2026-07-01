import { auditStyles } from "../style/auditStyles";
import type { AuditReportView } from "../type/audit.types";

type AuditFiltersProps = {
  onFiltersChange: (filters: { changeType: string; process: string }) => void;
  filters: {
    changeType: string;
    process: string;
  };
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
                {`${label} (${report.changeCounts[
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
                {`${label} (${report.processCounts[
                  value === "VERIFICATION" ? "verification" : value === "ENRICHMENT" ? "enrichment" : value === "Reprocess |" ? "reprocess" : value === "USER" ? "user" : "other"
                ]})`}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
