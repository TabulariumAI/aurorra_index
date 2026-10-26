import { render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { iqStoreApi } from "../store/iqStore";
import { IqPanel } from "../component/IqPanel";
import type { IqReport, IqWorkerClient } from "../type/iq.types";

const report: IqReport = {
  iq_doc: 90,
  decision: "Review",
  gates: [{ code: "gate-1", status: "PASS", description: "Pass" }],
  segments: [
    {
      segment_name: "party",
      expected_weight: 50,
      actual_weight: 45,
      iq: 90,
      explanations: ["Segment explanation"],
    },
  ],
  explanation: ["Report note"],
};

function client(loadReport = vi.fn(async () => report)): IqWorkerClient {
  return {
    ackGate: vi.fn(async () => ({ status: "ok", data: {}, isComplete: true as const })),
    loadReport,
  };
}


describe("IqPanel", () => {
  beforeEach(() => {
    iqStoreApi.getState().resetIq();
  });

  it("shows placeholders immediately instead of another session's report", () => {
    iqStoreApi.getState().setLoaded("old-session", report);
    render(<IqPanel apiGatewayUrl="https://api" authToken="token" callbacks={{}} retryLimit={5} retryIntervalMs={0} session="new-session" workerClient={client(vi.fn(() => new Promise<IqReport>(() => undefined)))} />);
    expect(screen.getByRole("status", { name: "Loading IQ summary" })).toBeVisible();
    expect(screen.queryByText("90%")).not.toBeInTheDocument();
  });

  it("renders named placeholders immediately while the report is pending", async () => {
    let finish!: (value: IqReport) => void;
    const pending = new Promise<IqReport>(resolve => { finish = resolve; });
    render(<IqPanel apiGatewayUrl="https://api" authToken="token" callbacks={{}} retryLimit={5} retryIntervalMs={0} session="session-1" workerClient={client(vi.fn(() => pending))} />);
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    for (const label of ["Loading IQ summary", "Loading indexing segments", "Loading IQ gates"]) {
      expect(screen.getByRole("status", { name: label })).toHaveAttribute("aria-busy", "true");
    }
    expect(screen.getByText("Indexing Quality (IQ)")).toBeVisible();
    expect(screen.getByText("Indexing Segments", { exact: true })).toBeVisible();
    expect(screen.getAllByText("Compliance Gates")).toHaveLength(2);
    expect(screen.getAllByRole("columnheader").map(cell => cell.textContent)).toEqual(["Segment", "Expected", "Actual", "IQ"]);
    const segments = screen.getByRole("status", { name: "Loading indexing segments" });
    expect(segments.querySelectorAll("tbody tr")).toHaveLength(3);
    expect(segments.querySelector("tbody")).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByRole("status", { name: "Loading IQ gates" }).querySelectorAll("li")).toHaveLength(2);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByText(/Loading IQ summary…|Loading indexing segments…|Loading IQ gates…/)).not.toBeInTheDocument();
    expect(screen.queryByText("No IQ report found.")).not.toBeInTheDocument();
    finish(report);
    await waitFor(() => expect(screen.getByText("90%")).toBeInTheDocument());
    expect(screen.queryByRole("status", { name: /^Loading/ })).not.toBeInTheDocument();
  });

  it("renders report summary, segment table, explanations, notes, and no dialog role", async () => {
    render(<IqPanel apiGatewayUrl="https://api" authToken="token" callbacks={{}} retryLimit={5} retryIntervalMs={0} session="session-1" workerClient={client()} />);

    await waitFor(() => expect(screen.getByText("90%")).toBeInTheDocument());
    expect(screen.getByText("90%")).toBeInTheDocument();
    expect(screen.getByText("Indexing Segments (1)")).toBeInTheDocument();
    expect(screen.getByText("Segment")).toBeInTheDocument();
    expect(screen.getByText("Expected")).toBeInTheDocument();
    expect(screen.getByText("Actual")).toBeInTheDocument();
    expect(screen.getByText("IQ")).toBeInTheDocument();
    expect(screen.getByText("Segment: Party")).toBeInTheDocument();
    expect(screen.getByText("Segment explanation")).toBeInTheDocument();
    expect(screen.getByText("Notes")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Indexing Quality" }).querySelector("[data-panel-scroll='true']")).toBeTruthy();
  });

  it("renders notes only when present", async () => {
    const noNotes = { ...report, explanation: [] };
    render(<IqPanel apiGatewayUrl="https://api" authToken="token" callbacks={{}} retryLimit={5} retryIntervalMs={0} session="session-1" workerClient={client(vi.fn(async () => noNotes))} />);

    await waitFor(() => expect(screen.getByText("90%")).toBeInTheDocument());
    expect(screen.queryByText("Notes")).not.toBeInTheDocument();
  });

  it("orders indexing segments by expected weight descending and retains report order for ties", async () => {
    const mixed = {
      ...report,
      segments: [
        { segment_name: "transaction", expected_weight: 10, actual_weight: 10, iq: 100, explanations: [] },
        { segment_name: "party", expected_weight: 6, actual_weight: 6, iq: 100, explanations: [] },
        { segment_name: "sides", expected_weight: 12, actual_weight: 12, iq: 100, explanations: [] },
        { segment_name: "legal", expected_weight: 6, actual_weight: 0, iq: 0, explanations: [] },
        { segment_name: "reference", expected_weight: 2, actual_weight: 2, iq: 100, explanations: [] },
      ],
    };
    render(<IqPanel apiGatewayUrl="https://api" authToken="token" callbacks={{}} retryLimit={5} retryIntervalMs={0} session="session-1" workerClient={client(vi.fn(async () => mixed))} />);

    await waitFor(() => expect(screen.getByText("Indexing Segments (5)")).toBeInTheDocument());
    const rows = within(screen.getByRole("table")).getAllByRole("row").slice(1);
    expect(rows.map((row) => within(row).getAllByRole("cell")[0].textContent)).toEqual(["Sides", "Transaction", "Party", "Legal", "Reference"]);
  });
});
