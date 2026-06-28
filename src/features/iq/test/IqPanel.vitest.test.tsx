import { render, screen, waitFor } from "@testing-library/react";
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
      segment_name: "party_clause",
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
    startReport: vi.fn(async () => ({ status: "completed", data: {}, isComplete: true })),
  };
}

describe("IqPanel", () => {
  beforeEach(() => {
    iqStoreApi.getState().resetIq();
  });

  it("renders loading progress and empty state", () => {
    render(<IqPanel apiGatewayUrl="https://api" authToken="token" callbacks={{}} session="session-1" workerClient={client(vi.fn(() => new Promise(() => undefined)))} />);
    expect(screen.getByLabelText("IQ progress")).toBeInTheDocument();
    expect(screen.getByText("No IQ report found.")).toBeInTheDocument();
  });

  it("renders report summary, segment table, explanations, notes, and no dialog role", async () => {
    render(<IqPanel apiGatewayUrl="https://api" authToken="token" callbacks={{}} session="session-1" workerClient={client()} />);

    await waitFor(() => expect(screen.getByText("Indexing Quality (IQ)")).toBeInTheDocument());
    expect(screen.getByText("90%")).toBeInTheDocument();
    expect(screen.getByText("Indexing Segments (1)")).toBeInTheDocument();
    expect(screen.getByText("Segment")).toBeInTheDocument();
    expect(screen.getByText("Expected")).toBeInTheDocument();
    expect(screen.getByText("Actual")).toBeInTheDocument();
    expect(screen.getByText("IQ")).toBeInTheDocument();
    expect(screen.getByText("Segment: Party Clause")).toBeInTheDocument();
    expect(screen.getByText("Segment explanation")).toBeInTheDocument();
    expect(screen.getByText("Notes")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders notes only when present", async () => {
    const noNotes = { ...report, explanation: [] };
    render(<IqPanel apiGatewayUrl="https://api" authToken="token" callbacks={{}} session="session-1" workerClient={client(vi.fn(async () => noNotes))} />);

    await waitFor(() => expect(screen.getByText("Indexing Quality (IQ)")).toBeInTheDocument());
    expect(screen.queryByText("Notes")).not.toBeInTheDocument();
  });
});
