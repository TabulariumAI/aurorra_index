import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { iqQueueStore } from "../store/iqQueueStore";
import { iqStoreApi } from "../store/iqStore";
import { IqPanel } from "../component/IqPanel";
import type { IqReport, IqResource, IqWorkerClient } from "../type/iq.types";

const report: IqReport = {
  iq_doc: 90,
  gates: [{ code: "gate-1", status: "PASS", description: "Pass" }],
  segments: [
    { cues: [],
      segment_name: "party",
      expected_weight: 50,
      actual_weight: 45,
      iq: 90,
      explanations: ["Segment explanation"],
    },
  ],
  notes: [{ segment: null, message: "Report note" }, { segment: null, message: "This document is a Warranty Deed conveying the property." }],
};

function client(loadReport: IqWorkerClient["loadReport"] = vi.fn(async () => ({ report, metadataEtag: "" }))): IqWorkerClient {
  return { ackCue: vi.fn(),
    ackGate: vi.fn(async () => ({ status: "ok", etag: "inputs-after", data: {}, isComplete: true as const })),
    loadReport,
  };
}


describe("IqPanel", () => {
  const scrollDescriptor = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "scrollIntoView");
  afterEach(() => {
    cleanup();
    iqQueueStore.getState().reset();
    if (scrollDescriptor) Object.defineProperty(HTMLElement.prototype, "scrollIntoView", scrollDescriptor);
    else delete (HTMLElement.prototype as Partial<HTMLElement>).scrollIntoView;
  });
  beforeEach(() => {
    iqQueueStore.getState().reset();
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", { configurable: true, value: vi.fn() });
    iqStoreApi.getState().resetIq();
  });

  it("delays placeholders instead of another session's report", async () => {
    iqStoreApi.getState().setLoaded("old-session", report, "");
    render(<IqPanel apiGatewayUrl="https://api" authToken="token" callbacks={{}} retryLimit={5} retryIntervalMs={0} session="new-session" workerClient={client(vi.fn(() => new Promise<IqResource>(() => undefined)))} />);
    expect(screen.queryByRole("status", { name: "Loading IQ summary" })).toBeNull();
    expect(await screen.findByRole("status", { name: "Loading IQ summary" })).toBeVisible();
    expect(screen.queryByText("90%")).not.toBeInTheDocument();
  });

  it("renders named placeholders after the shared delay while the report is pending", async () => {
    let finish!: (value: IqReport) => void;
    const pending = new Promise<IqResource>(resolve => { finish = report => resolve({ report, metadataEtag: "" }); });
    render(<IqPanel apiGatewayUrl="https://api" authToken="token" callbacks={{}} retryLimit={5} retryIntervalMs={0} session="session-1" workerClient={client(vi.fn(() => pending))} />);
    expect(screen.queryByRole("status")).toBeNull();
    await screen.findByRole("status", { name: "Loading IQ summary" });
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    for (const label of ["Loading IQ summary", "Loading indexing segments"]) {
      expect(screen.getByRole("status", { name: label })).toHaveAttribute("aria-busy", "true");
    }
    expect(screen.getByText("Indexing Quality (IQ)")).toBeVisible();
    expect(screen.queryByText("Indexing Segments", { exact: true })).toBeNull();
    expect(screen.getByText("Compliance Gates")).not.toBeVisible();
    expect(screen.getAllByRole("columnheader").map(cell => cell.textContent)).toEqual(["Segment", "Expected", "Actual", "IQ"]);
    const segments = screen.getByRole("status", { name: "Loading indexing segments" });
    expect(segments.querySelectorAll("tbody tr")).toHaveLength(3);
    expect(segments.querySelector("tbody")).toHaveAttribute("aria-hidden", "true");
    fireEvent.click(screen.getByRole("tab", { name: "Compliance" }));
    expect(screen.getByRole("status", { name: "Loading IQ gates" }).querySelectorAll("li")).toHaveLength(2);
    expect(screen.queryByRole("status", { name: "Loading IQ summary" })).toBeNull();
    fireEvent.click(screen.getByRole("tab", { name: "Notes" }));
    expect(screen.getByRole("status", { name: "Loading IQ notes" })).toBeVisible();
    fireEvent.click(screen.getByRole("tab", { name: "Quality" }));
    expect(screen.queryByText(/Loading IQ summary…|Loading indexing segments…|Loading IQ gates…/)).not.toBeInTheDocument();
    expect(screen.queryByText("No IQ report found.")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("tab", { name: "Compliance" }));
    finish(report);
    await waitFor(() => expect(screen.getByText("90%", { selector: "div" })).toBeInTheDocument());
    expect(screen.queryByRole("status", { name: /^Loading/ })).not.toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Compliance" })).toHaveAttribute("aria-selected", "true");
  });

  it("renders report summary, segment table, explanations, notes, and no dialog role", async () => {
    render(<IqPanel apiGatewayUrl="https://api" authToken="token" callbacks={{}} retryLimit={5} retryIntervalMs={0} session="session-1" workerClient={client()} />);

    await waitFor(() => expect(screen.getByText("90%", { selector: "div" })).toBeInTheDocument());
    expect(screen.getByText("90%", { selector: "div" })).toBeInTheDocument();
    expect(screen.queryByText(/^Indexing Segments/)).toBeNull();
    expect(screen.getByText("Segment")).toBeInTheDocument();
    expect(screen.getByText("Expected")).toBeInTheDocument();
    expect(screen.getByText("Actual")).toBeInTheDocument();
    expect(screen.getByText("IQ")).toBeInTheDocument();
    expect(screen.getByText("Segment: Party")).toBeInTheDocument();
    expect(screen.getByText("Segment explanation")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("tab", { name: "Notes" }));
    expect(screen.getByText("Report note")).toBeVisible();
    expect(screen.getAllByText("This document is a Warranty Deed conveying the property.")).toHaveLength(1);
    expect(screen.getByText("This document is a Warranty Deed conveying the property.")).toBeVisible();
    fireEvent.click(screen.getByRole("tab", { name: "Quality" }));
    expect(screen.getByText("This document is a Warranty Deed conveying the property.")).not.toBeVisible();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Indexing Quality" }).querySelector("[data-panel-scroll='true']")).toBeTruthy();
  });

  it("renders notes only when present", async () => {
    const noNotes = { ...report, notes: [] };
    render(<IqPanel apiGatewayUrl="https://api" authToken="token" callbacks={{}} retryLimit={5} retryIntervalMs={0} session="session-1" workerClient={client(vi.fn(async () => ({ report: noNotes, metadataEtag: "" })))} />);

    await waitFor(() => expect(screen.getByText("90%", { selector: "div" })).toBeInTheDocument());
    fireEvent.click(screen.getByRole("tab", { name: "Notes" }));
    expect(within(screen.getByRole("tabpanel", { name: "Notes" })).queryByRole("list")).toBeNull();
  });

  it("removes a cleared gate while preserving saved summaries and service notes", async () => {
    const mixed: IqReport = { ...report, gates: [
      { code: "pass", status: "PASS", description: "Passed requirement" },
      { code: "fail", status: "FAIL", description: "Failed requirement" },
    ], notes: [{ segment: null, message: "Report note" }, { segment: null, message: "Missing address" }, { segment: null, message: "Missing indexes: Person." }, { segment: null, message: "Unclassified indexes: Optimal (1/20)" }, { segment: null, message: "Compliance gates: not satisfied (1 / 2)." }, { segment: null, message: "Indexing quality needing attention: Party." }] };
    const workerClient = client(vi.fn(async () => ({ report: mixed, metadataEtag: "" })));
    render(<IqPanel apiGatewayUrl="https://api" authToken="token" callbacks={{}} retryLimit={5} retryIntervalMs={0} session="session-1" workerClient={workerClient} />);
    await screen.findByText("out of 2 gates");
    fireEvent.click(screen.getByRole("tab", { name: "Notes" }));
    const notes = screen.getByRole("tabpanel", { name: "Notes" });
    expect(Array.from(notes.querySelectorAll("p > span:last-child"), item => item.textContent)).toEqual(["Unclassified indexes: Optimal (1/20)", "Missing indexes: Person.", "Missing address", "Report note"]);
    expect(notes.querySelectorAll("p[data-status='warning']")).toHaveLength(1);
    expect(notes.querySelectorAll("p[data-status='success']")).toHaveLength(1);
    expect(screen.queryByText("Compliance gates: not satisfied (1 / 2).")).toBeNull();
    expect(screen.queryByText("Indexing quality needing attention: Party.")).toBeNull();
    expect(document.querySelector("[data-gate-code='info']")).toBeNull();
    fireEvent.click(screen.getByRole("tab", { name: "Compliance" }));
    expect(screen.getByText("50%")).toBeVisible();
    vi.mocked(workerClient.loadReport).mockResolvedValueOnce({ report: { ...mixed, gates: [mixed.gates[0]] }, metadataEtag: "updated" });
    fireEvent.click(screen.getByRole("button", { name: "Clear gate" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm" }));
    await waitFor(() => expect(document.querySelector("[data-gate-code='fail']")).toBeNull());
    expect(screen.getByText("out of 2 gates")).toBeVisible();
    expect(screen.getByText("50%")).toBeVisible();
    expect(workerClient.loadReport).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole("tab", { name: "Notes" }));
    expect(screen.getByText("Missing address")).toBeVisible();
    expect(screen.getByText("Missing indexes: Person.").closest("p")).toHaveAttribute("data-status", "warning");
    expect(screen.getByText("Unclassified indexes: Optimal (1/20)").closest("p")).toHaveAttribute("data-status", "success");
    expect(screen.getByRole("tabpanel", { name: "Notes" }).querySelectorAll("p")).toHaveLength(4);
    expect(within(screen.getByRole("tabpanel", { name: "Notes" })).queryByRole("img")).toBeNull();
    expect(screen.getByText("Report note").closest("p")).toHaveStyle({ color: "var(--title-ink)" });
    expect(workerClient.ackGate).toHaveBeenCalledExactlyOnceWith("token", "session-1", "fail");
  });

  it("renders service text-comparison descriptions and statuses without interpreting literals", async () => {
    const description = 'Notary Seal must be equal to "Available && Ready" (case-insensitive). This requirement is satisfied. Notary Seal: "AVAILABLE && READY".';
    const textReport: IqReport = { ...report, gates: [
      { code: "seal", status: "PASS", description },
      { code: "signature", status: "FAIL", description: 'Notary Signature is present. The available values do not satisfy this requirement. Notary Signature is "No".' },
      { code: "custom", status: "PASS", description: 'Custom Aspect is present. This requirement is satisfied. Custom Aspect is "YES".' },
    ] };
    render(<IqPanel apiGatewayUrl="https://api" authToken="token" callbacks={{}} retryLimit={5} retryIntervalMs={0} session="text-session" workerClient={client(vi.fn(async () => ({ report: textReport, metadataEtag: "" })))} />);
    await waitFor(() => expect(screen.getByText(description)).toBeInTheDocument());
    fireEvent.click(screen.getByRole("tab", { name: "Compliance" }));
    const seal = screen.getByText(description).closest("li")!;
    expect(within(seal).getByText("PASS")).toBeInTheDocument();
    expect(within(seal).queryByRole("button", { name: "Clear gate" })).not.toBeInTheDocument();
    const signature = screen.getByText(textReport.gates[1].description).closest("li")!;
    expect(within(signature).getByText("FAIL")).toBeInTheDocument();
    expect(within(signature).getByRole("button", { name: "Clear gate" })).toBeEnabled();
    expect(screen.getByText(textReport.gates[2].description)).toBeVisible();
    expect(screen.queryByText("Yes is unavailable.")).not.toBeInTheDocument();
  });

  it("orders indexing segments by expected weight descending and retains report order for ties", async () => {
    const mixed = {
      ...report,
      segments: [
        { cues: [], segment_name: "transaction", expected_weight: 10, actual_weight: 10, iq: 100, explanations: [] },
        { cues: [], segment_name: "party", expected_weight: 6, actual_weight: 6, iq: 100, explanations: [] },
        { cues: [], segment_name: "sides", expected_weight: 12, actual_weight: 12, iq: 100, explanations: [] },
        { cues: [], segment_name: "legal", expected_weight: 6, actual_weight: 0, iq: 0, explanations: [] },
        { cues: [], segment_name: "reference", expected_weight: 2, actual_weight: 2, iq: 100, explanations: [] },
      ],
    };
    render(<IqPanel apiGatewayUrl="https://api" authToken="token" callbacks={{}} retryLimit={5} retryIntervalMs={0} session="session-1" workerClient={client(vi.fn(async () => ({ report: mixed, metadataEtag: "" })))} />);

    await screen.findByRole("table");
    const rows = within(screen.getByRole("table")).getAllByRole("row").slice(1);
    expect(rows.map((row) => within(row).getAllByRole("cell")[0].textContent)).toEqual(["Sides", "Transaction", "Party", "Legal", "Reference"]);
  });
});
