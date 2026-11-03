import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ failure: "", report: { gaps: [], usage: { services: [{ name: "extraction", cost: 1, time: 1, page_num: 1, timestamp: "2026-01-01T00:00:00Z" }] } } }));
vi.mock("../hook/useAuditReport", () => ({ useAuditReport: () => ({ report: state.report, error: null }) }));
vi.mock("../data/auditData", async original => {
  const data = await original<typeof import("../data/auditData")>();
  return { ...data, prepareAuditReport: (...args: Parameters<typeof data.prepareAuditReport>) => {
    if (state.failure === "prepare") throw new Error("Audit preparation failed");
    const view = data.prepareAuditReport(...args);
    return { ...view,
      get gaps() { if (state.failure === "gaps") throw new Error("Gaps preparation failed"); return view.gaps; },
      get filtered() { if (state.failure === "summary") throw new Error("Summary preparation failed"); return view.filtered; },
    };
  } };
});
import { AuditPanel } from "../component/AuditPanel";

afterEach(() => { cleanup(); vi.restoreAllMocks(); state.failure = ""; });
it.each(["prepare", "gaps", "summary"])("contains %s processing and recovers with a refreshed report", failure => {
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  state.failure = failure;
  const props = { apiGatewayUrl: "url", authToken: "token", session: "session", callbacks: {}, retryLimit: 1, retryIntervalMs: 0, onResource: vi.fn() };
  const view = render(<AuditPanel {...props} />);
  if (failure === "summary") expect(screen.getByRole("button", { name: "Audit summary error" })).toBeVisible();
  else expect(screen.getAllByRole("alert").length).toBeGreaterThan(0);
  if (failure !== "prepare") expect(screen.getByRole("combobox", { name: "Change type" })).toBeEnabled();
  if (failure === "summary") expect(screen.getByText("No gaps found.")).toBeVisible();
  if (failure === "gaps") expect(screen.getByText("Out of 0")).toBeVisible();
  fireEvent.click(screen.getByRole("tab", { name: "Usage" }));
  expect(screen.getByRole("region", { name: "Audit usage" })).toBeVisible();
  fireEvent.click(screen.getByRole("tab", { name: "Changes" }));
  state.failure = "";
  state.report = { ...state.report };
  view.rerender(<AuditPanel {...props} />);
  expect(screen.queryByRole("alert")).toBeNull();
  expect(screen.getByText("No gaps found.")).toBeVisible();
});
