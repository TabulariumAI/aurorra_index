import { loaderDelayMs } from "aurora-core";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { IqPanel, iqStoreApi, refreshIqReport } from "../../../public-api";
import * as iqWorker from "../worker/iqWorkerClient";
import type { IqPanelProps, IqResource, IqWorkerClient, IqWorkerConfig } from "../type/iq.types";

const report = { iq_doc: 98, decision: "Pass", gates: [], segments: [], explanation: [] };
const request = { apiGatewayUrl: "https://api", authToken: "token", session: "session-1", retryLimit: 5, retryIntervalMs: 7500, onError: vi.fn() };

describe("IQ loading phases", () => {
  let config: IqWorkerConfig;
  let finish: (value: IqResource) => void;
  let fail: (error: Error) => void;
  let worker: IqWorkerClient;
  let scrollDescriptor: PropertyDescriptor | undefined;

  beforeEach(() => {
    iqStoreApi.getState().resetIq();
    request.onError.mockClear();
    scrollDescriptor = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "scrollIntoView");
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", { configurable: true, value: vi.fn() });
    worker = {
      ackGate: vi.fn(),
      loadReport: vi.fn(() => new Promise<IqResource>((resolve, reject) => { finish = resolve; fail = reject; })),
    };
    vi.spyOn(iqWorker, "createIqWorkerClient").mockImplementation(next => { config = next; return worker; });
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
    if (scrollDescriptor) Object.defineProperty(HTMLElement.prototype, "scrollIntoView", scrollDescriptor);
    else delete (HTMLElement.prototype as { scrollIntoView?: unknown }).scrollIntoView;
  });

  it("restarts the decorative steps on a request retry and stops their timer when downloading", async () => {
    render(<IqPanel  {...request} callbacks={{}} />);
    await waitFor(() => expect(worker.loadReport).toHaveBeenCalledOnce());
    await act(async () => finish({ report, metadataEtag: "source" }));
    vi.useFakeTimers();
    let refresh!: Promise<void>;
    act(() => { refresh = refreshIqReport(request); });
    act(() => vi.advanceTimersByTime(request.retryIntervalMs));
    act(() => vi.advanceTimersByTime(request.retryIntervalMs));
    expect(screen.getByText("Generating IQ report…")).toBeVisible();
    act(() => config.onRetry!(2));
    expect(screen.getByText("Checking segment quality…")).toBeVisible();
    expect(screen.queryByText("Generating IQ report…")).not.toBeInTheDocument();
    expect(vi.getTimerCount()).toBe(1);
    act(() => config.onDownload!());
    expect(screen.queryByRole("status", { name: "Loading IQ summary" })).toBeNull();
    act(() => vi.advanceTimersByTime(loaderDelayMs));
    expect(vi.getTimerCount()).toBe(0);
    expect(screen.getByRole("status", { name: "Loading IQ summary" })).toBeVisible();
    await act(async () => { finish({ report, metadataEtag: "source" }); await refresh; });
  });

  it("shows ProgressView only for explicit regeneration, then placeholders until the report is downloaded", async () => {
    const props: IqPanelProps = { ...request, callbacks: {} };
    render(<IqPanel  {...props} />);
    await waitFor(() => expect(worker.loadReport).toHaveBeenCalledOnce());
    expect(await screen.findByRole("status", { name: "Loading IQ summary" })).toBeVisible();
    expect(screen.queryByTestId("progress-view")).not.toBeInTheDocument();
    await act(async () => finish({ report, metadataEtag: "source" }));
    expect(screen.getByText("98%")).toBeVisible();

    let refresh!: Promise<void>;
    act(() => { refresh = refreshIqReport(request); });
    expect(screen.getByTestId("progress-view")).toBeVisible();
    expect(screen.getByLabelText("In progress")).toHaveAttribute("aria-current", "step");
    expect(screen.getByText("Checking segment quality…")).toBeVisible();
    expect(screen.queryByRole("status", { name: "Loading IQ summary" })).not.toBeInTheDocument();
    expect(screen.queryByText("98%")).not.toBeInTheDocument();
    act(() => config.onDownload!());
    expect(screen.queryByTestId("progress-view")).not.toBeInTheDocument();
    for (const name of ["Loading IQ summary", "Loading indexing segments", "Loading IQ gates"]) {
      expect(await screen.findByRole("status", { name })).toBeVisible();
    }
    await act(async () => { finish({ report: { ...report, iq_doc: 100 }, metadataEtag: "next-source" }); await refresh; });
    expect(screen.getByText("100%")).toBeVisible();
    expect(screen.queryByTestId("progress-view")).not.toBeInTheDocument();
    expect(screen.queryByRole("status", { name: /^Loading/ })).not.toBeInTheDocument();
  });

  it.each([false, true])("ends the active UI and reports failure, downloading=%s", async downloading => {
    render(<IqPanel  {...request} callbacks={{}} />);
    await waitFor(() => expect(worker.loadReport).toHaveBeenCalledOnce());
    await act(async () => finish({ report, metadataEtag: "source" }));
    let refresh!: Promise<void>;
    act(() => { refresh = refreshIqReport(request); });
    if (downloading) act(() => config.onDownload!());
    await act(async () => { fail(new Error("IQ unavailable")); await refresh; });
    expect(request.onError).toHaveBeenCalledOnce();
    expect(screen.queryByTestId("progress-view")).not.toBeInTheDocument();
    expect(screen.queryByRole("status", { name: /^Loading/ })).not.toBeInTheDocument();
    expect(iqStoreApi.getState().status).toBe("error");
  });

  it("clears regeneration on a session change and ignores the previous download notification", async () => {
    const { rerender } = render(<IqPanel  {...request} callbacks={{}} />);
    await waitFor(() => expect(worker.loadReport).toHaveBeenCalledOnce());
    await act(async () => finish({ report, metadataEtag: "source" }));
    let refresh!: Promise<void>;
    act(() => { refresh = refreshIqReport(request); });
    const oldDownload = config.onDownload!;
    const oldFinish = finish;
    rerender(<IqPanel  {...request} session="session-2" callbacks={{}} />);
    await waitFor(() => expect(worker.loadReport).toHaveBeenCalledTimes(3));
    expect(screen.queryByTestId("progress-view")).not.toBeInTheDocument();
    expect(await screen.findByRole("status", { name: "Loading IQ summary" })).toBeVisible();
    await act(async () => { oldDownload(); oldFinish({ report, metadataEtag: "source" }); await refresh; });
    expect(iqStoreApi.getState()).toMatchObject({ activeSession: "session-2", status: "loading" });
    await act(async () => finish({ report, metadataEtag: "next-source" }));
    expect(screen.getByText("98%")).toBeVisible();
  });

  it("renders a fast IQ report without a loading status", async () => {
    vi.useFakeTimers();
    const workerClient = { ackGate: vi.fn(), loadReport: vi.fn(async () => ({ report, metadataEtag: "source" })) };
    render(<IqPanel {...request} workerClient={workerClient} callbacks={{}} />);
    expect(screen.queryByRole("status", { name: /^Loading/ })).toBeNull();
    await act(async () => {});
    expect(screen.getByText("98%")).toBeVisible();
    act(() => vi.advanceTimersByTime(loaderDelayMs));
    expect(screen.queryByRole("status", { name: /^Loading/ })).toBeNull();
  });

  it("restarts IQ placeholders for a new pending session", async () => {
    vi.useFakeTimers();
    const workerClient: IqWorkerClient = { ackGate: vi.fn(), loadReport: vi.fn(() => new Promise<IqResource>(() => {})) };
    const view = render(<IqPanel {...request} workerClient={workerClient} callbacks={{}} />);
    await act(async () => {});
    act(() => vi.advanceTimersByTime(loaderDelayMs));
    expect(screen.getByRole("status", { name: "Loading IQ summary" })).toBeVisible();
    view.rerender(<IqPanel {...request} session="second" workerClient={workerClient} callbacks={{}} />);
    expect(screen.queryAllByRole("status", { name: /^Loading/ })).toHaveLength(0);
    act(() => vi.advanceTimersByTime(loaderDelayMs - 1));
    expect(screen.queryAllByRole("status", { name: /^Loading/ })).toHaveLength(0);
    act(() => vi.advanceTimersByTime(1));
    expect(screen.getByRole("status", { name: "Loading IQ summary" })).toBeVisible();
  });
});
