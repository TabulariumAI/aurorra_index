import { act, fireEvent, render, screen, within } from "@testing-library/react";
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

const resource = vi.fn(async () => ({ aspects: { reference: ["recording_number"], party: ["grantor"], transaction: ["recording_date"] } }));

function client(loadReport = vi.fn(async () => report)): AuditWorkerClient {
  return {
    loadReport,
  };
}


describe("AuditPanel", () => {
  beforeEach(() => {
    auditStoreApi.getState().resetAudit();
    resource.mockClear();
  });

  it("shows all four service groups below audit gaps without a total-cost label", async () => {
    const service = { code: "one", cost: 11, time: 2, page_num: 2, timestamp: "2025-01-01T00:00:00Z" };
    const grouped: AuditReport = { ...report, usage: { ...report.usage, services: [
      { ...service, name: "extraction" },
      { ...service, code: "two", name: "extraction", cost: 22, time: 3, page_num: 3 },
      { ...service, code: "iq", name: "iq_refinement" },
      { ...service, code: "refine", name: "refinement", time: undefined },
      { ...service, code: "model", name: "model_generation", cost: 5.5, page_num: 0 },
    ] } };
    render(<AuditPanel onResource={resource} apiGatewayUrl="https://api" authToken="token" callbacks={{}}
      onReadyChange={vi.fn()} retryLimit={5} retryIntervalMs={0} session="session-1" workerClient={client(vi.fn(async () => grouped))} />);
    const table = await screen.findByRole("table", { name: "Audit service usage" });
    const usage = screen.getByRole("region", { name: "Audit usage" });
    expect(screen.getByRole("region", { name: "Audit report body" }).lastElementChild).toBe(usage);
    expect(screen.getByRole("region", { name: "Audit gaps" }).nextElementSibling).toBe(usage);
    expect(screen.queryByText("$1.66")).not.toBeInTheDocument();
    expect(within(table).getAllByRole("row")).toHaveLength(5);
    const extraction = within(table).getByRole("row", { name: "Extraction $33.0000 5.00 s 5" });
    expect(extraction).toBeInTheDocument();
    expect(within(table).getByRole("row", { name: "Model generation $5.5000 2.00 s 0" })).toBeInTheDocument();
    expect(within(table).getByRole("row", { name: "Refinement $11.0000 2" }).children[2]).toHaveTextContent("");
    fireEvent.change(screen.getByLabelText("Change type"), { target: { value: "ADD" } });
    expect(within(table).getAllByRole("row")).toHaveLength(5);
    expect(extraction).toBeInTheDocument();
  });

  it("does not add service rows when the audit contains no service usage", async () => {
    render(<AuditPanel onResource={resource} apiGatewayUrl="https://api" authToken="token" callbacks={{}}
      onReadyChange={vi.fn()} retryLimit={5} retryIntervalMs={0} session="session-1" workerClient={client()} />);
    await screen.findByText("Newest addition message");
    expect(screen.queryByRole("table", { name: "Audit service usage" })).not.toBeInTheDocument();
    expect(screen.queryByText("$1.66")).not.toBeInTheDocument();
  });

  it("reports loading to the host without package loading presentation", async () => {
    const onLoaderChange = vi.fn();
    render(
      <AuditPanel
        onResource={resource}
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

    await act(async () => {});
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    expect(onLoaderChange).toHaveBeenLastCalledWith(["Retrieving audit report...", "Attempt 1 of 5"]);
    expect(screen.queryByText("No gaps found.")).not.toBeInTheDocument();
  });

  it("renders the approved audit header and scrolling report body without a total-cost label", async () => {
    render(
      <AuditPanel
        onResource={resource}
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
    expect(within(screen.getByText("Out of 3").parentElement!).getByText("3")).toBeInTheDocument();
    expect(screen.getByText("Out of 3")).toBeInTheDocument();
    expect(screen.queryByText("$1.66")).not.toBeInTheDocument();
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
        onResource={resource}
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
    fireEvent.click(showMore);
    expect(await screen.findByText("[Show less]")).toBeInTheDocument();

    const showLess = screen.getByText("[Show less]");
    fireEvent.click(showLess);
    expect(screen.getByText("[Show more]")).toBeInTheDocument();
  });

  it("keeps the approved header and empty report when no usage exists", async () => {
    render(
      <AuditPanel
        onResource={resource}
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
    expect(screen.getAllByRole("option", { name: "All (0)" })).toHaveLength(3);
    expect(screen.queryByText("$1.66")).not.toBeInTheDocument();
  });

  it("filters GapEntry solution and owner through the existing controls", async () => {
    render(
      <AuditPanel
        onResource={resource}
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
    expect(screen.getAllByRole("option", { name: "All (3)" })).toHaveLength(3);
  });
  it("loads the catalog through the resource callback and filters by catalog segment names", async () => {
    render(<AuditPanel apiGatewayUrl="https://api" authToken="token" callbacks={{}} onResource={resource}
      onReadyChange={vi.fn()} retryLimit={5} retryIntervalMs={0} session="session-1" workerClient={client()} />);
    await screen.findByText("Newest addition message");
    expect(resource).toHaveBeenCalledTimes(1);
    expect(resource).toHaveBeenCalledWith({ resource: "aspects" });
    const segment = screen.getByLabelText("Segment");
    expect(within(segment).getAllByRole("option").map(option => option.textContent)).toEqual(["All (3)", "Reference (1)", "Party (1)", "Transaction (0)"]);
    fireEvent.change(segment, { target: { value: "party" } });
    expect(screen.getByText("Old remove message")).toBeVisible();
    expect(screen.queryByText("Newest addition message")).not.toBeInTheDocument();
    expect(screen.getByText("Out of 3").parentElement).toHaveTextContent("1");
    expect(within(screen.getByLabelText("Change type")).getByRole("option", { name: "All (1)" })).toBeVisible();
    fireEvent.change(screen.getByLabelText("Process"), { target: { value: "VERIFICATION" } });
    expect(screen.getByText("No gaps found.")).toBeVisible();
    expect(within(segment).getByRole("option", { name: "Reference (1)" })).toBeVisible();
    fireEvent.change(segment, { target: { value: "reference" } });
    expect(screen.getByText("Newest addition message")).toBeVisible();
    fireEvent.change(segment, { target: { value: "" } });
    fireEvent.change(screen.getByLabelText("Process"), { target: { value: "" } });
    expect(screen.getAllByRole("article")).toHaveLength(3);
    expect(resource).toHaveBeenCalledTimes(1);
  });

  it("waits for the catalog before exposing the report and reports resource failures", async () => {
    let reject!: (error: Error) => void;
    const onReadyChange = vi.fn();
    const onAuditError = vi.fn();
    render(<AuditPanel apiGatewayUrl="https://api" authToken="token" callbacks={{ onAuditError }}
      onResource={() => new Promise((_, fail) => { reject = fail; })} onReadyChange={onReadyChange}
      retryLimit={5} retryIntervalMs={0} session="session-1" workerClient={client()} />);
    expect(screen.queryByLabelText("Segment")).not.toBeInTheDocument();
    await act(async () => reject(new Error("Catalog unavailable")));
    expect(onAuditError).toHaveBeenCalledWith(expect.objectContaining({ error: "Catalog unavailable" }));
    expect(screen.queryByRole("article")).not.toBeInTheDocument();
    expect(onReadyChange).toHaveBeenLastCalledWith(true);
  });

  it("keeps host loading active until the catalog resolves", async () => {
    let resolve!: (value: unknown) => void;
    const onReadyChange = vi.fn();
    const onLoaderChange = vi.fn();
    const worker = client();
    render(<AuditPanel apiGatewayUrl="https://api" authToken="token" callbacks={{}} onResource={() => new Promise(done => { resolve = done; })}
      onReadyChange={onReadyChange} onLoaderChange={onLoaderChange} retryLimit={5} retryIntervalMs={0} session="session-1" workerClient={worker} />);
    await act(async () => { await worker.loadReport("token", "session-1"); });
    expect(screen.queryByRole("article")).not.toBeInTheDocument();
    expect(onReadyChange).not.toHaveBeenCalledWith(true);
    expect(onLoaderChange).toHaveBeenLastCalledWith(["Retrieving audit report..."]);
    await act(async () => resolve({ aspects: { reference: ["recording_number"], party: ["grantor"] } }));
    expect(screen.getAllByRole("article")).toHaveLength(3);
    expect(onReadyChange).toHaveBeenLastCalledWith(true);
    expect(onLoaderChange).toHaveBeenLastCalledWith(null);
  });

  it("rejects an invalid catalog through the existing error callback", async () => {
    const onAuditError = vi.fn();
    render(<AuditPanel apiGatewayUrl="https://api" authToken="token" callbacks={{ onAuditError }}
      onResource={async () => ({ aspects: { party: [1] } })} onReadyChange={vi.fn()}
      retryLimit={5} retryIntervalMs={0} session="session-1" workerClient={client()} />);
    await act(async () => {});
    expect(onAuditError).toHaveBeenCalledWith(expect.objectContaining({ error: "Aspects resource is invalid." }));
    expect(screen.queryByRole("article")).not.toBeInTheDocument();
  });

});
