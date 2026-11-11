import type { ResourceRequest } from "aurora-core";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { AuditPanel } from "../component/AuditPanel";
import { auditStoreApi } from "../store/auditStore";
import type { AuditReport } from "../type/audit.types";

const report: AuditReport = {
  gaps: [{ solution: "ADD", explanation: "Long audit message ".repeat(30), page: "1", owner: "verification", timestamp: "2026-01-01T00:00:00Z", segment: "party" }],
  usage: { services: [{ name: "extraction", code: "one", cost: 0.3, time: 88.14, page_num: 3, timestamp: "2026-01-01T00:00:00Z" }] },
};
const resource = vi.fn((request: ResourceRequest) => request.callback({ ok: true, data: { aspects: { party: ["grantor"] } } }));
const loadReport = vi.fn(async () => report);
const props = { apiGatewayUrl: "https://api", authToken: "token", callbacks: {}, onResource: resource,
  retryLimit: 1, retryIntervalMs: 0, session: "session", workerClient: { loadReport } };

beforeEach(() => { auditStoreApi.getState().resetAudit(); vi.clearAllMocks(); });
afterEach(cleanup);

it("starts on Changes and displays only the selected content", async () => {
  render(<AuditPanel  {...props} />);
  await screen.findByText("[Show more]");
  expect(screen.getByRole("tab", { name: "Changes" })).toHaveAttribute("aria-selected", "true");
  expect(screen.getByRole("tabpanel", { name: "Changes" })).toBeVisible();
  expect(screen.getByRole("combobox", { name: "Change type" })).toBeVisible();
  expect(screen.getByRole("article")).toBeVisible();
  expect(screen.queryByRole("table")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("tab", { name: "Usage" }));
  expect(screen.getByRole("tabpanel", { name: "Usage" })).toBeVisible();
  expect(screen.getByRole("row", { name: "Index Extraction 1 credits 88.14 s 3" })).toBeVisible();
  expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  expect(screen.queryByRole("article")).not.toBeInTheDocument();
  expect(screen.getByText("Out of 1")).not.toBeVisible();
});

it("retains filters, expanded messages, and loaded resources across tab switches", async () => {
  render(<AuditPanel  {...props} />);
  await screen.findByText("[Show more]");
  fireEvent.change(screen.getByLabelText("Change type"), { target: { value: "ADD" } });
  fireEvent.change(screen.getByLabelText("Process"), { target: { value: "VERIFICATION" } });
  fireEvent.change(screen.getByLabelText("Segment"), { target: { value: "party" } });
  fireEvent.click(screen.getByText("[Show more]"));
  fireEvent.click(screen.getByRole("tab", { name: "Usage" }));
  fireEvent.click(screen.getByRole("tab", { name: "Choices" }));
  fireEvent.click(screen.getByRole("tab", { name: "Changes" }));
  expect(screen.getByLabelText("Change type")).toHaveValue("ADD");
  expect(screen.getByLabelText("Process")).toHaveValue("VERIFICATION");
  expect(screen.getByLabelText("Segment")).toHaveValue("party");
  expect(screen.getByText("[Show less]")).toBeVisible();
  expect(loadReport).toHaveBeenCalledTimes(1);
  expect(resource).toHaveBeenCalledTimes(1);
});

it("supports keyboard switching and focuses the selected tab", async () => {
  render(<AuditPanel  {...props} />);
  await screen.findByText("[Show more]");
  screen.getByRole("tab", { name: "Changes" }).focus();
  for (const [key, target] of [["ArrowRight", "Usage"], ["ArrowRight", "Choices"], ["ArrowRight", "Changes"], ["ArrowLeft", "Choices"], ["Home", "Changes"], ["End", "Choices"]]) {
    fireEvent.keyDown(document.activeElement!, { key });
    expect(screen.getByRole("tab", { name: target })).toHaveFocus();
    expect(screen.getByRole("tabpanel", { name: target })).toBeVisible();
  }
});

it("keeps tabs operable during loading and shows the selected placeholders", async () => {
  let resolve!: (report: AuditReport) => void;
  render(<AuditPanel  {...props} workerClient={{ loadReport: () => new Promise(done => { resolve = done; }) }} />);
  expect(screen.queryByRole("status", { name: "Loading audit gaps" })).toBeNull();
  expect(await screen.findByRole("status", { name: "Loading audit gaps" })).toBeVisible();
  expect(screen.queryByRole("status", { name: "Loading service usage" })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("tab", { name: "Usage" }));
  expect(screen.getByRole("status", { name: "Loading service usage" })).toBeVisible();
  expect(screen.queryByRole("status", { name: "Loading audit gaps" })).not.toBeInTheDocument();
  await act(async () => resolve(report));
  expect(screen.getByRole("table", { name: "Audit service usage" })).toBeVisible();
  expect(screen.getByRole("tab", { name: "Usage" })).toHaveAttribute("aria-selected", "true");
});

it("retains all three tabs for empty reports without inventing usage rows", async () => {
  render(<AuditPanel  {...props} workerClient={{ loadReport: async () => ({ gaps: [], usage: { services: [] } }) }} />);
  await screen.findByText("No gaps found.");
  fireEvent.click(screen.getByRole("tab", { name: "Usage" }));
  expect(screen.getAllByRole("tab")).toHaveLength(3);
  expect(screen.getByRole("tabpanel", { name: "Usage" })).toBeVisible();
  expect(screen.queryByRole("table")).not.toBeInTheDocument();
  expect(screen.getByText("No gaps found.")).not.toBeVisible();
});

it("refreshes content without stale usage and keeps a new mount on Changes", async () => {
  const view = render(<AuditPanel  {...props} />);
  await screen.findByText("[Show more]");
  fireEvent.click(screen.getByRole("tab", { name: "Usage" }));
  act(() => auditStoreApi.getState().setLoaded("session", { ...report, usage: { services: [] } }));
  expect(screen.queryByRole("table")).not.toBeInTheDocument();
  expect(screen.getByRole("tab", { name: "Usage" })).toHaveAttribute("aria-selected", "true");
  view.rerender(<AuditPanel  {...props} key="refresh" />);
  expect(screen.getByRole("tab", { name: "Changes" })).toHaveAttribute("aria-selected", "true");
  await act(async () => {});
});
