import type { ResourceRequest } from "aurora-core";
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
  usage: { services: [] },
};

const resource = vi.fn((request: ResourceRequest) => request.callback({ ok: true, data: { aspects: { reference: ["recording_number"], party: ["grantor"], transaction: ["recording_date"] } } }));

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

  it("shows all four service groups below audit gaps", async () => {
    const service = { code: "one", cost: 11, time: 2, page_num: 2, timestamp: "2025-01-01T00:00:00Z" };
    const grouped: AuditReport = { ...report, usage: { ...report.usage, services: [
      { ...service, name: "extraction" },
      { ...service, code: "two", name: "extraction", cost: 22, time: 3, page_num: 3 },
      { ...service, code: "iq", name: "iq_refinement" },
      { ...service, code: "refine", name: "refinement", time: undefined },
      { ...service, code: "model", name: "model_generation", cost: 5.5, page_num: 0 },
    ] } };
    render(<AuditPanel onResource={resource} apiGatewayUrl="https://api" authToken="token" callbacks={{}} retryLimit={5} retryIntervalMs={0} session="session-1" workerClient={client(vi.fn(async () => grouped))} />);
    const table = await screen.findByRole("table", { name: "Audit service usage" });
    const usage = screen.getByRole("region", { name: "Audit usage" });
    expect(screen.getByRole("region", { name: "Audit report body" }).lastElementChild).toBe(usage);
    expect(screen.getByRole("region", { name: "Audit gaps" }).nextElementSibling).toBe(usage);
    expect(within(table).getAllByRole("columnheader").map(header => header.textContent)).toEqual(["Service", "Cost", "Time", "Pages"]);
    expect(within(table).getAllByRole("row")).toHaveLength(5);
    const extraction = within(table).getByRole("row", { name: "Index Extraction $33.0000 5.00 s 5" });
    expect(extraction).toBeInTheDocument();
    expect(within(table).getByRole("row", { name: "Model Generation $5.5000 2.00 s 0" })).toBeInTheDocument();
    expect(within(table).getByRole("row", { name: "User Refinement $11.0000 2" }).children[2]).toHaveTextContent("");
    fireEvent.change(screen.getByLabelText("Change type"), { target: { value: "ADD" } });
    expect(within(table).getAllByRole("row")).toHaveLength(5);
    expect(extraction).toBeInTheDocument();
  });

  it("does not add service rows when the audit contains no service usage", async () => {
    render(<AuditPanel onResource={resource} apiGatewayUrl="https://api" authToken="token" callbacks={{}} retryLimit={5} retryIntervalMs={0} session="session-1" workerClient={client()} />);
    await screen.findByText("Newest addition message");
    expect(screen.queryByRole("table", { name: "Audit service usage" })).not.toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Audit usage" })).not.toBeInTheDocument();
  });

  it("keeps per-session totals isolated when changing sessions", async () => {
    const service = { name: "extraction" as const, code: "first", cost: 0.125, time: 0, page_num: 1, timestamp: "2025-01-01T00:00:00Z" };
    const workerClient: AuditWorkerClient = { loadReport: vi.fn(async (_token, session) => ({
      gaps: [], usage: { services: session === "first" ? [service, { ...service, code: "second", cost: 0.25 }] : [{ ...service, code: "other", cost: 2 }] },
    })) };
    const props = { onResource: resource, apiGatewayUrl: "https://api", authToken: "token", callbacks: {}, retryLimit: 5, retryIntervalMs: 0, workerClient };
    const { rerender } = render(<AuditPanel {...props} session="first" />);
    expect(await screen.findByRole("row", { name: "Index Extraction $0.3750 0.00 s 2" })).toBeInTheDocument();
    rerender(<AuditPanel {...props} session="other" />);
    expect(await screen.findByRole("row", { name: "Index Extraction $2.0000 0.00 s 1" })).toBeInTheDocument();
    expect(screen.queryByText("$0.3750")).not.toBeInTheDocument();
    expect(within(screen.getByRole("table", { name: "Audit service usage" })).getAllByRole("row")).toHaveLength(2);
  });

  it("renders the approved audit header and scrolling report body", async () => {
    render(
      <AuditPanel
        onResource={resource}
        apiGatewayUrl="https://api"
        authToken="token"
        callbacks={{}}
        retryLimit={5}
        retryIntervalMs={0}
        session="session-1"
        workerClient={client()}
      />,
    );

    await screen.findByText("Newest addition message");
    expect(within(screen.getByText("Out of 3").parentElement!).getByText("3")).toBeInTheDocument();
    expect(screen.getByText("Out of 3")).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Audit usage" })).not.toBeInTheDocument();
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
        retryLimit={5}
        retryIntervalMs={0}
        session="session-1"
        workerClient={client(vi.fn(async () => ({ gaps: [], usage: { services: [] } })))}
      />,
    );

    await screen.findByText("No gaps found.");
    expect(screen.getAllByRole("option", { name: "All (0)" })).toHaveLength(3);
    expect(screen.queryByRole("region", { name: "Audit usage" })).not.toBeInTheDocument();
  });

  it("filters GapEntry solution and owner through the existing controls", async () => {
    render(
      <AuditPanel
        onResource={resource}
        apiGatewayUrl="https://api"
        authToken="token"
        callbacks={{}}
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
    render(<AuditPanel apiGatewayUrl="https://api" authToken="token" callbacks={{}} onResource={resource} retryLimit={5} retryIntervalMs={0} session="session-1" workerClient={client()} />);
    await screen.findByText("Newest addition message");
    expect(resource).toHaveBeenCalledTimes(1);
    expect(resource).toHaveBeenCalledWith(expect.objectContaining({ resource: "aspects", session: "session-1", callback: expect.any(Function) }));
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


  it.each(["pending", "failed"])("keeps report data visible when aspects are %s", async state => {
    let callback!: ResourceRequest["callback"];
    const onAuditError = vi.fn();
    render(<AuditPanel apiGatewayUrl="https://api" authToken="token" callbacks={{ onAuditError }}
      onResource={request => { callback = request.callback; }} retryLimit={5} retryIntervalMs={0}
      session="session-1" workerClient={client()} />);
    expect(screen.getByRole("region", { name: "Audit report body" })).toBeInTheDocument();
    expect(screen.getByRole("status", { name: "Loading audit gaps" })).toBeInTheDocument();
    expect(await screen.findByText("Newest addition message")).toBeVisible();
    expect(screen.getByLabelText("Change type")).toBeEnabled();
    expect(screen.getByRole("status", { name: "Loading segment options" })).toBeVisible();
    if (state === "failed") {
      await act(async () => callback({ ok: false, error: "Catalog unavailable", code: "catalog_failed", status: 503 }));
      expect(screen.getByRole("alert")).toHaveTextContent("Segment options could not be loaded. Refresh the audit report to try again.");
      expect(screen.getByRole("alert")).toHaveStyle({ color: "var(--error-text-color-light)", background: "#FEF2F2" });
      expect(screen.getByText("Newest addition message")).toBeVisible();
      expect(onAuditError).not.toHaveBeenCalled();
    }
  });

  it("mounts independent placeholders and starts report and aspects concurrently", async () => {
    let callback!: ResourceRequest["callback"];
    let resolve!: (value: AuditReport) => void;
    const loadReport = vi.fn(() => new Promise<AuditReport>(done => { resolve = done; }));
    const onResource = vi.fn((request: ResourceRequest) => { callback = request.callback; });
    render(<AuditPanel onResource={onResource} apiGatewayUrl="https://api" authToken="token" callbacks={{}}
      retryLimit={5} retryIntervalMs={0} session="session-1" workerClient={client(loadReport)} />);
    for (const name of ["Loading audit filters", "Loading audit summary", "Loading audit gaps", "Loading service usage"])
      expect(screen.getByRole("status", { name })).toBeInTheDocument();
    expect(loadReport).toHaveBeenCalledExactlyOnceWith("token", "session-1");
    expect(onResource).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ resource: "aspects", session: "session-1", callback: expect.any(Function) }));
    await act(async () => callback({ ok: true, data: { aspects: { party: ["grantor"] } } }));
    expect(screen.getByRole("status", { name: "Loading audit gaps" })).toBeVisible();
    await act(async () => resolve(report));
    expect(screen.getByText("Newest addition message")).toBeVisible();
    expect(screen.getByLabelText("Segment")).toBeEnabled();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("loads segment options after the report without resetting active filters", async () => {
    let callback!: ResourceRequest["callback"];
    render(<AuditPanel onResource={request => { callback = request.callback; }} apiGatewayUrl="https://api"
      authToken="token" callbacks={{}} retryLimit={5} retryIntervalMs={0} session="session-1" workerClient={client()} />);
    await screen.findByText("Newest addition message");
    fireEvent.change(screen.getByLabelText("Change type"), { target: { value: "REMOVE" } });
    await act(async () => callback({ ok: true, data: { aspects: { reference: ["recording_number"], party: ["grantor"], transaction: ["recording_date"] } } }));
    expect(screen.getByLabelText("Change type")).toHaveValue("REMOVE");
    expect(screen.getByText("Old remove message")).toBeVisible();
    expect(screen.queryByText("Newest addition message")).not.toBeInTheDocument();
    expect(within(screen.getByLabelText("Segment")).getByRole("option", { name: "Transaction (0)" })).toBeInTheDocument();
  });

  it("ignores a previous session catalog callback", async () => {
    const callbacks: ResourceRequest["callback"][] = [];
    const onResource = (request: ResourceRequest) => { callbacks.push(request.callback); };
    const props = { onResource, apiGatewayUrl: "https://api", authToken: "token", callbacks: {}, retryLimit: 5, retryIntervalMs: 0, workerClient: client() };
    const view = render(<AuditPanel {...props} session="first" />);
    await screen.findByText("Newest addition message");
    view.rerender(<AuditPanel {...props} session="second" />);
    await act(async () => callbacks[1]({ ok: true, data: { aspects: { party: ["grantor"] } } }));
    await act(async () => callbacks[0]({ ok: true, data: { aspects: { old: ["stale"] } } }));
    expect(within(screen.getByLabelText("Segment")).queryByRole("option", { name: /Old/ })).not.toBeInTheDocument();
    expect(within(screen.getByLabelText("Segment")).getByRole("option", { name: /Party/ })).toBeInTheDocument();
  });

  it("keeps report failure in the existing report error callback", async () => {
    const onAuditError = vi.fn();
    render(<AuditPanel onResource={() => undefined} apiGatewayUrl="https://api" authToken="token" callbacks={{ onAuditError }}
      retryLimit={5} retryIntervalMs={0} session="session-1" workerClient={client(vi.fn(async () => { throw new Error("Audit unavailable"); }))} />);
    await act(async () => {});
    expect(onAuditError).toHaveBeenCalledWith(expect.objectContaining({ error: "Audit unavailable" }));
    expect(screen.queryByText("No gaps found.")).not.toBeInTheDocument();
  });
});
