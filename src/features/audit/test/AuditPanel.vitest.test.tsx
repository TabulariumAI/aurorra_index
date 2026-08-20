import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { auditStoreApi } from "../store/auditStore";
import { AuditPanel } from "../component/AuditPanel";
import type { AuditReport, AuditWorkerClient } from "../type/audit.types";

const report: AuditReport = {
  gaps: [
    {
      solution: "ADD",
      explanation: "Newest addition message",
      page: "3",
      owner: "verification",
      timestamp: "2026-01-03T12:00:00Z",
      segment: "reference",
    },
    {
      solution: "CORRECTION",
      explanation: `First half of a very long message that will be truncated when rendered because it is intentionally verbose and exceeds two hundred characters to exercise the show more and show less behavior used in the audit details panel with additional words added for length. It should be clearly longer than two hundred characters for reliable detection.`,
      page: "2",
      owner: "enrichment",
      timestamp: "2026-01-02T12:00:00Z",
      segment: null,
    },
    {
      solution: "REMOVE",
      explanation: "Old remove message",
      page: "1",
      owner: "user",
      timestamp: "2026-01-01T12:00:00Z",
      segment: "party",
    },
  ],
  usage: {
    costs: ["$1.66"],
  },
};

function client(loadReport = vi.fn(async () => report)): AuditWorkerClient {
  return {
    loadReport,
  };
}

const previewAction = <button type="button">Close preview</button>;

describe("AuditPanel", () => {
  beforeEach(() => {
    auditStoreApi.getState().resetAudit();
  });

  it("reports loading to the host without package loading presentation", () => {
    const onLoaderChange = vi.fn();
    render(
      <AuditPanel
        apiGatewayUrl="https://api"
        authToken="token"
        callbacks={{}}
        onLoaderChange={onLoaderChange}
        onReadyChange={vi.fn()}
        previewAction={previewAction}
        session="session-1"
        workerClient={client(vi.fn(() => new Promise(() => undefined)))}
      />,
    );

    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    expect(onLoaderChange).toHaveBeenLastCalledWith(["Retrieving audit report..."]);
    expect(screen.queryByText("No gaps found.")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Close preview" })).not.toBeInTheDocument();
  });

  it("renders the approved audit header, scrolling report body, and bottom usage cost", async () => {
    render(
      <AuditPanel
        apiGatewayUrl="https://api"
        authToken="token"
        callbacks={{}}
        onReadyChange={vi.fn()}
        previewAction={previewAction}
        session="session-1"
        workerClient={client()}
      />,
    );

    await screen.findByText("Newest addition message");
    expect(screen.getByRole("button", { name: "Close preview" })).toBeInTheDocument();
    const title = screen.getByRole("heading", { name: "Audit Report" });
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("Out of 3")).toBeInTheDocument();
    const costs = screen.getByText("$1.66");
    expect(costs).toHaveStyle({ color: "var(--title-ink)" });
    expect(screen.getByText("Change type")).toBeInTheDocument();
    expect(screen.getByText("Process")).toBeInTheDocument();
    expect(screen.queryByText("Audit gaps", { exact: true })).not.toBeInTheDocument();
    const header = document.querySelector("[data-audit-header]");
    const body = screen.getByRole("region", { name: "Audit report body" });
    expect(header).toHaveStyle({
      background: "var(--white)",
      flex: "0 0 auto",
    });
    expect(body).toHaveStyle({
      flex: "1 1 auto",
      minHeight: "0",
      overflowY: "auto",
    });
    expect(header?.contains(body)).toBe(false);
    const titleRow = title.closest("[data-audit-header-row='title']");
    const controlsRow = screen.getByLabelText("Change type").closest("[data-audit-header-row='controls']");
    expect(titleRow).toBeTruthy();
    expect(controlsRow).toBeTruthy();
    expect(screen.getByRole("button", { name: "Close preview" }).closest("[data-audit-header-row='title']")).toBe(titleRow);
    expect(screen.getByText("Out of 3").closest("[data-audit-header-row='controls']")).toBe(controlsRow);
    expect(body.lastElementChild).toBe(costs);
    expect(screen.getByText("Newest addition message")).toBeInTheDocument();
    expect(screen.getByText("Old remove message")).toBeInTheDocument();
    expect(screen.getByText("Addition (1)")).toBeInTheDocument();
    expect(screen.getByText("Verification (1)")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("toggles long audit message with show more/show less", async () => {
    render(
      <AuditPanel
        apiGatewayUrl="https://api"
        authToken="token"
        callbacks={{}}
        onReadyChange={vi.fn()}
        previewAction={previewAction}
        session="session-1"
        workerClient={client()}
      />,
    );

    await screen.findByText("[Show more]");
    const showMore = screen.getAllByText("[Show more]")[0];
    await showMore.click();
    expect(await screen.findByText("[Show less]")).toBeInTheDocument();

    const showLess = screen.getByText("[Show less]");
    await showLess.click();
    expect(screen.getByText("[Show more]")).toBeInTheDocument();
  });

  it("keeps the approved header and omits the bottom cost when no usage cost exists", async () => {
    render(
      <AuditPanel
        apiGatewayUrl="https://api"
        authToken="token"
        callbacks={{}}
        onReadyChange={vi.fn()}
        previewAction={previewAction}
        session="session-1"
        workerClient={client(vi.fn(async () => ({ gaps: [], usage: { costs: [] } })))}
      />,
    );

    await screen.findByText("No gaps found.");
    expect(screen.getByRole("heading", { name: "Audit Report" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Close preview" })).toBeInTheDocument();
    expect(screen.queryByText("$1.66")).not.toBeInTheDocument();
  });

  it("filters GapEntry solution and owner through the existing controls", async () => {
    render(
      <AuditPanel
        apiGatewayUrl="https://api"
        authToken="token"
        callbacks={{}}
        onReadyChange={vi.fn()}
        previewAction={previewAction}
        session="session-1"
        workerClient={client()}
      />,
    );

    await screen.findByText("Newest addition message");
    fireEvent.change(screen.getByLabelText("Change type"), { target: { value: "REMOVE" } });
    expect(screen.getByText("Old remove message")).toBeInTheDocument();
    expect(screen.queryByText("Newest addition message")).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Process"), { target: { value: "USER" } });
    expect(screen.getByText("Old remove message")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Process"), { target: { value: "VERIFICATION" } });
    expect(screen.getByText("No gaps found.")).toBeInTheDocument();
  });
});
