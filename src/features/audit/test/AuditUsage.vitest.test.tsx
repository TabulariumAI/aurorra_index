import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { AuditUsage } from "../component/AuditUsage";

afterEach(cleanup);
it.each([[0, 0], [0.005, 1], [0.1, 1], [0.375, 1], [0.75, 2]])("rounds %s IQ credits after aggregation while retaining time and pages", (cost, credits) => {
  const service = { name: "iq_refinement" as const, cost, time: 1.28, page_num: 1, timestamp: "2026-11-04T00:00:00Z" };
  const services = [{ ...service, code: "one" }, { ...service, code: "two" }];
  render(<AuditUsage session="credits" report={{ gaps: [], usage: { services } }} />);
  expect(screen.getByRole("row", { name: `IQ Refinement ${credits} credits 2.56 s 2` })).toBeVisible();
  expect(services.map(item => item.cost)).toEqual([cost, cost]);
});
