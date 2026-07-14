import { beforeEach, describe, expect, it, vi } from "vitest";
import { loadIqReport } from "../data/loadIqReport";
import { iqStoreApi } from "../store/iqStore";
import type { IqReport, IqWorkerClient } from "../type/iq.types";

const report: IqReport = {
  decision: "Pass",
  explanation: [],
  gates: [],
  iq_doc: 97,
  segments: [],
};

function createClient(): IqWorkerClient {
  return {
    ackGate: vi.fn(async () => ({ data: {}, isComplete: true as const, status: "completed" })),
    loadReport: vi.fn(async () => report),
    pollReport: vi.fn()
      .mockResolvedValueOnce({ data: null, isComplete: false as const, status: "pending" as const })
      .mockResolvedValueOnce({ data: report, isComplete: true as const, status: "completed" as const }),
    startReport: vi.fn(async () => ({ data: {}, isComplete: false, status: "pending" })),
  };
}

describe("loadIqReport", () => {
  beforeEach(() => {
    iqStoreApi.getState().resetIq();
  });

  it("starts, polls, stores the report, and emits each job lifecycle", async () => {
    const client = createClient();
    const onJobEvent = vi.fn();

    await loadIqReport({
      apiGatewayUrl: "https://api",
      authToken: "token",
      onError: vi.fn(),
      onJobEvent,
      pollIntervalMs: 0,
      session: "session-1",
      workerClient: client,
    });

    expect(client.startReport).toHaveBeenCalledWith("token", "session-1");
    expect(client.pollReport).toHaveBeenCalledTimes(2);
    expect(onJobEvent.mock.calls.map(([event]) => `${event.job}:${event.phase}`)).toEqual([
      "iq.start:started",
      "iq.start:completed",
      "iq.poll:started",
      "iq.poll:completed",
    ]);
    expect(iqStoreApi.getState()).toMatchObject({ activeSession: "session-1", report, status: "success" });
  });

  it("shares an active session load and skips an already loaded report", async () => {
    const client = createClient();
    vi.mocked(client.pollReport).mockReset();
    vi.mocked(client.pollReport).mockResolvedValue({ data: report, isComplete: true, status: "completed" });
    const input = {
      apiGatewayUrl: "https://api",
      authToken: "token",
      onError: vi.fn(),
      onJobEvent: vi.fn(),
      pollIntervalMs: 0,
      session: "session-1",
      workerClient: client,
    };

    await Promise.all([loadIqReport(input), loadIqReport(input)]);
    await loadIqReport(input);

    expect(client.startReport).toHaveBeenCalledTimes(1);
    expect(client.pollReport).toHaveBeenCalledTimes(1);
  });

  it("reports a start failure without polling", async () => {
    const client = createClient();
    vi.mocked(client.startReport).mockRejectedValueOnce(Object.assign(new Error("start failed"), { code: "start_error", status: 500 }));
    const onError = vi.fn();
    const onJobEvent = vi.fn();

    await loadIqReport({
      apiGatewayUrl: "https://api",
      authToken: "token",
      onError,
      onJobEvent,
      session: "session-1",
      workerClient: client,
    });

    expect(client.pollReport).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith({ code: "start_error", details: undefined, error: "start failed", status: 500 });
    expect(onJobEvent.mock.calls.map(([event]) => `${event.job}:${event.phase}`)).toEqual([
      "iq.start:started",
      "iq.start:failed",
    ]);
    expect(iqStoreApi.getState().status).toBe("error");
  });
});
