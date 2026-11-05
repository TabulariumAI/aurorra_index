import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { AuditUsage } from "../component/AuditUsage";

afterEach(cleanup);
it("rounds IQ credits after aggregation while retaining time and pages", () => {
  const service = { name: "iq_refinement" as const, cost: 0.375, time: 1.28, page_num: 1, timestamp: "2026-11-04T00:00:00Z" };
  const services = [{ ...service, code: "one" }, { ...service, code: "two" }];
  render(<AuditUsage session="credits" report={{ gaps: [], usage: { services } }} />);
  expect(screen.getByRole("row", { name: "IQ Refinement 1 credits 2.56 s 2" })).toBeVisible();
  expect(services.map(item => item.cost)).toEqual([0.375, 0.375]);
});
