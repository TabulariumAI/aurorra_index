import { describe, expect, it } from "vitest";
import { usageRange, summarizeUsage } from "../data/usageData";
import type { UsageRecord } from "../type/usage.types";

const records: UsageRecord[] = [
  { session: "one", code: "a", name: "extraction", cost: 11, page_num: 1, timestamp: "2026-10-04T23:30:00Z" },
  { session: "one", code: "b", name: "extraction", cost: 22, page_num: 10, timestamp: "2026-10-05T00:30:00Z" },
  { session: "one", code: "c", name: "iq_refinement", cost: 5.5, page_num: 2, timestamp: "2026-10-05T12:00:00Z" },
  { session: "two", code: "d", name: "refinement", cost: 0, page_num: 0, timestamp: "2026-10-05T12:00:00Z" },
];

describe("usage aggregation", () => {
  it("calculates session service totals from unrounded costs including zero-cost events", () => {
    const event = { session: "one", time: 0, page_num: 0, timestamp: "2025-01-01T00:00:00Z" };
    const rows = summarizeUsage([
      { ...event, name: "extraction", code: "extraction", cost: 0.30207683, page_num: 3 },
      { ...event, name: "iq_refinement", code: "iq", cost: 0.0112, page_num: 3 },
      { ...event, name: "refinement", code: "refine-one", cost: 0.0019833, page_num: 1 },
      { ...event, name: "refinement", code: "refine-two", cost: 0.03727295, page_num: 2 },
      { ...event, name: "refinement", code: "refine-three", cost: 0.0645425, page_num: 1 },
      { ...event, name: "refinement", code: "refine-zero", cost: 0 },
      { ...event, name: "model_generation", code: "model-one", cost: 0.106634, page_num: 2 },
      { ...event, name: "model_generation", code: "model-two", cost: 0.1201695, page_num: 1 },
    ]);
    expect(rows.map(row => row.name)).toEqual(["extraction", "iq_refinement", "refinement", "model_generation"]);
    for (const [index, cost] of [0.30207683, 0.0112, 0.10379875, 0.2268035].entries()) {
      expect(rows[index].cost).toBeCloseTo(cost, 12);
      expect(rows[index].sessions).toBe(1);
    }
    expect(rows.map(row => row.pages)).toEqual([3, 3, 4, 3]);
    expect(rows.map(row => row.time)).toEqual([0, 0, 0, 0]);
  });

  it("summarizes all four service groups with model totals and no page average for models", () => {
    const models = { session: "one", code: "model-one", name: "model_generation" as const, cost: 11, time: 2, page_num: 0, timestamp: "2026-10-05T12:00:00Z" };
    const rows = summarizeUsage([...records, models, { ...models, session: "two", code: "model-two", cost: 22, time: 3 }],
      { services: ["extraction", "iq_refinement", "refinement", "model_generation"], from: "2026-10-01", to: "2026-10-31", period: "daily" });
    expect(rows.map(row => row.name)).toEqual(["extraction", "iq_refinement", "refinement", "model_generation"]);
    expect(rows[3]).toMatchObject({ cost: 33, time: 5, pages: 0, sessions: 2, average: null });
    expect(summarizeUsage([...records, models], { services: ["model_generation"], from: "2026-10-05", to: "2026-10-05", period: "weekly" })).toHaveLength(1);
  });

  it("summarizes full audit history without the Usage panel's date limits", () => {
    const rows = summarizeUsage([
      { ...records[0], time: 1, timestamp: "2025-01-01T00:00:00Z" },
      { ...records[1], time: 2 },
      { ...records[2] },
    ]);
    expect(rows[0]).toMatchObject({ cost: 33, time: 3, pages: 11, sessions: 1 });
    expect(rows[1].time).toBeNull();
  });

  it.each(["daily", "weekly"] as const)("counts distinct sessions per service across %s buckets", period => {
    const summaries = summarizeUsage([...records,
      { ...records[1], code: "e", session: "two" },
      { ...records[0], code: "f", session: "outside", timestamp: "2026-09-30T23:59:59Z" },
    ], { services: ["extraction", "iq_refinement", "refinement", "model_generation"], from: "2026-10-01", to: "2026-10-31", period });
    expect(summaries.map(row => [row.name, row.sessions])).toEqual([
      ["extraction", 2], ["iq_refinement", 1], ["refinement", 1],
    ]);
    expect(summaries[0]).toMatchObject({ cost: 55, pages: 21, average: 55 / 21 });
  });

  it("excludes sessions with no events in the selected dates", () => {
    const result = summarizeUsage([...records, { ...records[0], code: "e", session: "two" }],
      { services: ["extraction"], from: "2026-10-05", to: "2026-10-05", period: "weekly" });
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ sessions: 1, cost: 22, pages: 10, average: 2.2 });
  });
  it.each([
    ["2026-10-08T10:00:00Z", "2026-09-01", "2026-10-31"],
    ["2026-01-01T00:00:00Z", "2025-12-01", "2026-01-31"],
    ["2024-03-31T23:59:59Z", "2024-02-01", "2024-03-31"],
  ])("retains previous and current calendar months at %s", (now, from, to) => {
    expect(usageRange(Date.parse(now))).toEqual({ from, to });
  });

  it("keeps UTC days and calculates weighted page costs for each service", () => {
    const summaries = summarizeUsage(records, { services: ["extraction", "iq_refinement", "refinement", "model_generation"], from: "2026-10-01", to: "2026-10-31", period: "daily" });
    expect(summaries[0]).toMatchObject({ name: "extraction", cost: 33, pages: 11, average: 3,
      points: [{ date: "2026-10-04", cost: 11, pages: 1 }, { date: "2026-10-05", cost: 22, pages: 10 }] });
    expect(summaries.find(row => row.name === "iq_refinement")).toMatchObject({ cost: 5.5, pages: 2, average: 2.75 });
    expect(summaries.find(row => row.name === "refinement")?.average).toBeNull();
  });

  it("groups Monday through Sunday weeks separately for each service", () => {
    const rows = summarizeUsage(records, { services: ["extraction"], from: "2026-10-01", to: "2026-10-31", period: "weekly" });
    expect(rows).toHaveLength(1);
    expect(rows[0].points.map(point => point.date)).toEqual(["2026-09-28", "2026-10-05"]);
  });

  it("filters event dates before weekly aggregation with inclusive date boundaries", () => {
    const result = summarizeUsage(records, { services: ["extraction"], from: "2026-10-05", to: "2026-10-05", period: "weekly" });
    expect(result[0]).toMatchObject({ cost: 22, pages: 10, average: 2.2 });
    expect(summarizeUsage([], { services: ["extraction", "iq_refinement", "refinement", "model_generation"], from: "2026-10-01", to: "2026-10-31", period: "daily" })).toEqual([]);
  });
});


it.each(["daily", "weekly"] as const)("filters multiple services before %s aggregation without changing Audit summaries", period => {
  const selected = summarizeUsage(records, { services: ["extraction", "iq_refinement"], from: "2026-10-05", to: "2026-10-05", period });
  expect(selected.map(row => row.name)).toEqual(["extraction", "iq_refinement"]);
  expect(selected[0]).toMatchObject({ cost: 22, pages: 10, sessions: 1, average: 2.2 });
  expect(selected[1]).toMatchObject({ cost: 5.5, pages: 2, sessions: 1, average: 2.75 });
  expect(summarizeUsage(records).map(row => row.name)).toEqual(["extraction", "iq_refinement", "refinement"]);
});
