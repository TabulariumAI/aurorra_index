import type { AuditFilters, AuditGap, AuditGapView, AuditReport, AuditReportView } from "../type/audit.types";

export const CHANGE_ADD = "ADD";
export const CHANGE_REMOVE = "REMOVE";
export const CHANGE_CORRECTION = "CORRECTION";
export const PROCESS_VERIFICATION = "VERIFICATION";
export const PROCESS_ENRICHMENT = "ENRICHMENT";
export const PROCESS_REPROCESS = "Reprocess |";
export const PROCESS_USER = "USER";
export const PROCESS_OTHER = "OTHER";

type RawUsage = {
  costs?: unknown;
};

type RawReport = {
  gaps?: unknown;
  usage?: unknown;
};

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeText(value: unknown): string {
  return String(value ?? "").trim();
}

function normalizeDateRank(raw: string): number {
  const parsed = Date.parse(raw);
  return Number.isFinite(parsed) ? parsed : Number.NEGATIVE_INFINITY;
}

function normalizeChangeType(value: unknown): string {
  const normalized = normalizeText(value).toUpperCase();
  if (normalized === "ADD" || normalized === "ADDITION") return CHANGE_ADD;
  if (normalized === "REMOVE" || normalized === "REMOVAL") return CHANGE_REMOVE;
  if (normalized === "UPDATE" || normalized === "CORRECTION") return CHANGE_CORRECTION;
  return normalized || PROCESS_OTHER;
}

function normalizeProcess(value: unknown): string {
  const normalized = normalizeText(value).toLowerCase();
  if (normalized === "indexing" || normalized === "verification") return PROCESS_VERIFICATION;
  if (normalized === "correction" || normalized === "formatting" || normalized === "enrichment") return PROCESS_ENRICHMENT;
  if (normalized === "refinement" || normalized === PROCESS_REPROCESS.toLowerCase()) return PROCESS_REPROCESS;
  if (normalized === "user") return PROCESS_USER;
  return PROCESS_OTHER;
}

function normalizeUsage(value: unknown): { usage?: { costs: string[] } } {
  if (!isObject(value)) return {};
  const source = value as RawUsage;
  if (!Array.isArray(source.costs)) return {};
  return { usage: { costs: source.costs.map((cost) => String(cost)) } };
}

function toAuditGap(raw: unknown): AuditGap | null {
  if (!isObject(raw)) return null;
  const source = raw as Record<string, unknown>;
  if (
    typeof source.solution !== "string" ||
    typeof source.explanation !== "string" ||
    typeof source.page !== "string" ||
    typeof source.owner !== "string" ||
    typeof source.timestamp !== "string" ||
    (typeof source.segment !== "string" && source.segment !== null)
  ) return null;

  const solution = normalizeText(source.solution);
  const explanation = normalizeText(source.explanation);
  if (!solution && !explanation) return null;

  const normalized = {
    solution: normalizeChangeType(solution),
    explanation,
    page: normalizeText(source.page),
    owner: normalizeProcess(source.owner),
    timestamp: normalizeText(source.timestamp),
    segment: source.segment === null ? null : normalizeText(source.segment),
  };
  return normalized;
}

function changeTypeCounts(type: string): "add" | "correction" | "other" | "remove" {
  if (type === CHANGE_ADD) return "add";
  if (type === CHANGE_REMOVE) return "remove";
  if (type === CHANGE_CORRECTION) return "correction";
  return "other";
}

function getProcessCountKey(type: string): "enrichment" | "other" | "reprocess" | "user" | "verification" {
  if (type === PROCESS_ENRICHMENT) return "enrichment";
  if (type === PROCESS_REPROCESS) return "reprocess";
  if (type === PROCESS_USER) return "user";
  if (type === PROCESS_VERIFICATION) return "verification";
  return "other";
}

