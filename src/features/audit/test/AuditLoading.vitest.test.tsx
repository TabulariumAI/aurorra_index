import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { loaderDelayMs, type ResourceRequest } from "aurora-core";
import { AuditPanel } from "../component/AuditPanel";
import { auditStoreApi } from "../store/auditStore";
import type { AuditReport } from "../type/audit.types";

const report: AuditReport = { gaps: [], usage: { services: [] } };
let finish: (report: AuditReport) => void;
const workerClient = { loadReport: () => new Promise<AuditReport>(resolve => { finish = resolve; }) };
const props = { apiGatewayUrl: "https://api", authToken: "token", callbacks: {}, retryLimit: 1, retryIntervalMs: 0,
  session: "first", workerClient, onResource: (request: ResourceRequest) => request.callback({ ok: true, data: { aspects: {} } }) };

beforeEach(() => { vi.useFakeTimers(); auditStoreApi.getState().resetAudit(); });
afterEach(() => { cleanup(); auditStoreApi.getState().resetAudit(); vi.useRealTimers(); });

it("renders a fast audit without mounting any loading status", async () => {
  render(<AuditPanel {...props} />);
  expect(screen.queryAllByRole("status")).toHaveLength(0);
  await act(async () => finish(report));
  expect(screen.getByText("No gaps found.")).toBeVisible();
  act(() => vi.advanceTimersByTime(loaderDelayMs));
  expect(screen.queryAllByRole("status")).toHaveLength(0);
});

it("restarts placeholders on session change and rejects the previous completion", async () => {
  const view = render(<AuditPanel {...props} />);
  const previous = finish;
  act(() => vi.advanceTimersByTime(loaderDelayMs));
  expect(screen.getByRole("status", { name: "Loading audit gaps" })).toBeVisible();
  view.rerender(<AuditPanel {...props} session="second" />);
  expect(screen.queryAllByRole("status")).toHaveLength(0);
  await act(async () => previous(report));
  expect(screen.queryByText("No gaps found.")).toBeNull();
  act(() => vi.advanceTimersByTime(loaderDelayMs - 1));
  expect(screen.queryAllByRole("status")).toHaveLength(0);
  act(() => vi.advanceTimersByTime(1));
  expect(screen.getByRole("status", { name: "Loading audit gaps" })).toBeVisible();
  await act(async () => finish(report));
  expect(screen.getByText("No gaps found.")).toBeVisible();
  expect(screen.queryAllByRole("status")).toHaveLength(0);
});
