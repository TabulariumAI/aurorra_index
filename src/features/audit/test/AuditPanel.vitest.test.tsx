import { fireEvent, render, screen, within } from "@testing-library/react";
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
        retryLimit={5}
        retryIntervalMs={0}
        session="session-1"
        workerClient={client(vi.fn(() => new Promise(() => undefined)))}
      />,
    );

    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    expect(onLoaderChange).toHaveBeenLastCalledWith(["Retrieving audit report...", "Attempt 1 of 5"]);
    expect(screen.queryByText("No gaps found.")).not.toBeInTheDocument();
  });

  it("renders the approved audit header, scrolling report body, and bottom usage cost", async () => {
    render(
      <AuditPanel
        apiGatewayUrl="https://api"
        authToken="token"
        callbacks={{}}
        onReadyChange={vi.fn()}
        retryLimit={5}
        retryIntervalMs={0}
        session="session-1"
        workerClient={client()}
      />,
    );

    await screen.findByText("Newest addition message");
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("Out of 3")).toBeInTheDocument();
    const costs = screen.getByText("$1.66");
    expect(costs).toHaveStyle({ color: "var(--title-ink)" });
    expect(screen.getByText("Change type")).toBeInTheDocument();
    expect(screen.getByText("Process")).toBeInTheDocument();
    expect(screen.queryByText("Audit gaps", { exact: true })).not.toBeInTheDocument();
    const body = screen.getByRole("region", { name: "Audit report body" });
    expect(body).toHaveStyle({
      flex: "1 1 auto",
      minHeight: "0",
      overflowY: "auto",
    });
    expect(body).toHaveAttribute("data-panel-scroll", "true");
    const controls = screen.getByLabelText("Change type").closest("[data-audit-controls]");
    expect(controls).toBeTruthy();
    expect(screen.getByText("Out of 3").closest("[data-audit-controls]")).toBe(controls);
    expect(body.lastElementChild).toBe(costs);
    expect(screen.getByText("Newest addition message")).toBeInTheDocument();
    expect(screen.getByText("Old remove message")).toBeInTheDocument();
    expect(screen.getByText("Addition (1)")).toBeInTheDocument();
    expect(screen.getByText("Verification (1)")).toBeInTheDocument();
    expect(within(screen.getByLabelText("Change type")).getByRole("option", { name: "All (3)" })).toBeInTheDocument();
    expect(within(screen.getByLabelText("Process")).getByRole("option", { name: "All (3)" })).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("toggles long audit message with show more/show less", async () => {
    render(
      <AuditPanel
        apiGatewayUrl="https://api"
        authToken="token"
        callbacks={{}}
        onReadyChange={vi.fn()}
        retryLimit={5}
        retryIntervalMs={0}
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
        retryLimit={5}
        retryIntervalMs={0}
        session="session-1"
        workerClient={client(vi.fn(async () => ({ gaps: [], usage: { costs: [] } })))}
      />,
    );

    await screen.findByText("No gaps found.");
    expect(screen.getAllByRole("option", { name: "All (0)" })).toHaveLength(2);
    expect(screen.queryByText("$1.66")).not.toBeInTheDocument();
  });

  it("filters GapEntry solution and owner through the existing controls", async () => {
    render(
      <AuditPanel
        apiGatewayUrl="https://api"
        authToken="token"
        callbacks={{}}
        onReadyChange={vi.fn()}
        retryLimit={5}
        retryIntervalMs={0}
        session="session-1"
        workerClient={client()}
      />,
    );

    await screen.findByText("Newest addition message");
    fireEvent.change(screen.getByLabelText("Change type"), { target: { value: "REMOVE" } });
    expect(screen.getByText("Old remove message")).toBeInTheDocument();
    expect(screen.queryByText("Newest addition message")).not.toBeInTheDocument();
    expect(within(screen.getByLabelText("Change type")).getByRole("option", { name: "All (3)" })).toBeInTheDocument();
    expect(within(screen.getByLabelText("Process")).getByRole("option", { name: "All (1)" })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Process"), { target: { value: "USER" } });
    expect(screen.getByText("Old remove message")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Process"), { target: { value: "VERIFICATION" } });
    expect(screen.getByText("No gaps found.")).toBeInTheDocument();
    expect(screen.getAllByRole("option", { name: "All (1)" })).toHaveLength(2);

    fireEvent.change(screen.getByLabelText("Change type"), { target: { value: "" } });
    expect(screen.getByText("Newest addition message")).toBeInTheDocument();
    expect(within(screen.getByLabelText("Change type")).getByRole("option", { name: "All (1)" })).toBeInTheDocument();
    expect(within(screen.getByLabelText("Process")).getByRole("option", { name: "All (3)" })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Process"), { target: { value: "" } });
    expect(screen.getByText("Old remove message")).toBeInTheDocument();
    expect(screen.getAllByRole("option", { name: "All (3)" })).toHaveLength(2);
  });
});