function aspectLabel(changeType: string): string {
  if (changeType === CHANGE_ADD) return "Addition";
  if (changeType === CHANGE_REMOVE) return "Remove";
  if (changeType === CHANGE_CORRECTION) return "Correction";
  return "Other";
}

function changeTypeLabel(changeType: string): string {
  if (changeType === CHANGE_ADD) return "Addition";
  if (changeType === CHANGE_REMOVE) return "Remove";
  if (changeType === CHANGE_CORRECTION) return "Correction";
  return "Other";
}

function processLabel(process: string): string {
  if (process === PROCESS_VERIFICATION) return "Verification";
  if (process === PROCESS_ENRICHMENT) return "Enrichment";
  if (process === PROCESS_REPROCESS) return "Reprocess";
  if (process === PROCESS_USER) return "User change";
  return "Other";
}

function formatDate(value: string): string {
  if (!value) return "N/A";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "N/A";
  try {
    return parsed.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short",
    });
  } catch {
    return "N/A";
  }
}

function toGapView(gap: AuditGap): AuditGapView {
  return {
    aspect: gap.solution,
    aspectLabel: aspectLabel(gap.solution),
    changeType: gap.solution,
    changeTypeLabel: changeTypeLabel(gap.solution),
    date: gap.timestamp,
    dateLabel: formatDate(gap.timestamp),
    message: gap.explanation,
    page: gap.page,
    process: gap.owner,
    processLabel: processLabel(gap.owner),
  };
}

function normalizeIncoming(report: unknown): AuditGap[] {
  if (!isObject(report)) return [];
  const source = report as RawReport;
  const rawGaps = Array.isArray(source.gaps) ? source.gaps : [];
  const normalized = rawGaps
    .map(toAuditGap)
    .filter((entry): entry is AuditGap => entry !== null)

  return normalized
    .map((entry) => ({ entry, rawDate: normalizeDateRank(entry.timestamp) }))
    .sort((left, right) => {
      const byDate = right.rawDate - left.rawDate;
      if (byDate !== 0) return byDate;
      const bySolution = left.entry.solution.localeCompare(right.entry.solution);
      if (bySolution !== 0) return bySolution;
      return String(left.entry.page).localeCompare(String(right.entry.page));
    })
    .map((entry) => entry.entry);
}

export function normalizeAuditReport(raw: unknown): AuditReport {
  const source = isObject(raw) ? raw as RawReport : {};
  const report: AuditReport = {
    gaps: normalizeIncoming(source),
  };

  const normalizedUsage = normalizeUsage(source.usage);
  if (normalizedUsage.usage) {
    report.usage = normalizedUsage.usage;
  }

  return report;
}

export function prepareAuditReport(raw: unknown, filters: AuditFilters): AuditReportView {
  const report = normalizeAuditReport(raw);
  const selectedChangeType = filters.changeType ? normalizeChangeType(filters.changeType) : "";
  const selectedProcess = filters.process ? normalizeProcess(filters.process) : "";
  const hasChangeFilter = selectedChangeType.length > 0;
  const hasProcessFilter = selectedProcess.length > 0;

  const changeCounts = {
    add: 0,
    correction: 0,
    other: 0,
    remove: 0,
  };
  const processCounts = {
    enrichment: 0,
    other: 0,
    reprocess: 0,
    user: 0,
    verification: 0,
  };

  const filtered = report.gaps.filter((entry) => {
    const passProcess = !hasProcessFilter || entry.owner === selectedProcess;
    const passChange = !hasChangeFilter || entry.solution === selectedChangeType;

    if (passProcess) {
      const key = changeTypeCounts(entry.solution);
      changeCounts[key] += 1;
    }
    if (passChange) {
      const key = getProcessCountKey(entry.owner);
      processCounts[key] += 1;
    }
    return passProcess && passChange;
  });

  return {
    changeCounts,
    filtered: filtered.length,
    gaps: filtered.map(toGapView),
    processCounts,
    total: report.gaps.length,
    usageCosts: report.usage?.costs ?? [],
  };
}
