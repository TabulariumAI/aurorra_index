import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { auditStoreApi } from "../store/auditStore";
import { AuditPanel } from "../component/AuditPanel";
import type { AuditReport, AuditWorkerClient } from "../type/audit.types";

const report: AuditReport = {
  gaps: [
    {
      aspect: "file",
      changeType: "ADD",
      date: "2026-01-03T12:00:00Z",
      message: "Newest addition message",
      page: 3,
      process: "verification",
    },
    {
      aspect: "cost",
      changeType: "CORRECTION",
      date: "2026-01-02T12:00:00Z",
      message: `First half of a very long message that will be truncated when rendered because it is intentionally verbose and exceeds two hundred characters to exercise the show more and show less behavior used in the audit details panel with additional words added for length. It should be clearly longer than two hundred characters for reliable detection.`,
      page: 2,
      process: "enrichment",
    },
    {
      aspect: "remove",
      changeType: "REMOVE",
      date: "2026-01-01T12:00:00Z",
      message: "Old remove message",
      page: 1,
      process: "user",
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

  it("renders a fixed audit header with a separately scrolling report body", async () => {
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
    expect(screen.queryByText("Audit report")).not.toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("Out of 3")).toBeInTheDocument();
    expect(screen.getByText("$1.66")).toHaveStyle({ color: "var(--background-main, #ffffff)" });
    expect(screen.getByText("Change type")).toBeInTheDocument();
    expect(screen.getByText("Process")).toBeInTheDocument();
    const header = document.querySelector("[data-audit-header]");
    const body = screen.getByRole("region", { name: "Audit report body" });
    expect(header).toHaveStyle({ flex: "0 0 auto" });
    expect(body).toHaveStyle({
      flex: "1 1 auto",
      minHeight: "0",
      overflowY: "auto",
    });
    expect(header?.contains(body)).toBe(false);
    const primaryRow = screen.getByRole("button", { name: "Close preview" }).closest("[data-audit-header-row='primary']");
    expect(primaryRow).toBeTruthy();
    expect(screen.getByRole("button", { name: "Close preview" }).parentElement).toHaveStyle({ flex: "0 0 auto" });
    expect(screen.getByText("Out of 3").closest("[data-audit-header-row='primary']")).toBeNull();
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
});
