import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
const state = vi.hoisted(() => ({ failure: "gaps", report: { gaps: [], usage: { services: [{ name: "extraction", cost: 1, time: 1, page_num: 1, timestamp: "2026-01-01T00:00:00Z" }] } } }));
vi.mock("../hook/useAuditReport", () => ({ useAuditReport: () => ({ report: state.report, error: null }) }));
vi.mock("../component/AuditGaps", async original => {
  const actual = await original<typeof import("../component/AuditGaps")>();
  return { AuditGaps: (props: Parameters<typeof actual.AuditGaps>[0]) => {
    if (state.failure === "gaps") throw new Error("Gaps failed");
    return <actual.AuditGaps {...props} />;
  } };
});
vi.mock("../component/AuditUsage", async original => {
  const actual = await original<typeof import("../component/AuditUsage")>();
  return { AuditUsage: (props: Parameters<typeof actual.AuditUsage>[0]) => {
    if (state.failure === "usage") throw new Error("Usage failed");
    return <actual.AuditUsage {...props} />;
  } };
});
import { AuditPanel } from "../component/AuditPanel";

afterEach(() => { cleanup(); vi.restoreAllMocks(); });
it("contains Audit gaps rendering without removing controls or usage", () => {
  state.failure = "gaps";
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  render(<AuditPanel apiGatewayUrl="url" authToken="token" session="session" callbacks={{}} retryLimit={1} retryIntervalMs={0} onResource={vi.fn()} />);
  expect(screen.getByRole("alert")).toHaveTextContent("Gaps failed");
  fireEvent.click(screen.getByRole("tab", { name: "Usage" }));
  expect(screen.getByRole("region", { name: "Audit usage" })).toBeVisible();
  fireEvent.click(screen.getByRole("tab", { name: "Changes" }));
  expect(screen.getByRole("alert")).toHaveTextContent("Gaps failed");
});
it("contains Usage rendering without removing Changes or tab navigation", () => {
  state.failure = "usage";
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  render(<AuditPanel apiGatewayUrl="url" authToken="token" session="session" callbacks={{}} retryLimit={1} retryIntervalMs={0} onResource={vi.fn()} />);
  expect(screen.getByText("No gaps found.")).toBeVisible();
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("tab", { name: "Usage" }));
  expect(screen.getByRole("alert")).toHaveTextContent("Usage failed");
  fireEvent.click(screen.getByRole("tab", { name: "Changes" }));
  expect(screen.getByText("No gaps found.")).toBeVisible();
  expect(screen.getByRole("combobox", { name: "Change type" })).toBeEnabled();
});
