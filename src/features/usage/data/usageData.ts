import type { UsageFilters, UsageRecord, UsageSummary } from "../type/usage.types";

export const usageNames = { extraction: "Extraction", iq_refinement: "IQ refinement", refinement: "Refinement", model_generation: "Model generation" };

export function usageRange(now: number): { from: string; to: string } {
  const date = new Date(now);
  return {
    from: new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() - 1, 1)).toISOString().slice(0, 10),
    to: new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).toISOString().slice(0, 10),
  };
}

export function summarizeUsage(records: readonly UsageRecord[], filters?: UsageFilters): UsageSummary[] {
  const summaries = new Map<UsageRecord["name"], Omit<UsageSummary, "sessions"> & { sessions: Set<string> }>();
  for (const record of records) {
    const date = new Date(record.timestamp);
    const day = date.toISOString().slice(0, 10);
    if (filters && (day < filters.from || day > filters.to || !filters.services.includes(record.name))) continue;
    if (filters?.period === "weekly") date.setUTCDate(date.getUTCDate() - (date.getUTCDay() + 6) % 7);
    const key = date.toISOString().slice(0, 10);
    let summary = summaries.get(record.name);
    if (!summary) {
      summary = { name: record.name, cost: 0, time: null, pages: 0, sessions: new Set<string>(), average: null, points: [] };
      summaries.set(record.name, summary);
    }
    summary.cost += record.cost;
    if (record.time !== undefined) summary.time = summary.time === null ? record.time : summary.time + record.time;
    summary.pages += record.page_num;
    summary.sessions.add(record.session);
    const point = summary.points.find(item => item.date === key);
    if (point) { point.cost += record.cost; point.pages += record.page_num; }
    else summary.points.push({ date: key, cost: record.cost, pages: record.page_num });
  }
  return [...summaries.values()].map(summary => ({ ...summary,
    sessions: summary.sessions.size,
    average: summary.pages === 0 ? null : summary.cost / summary.pages,
    points: summary.points.sort((a, b) => a.date.localeCompare(b.date)),
  })).sort((a, b) => Object.keys(usageNames).indexOf(a.name) - Object.keys(usageNames).indexOf(b.name));
}
