import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { loadIqReport } from "../data/loadIqReport";
import { iqStoreApi } from "../store/iqStore";
import * as iqWorker from "../worker/iqWorkerClient";
import { queueStoreApi } from "../../queue/store/queueStore";
import * as metadataResource from "../../metdataview/data/metadataResource";
import type { IqReport, IqResource, IqWorkerClient } from "../type/iq.types";

const report: IqReport = { decision: "Pass", explanation: [], gates: [], iq_doc: 97, segments: [] };
function client(): IqWorkerClient {
  return { ackGate: vi.fn(), loadReport: vi.fn(async () => ({ report, metadataEtag: "" })) };
}
function input(workerClient: IqWorkerClient) {
  return { apiGatewayUrl: "https://api", authToken: "token", retryIntervalMs: 0, retryLimit: 5,
    onError: vi.fn(), onComplete: vi.fn(), session: "session-1", workerClient };
}
function deferred() {
  let finish!: (value: IqResource) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<IqResource>((yes, no) => { finish = yes; reject = no; });
  return { promise, resolve: (report: IqReport) => finish({ report, metadataEtag: "" }), reject };
}
describe("loadIqReport", () => {
  beforeEach(() => { iqStoreApi.getState().resetIq(); queueStoreApi.getState().reset(); });
  afterEach(() => vi.restoreAllMocks());
  it("does not dispatch an obsolete read after its metadata lookup settles", async () => {
    let finish!: (etag: string) => void;
    vi.spyOn(metadataResource, "requestResource").mockReturnValueOnce(new Promise<string>(resolve => { finish = resolve; }));
    const worker = client();
    const request = input(worker);
    const load = loadIqReport(request);
    iqStoreApi.getState().resetIq();
    finish("old-version");
    await load;
    expect(worker.loadReport).not.toHaveBeenCalled();
    expect(request.onComplete).not.toHaveBeenCalled();
  });
  it("resolves source metadata in the data caller and omits it for forced refresh", async () => {
    const worker = client();
    const request = input(worker);
    queueStoreApi.getState().setEtag(request.session, "current-version");
    await loadIqReport(request);
    expect(worker.loadReport).toHaveBeenLastCalledWith("token", "session-1", "current-version");
    await loadIqReport({ ...request, restart: true });
    expect(worker.loadReport).toHaveBeenLastCalledWith("token", "session-1", null);
  });
  it("loads through one GET and calls completion after storing the report", async () => {
    const worker = client();
    const request = input(worker);
    await loadIqReport(request);
    expect(worker.loadReport).toHaveBeenCalledExactlyOnceWith("token", "session-1", null);
    expect(iqStoreApi.getState()).toMatchObject({ activeSession: "session-1", report, status: "success" });
    expect(request.onComplete).toHaveBeenCalledWith(report);
  });
  it("shares concurrent reads but revalidates an already loaded report", async () => {
    const worker = client();
    const request = input(worker);
    await Promise.all([loadIqReport(request), loadIqReport(request)]);
    expect(worker.loadReport).toHaveBeenCalledTimes(1);
    await loadIqReport(request);
    expect(worker.loadReport).toHaveBeenCalledTimes(2);
  });
  it("calls each caller's completion callback when sharing a request", async () => {
    const worker = client();
    const pending = deferred();
    vi.mocked(worker.loadReport).mockReturnValueOnce(pending.promise);
    const first = input(worker);
    const second = input(worker);
    const reads = [loadIqReport(first), loadIqReport(second)];
    pending.resolve(report);
    await Promise.all(reads);
    expect(worker.loadReport).toHaveBeenCalledTimes(1);
    expect(first.onComplete).toHaveBeenCalledExactlyOnceWith(report);
    expect(second.onComplete).toHaveBeenCalledExactlyOnceWith(report);
  });
  it("forces refresh and queues it behind an active read", async () => {
    const worker = client();
    const pending = deferred();
    vi.mocked(worker.loadReport).mockReturnValueOnce(pending.promise);
    const request = input(worker);
    const first = loadIqReport(request);
    const refresh = loadIqReport({ ...request, restart: true });
    await vi.waitFor(() => expect(worker.loadReport).toHaveBeenCalledTimes(1));
    pending.resolve(report);
    await Promise.all([first, refresh]);
    expect(worker.loadReport).toHaveBeenLastCalledWith("token", "session-1", null);
    expect(worker.loadReport).toHaveBeenCalledTimes(2);
    expect(request.onComplete).toHaveBeenCalledTimes(2);
  });
  it.each([null, "session-2"])("discards late success after session changes to %s", async session => {
    const worker = client();
    const pending = deferred();
    vi.mocked(worker.loadReport).mockReturnValueOnce(pending.promise);
    const request = input(worker);
    const load = loadIqReport(request);
    const queued = loadIqReport({ ...request, restart: true });
    await vi.waitFor(() => expect(worker.loadReport).toHaveBeenCalledTimes(1));
    iqStoreApi.getState().resetIq();
    if (session) iqStoreApi.getState().setLoaded(session, { ...report, iq_doc: 55 }, "");
    pending.resolve(report);
    await Promise.all([load, queued]);
    expect(worker.loadReport).toHaveBeenCalledTimes(1);
    expect(request.onComplete).not.toHaveBeenCalled();
    expect(iqStoreApi.getState().activeSession).toBe(session);
    expect(iqStoreApi.getState().report?.iq_doc ?? null).toBe(session ? 55 : null);
  });
  it("reports request failure and permits a later retry", async () => {
    const worker = client();
    vi.mocked(worker.loadReport).mockRejectedValueOnce(Object.assign(new Error("load failed"), { code: "iq_error", status: 500 }));
    const request = input(worker);
    await loadIqReport(request);
    expect(request.onError).toHaveBeenCalledWith({ code: "iq_error", details: undefined, error: "load failed", status: 500 });
    expect(request.onComplete).not.toHaveBeenCalled();
    expect(iqStoreApi.getState().status).toBe("error");
    await loadIqReport(request);
    expect(iqStoreApi.getState().report).toEqual(report);
  });
  it("discards late errors after a session change", async () => {
    const worker = client();
    const pending = deferred();
    vi.mocked(worker.loadReport).mockReturnValueOnce(pending.promise);
    const request = input(worker);
    const load = loadIqReport(request);
    await vi.waitFor(() => expect(worker.loadReport).toHaveBeenCalledTimes(1));
    iqStoreApi.getState().setLoaded("session-2", { ...report, iq_doc: 55 }, "");
    pending.reject(new Error("old session failed"));
    await load;
    expect(request.onError).not.toHaveBeenCalled();
    expect(iqStoreApi.getState().status).toBe("success");
  });
  it("calls each caller's error callback when sharing a failed request", async () => {
    const worker = client();
    const pending = deferred();
    vi.mocked(worker.loadReport).mockReturnValueOnce(pending.promise);
    const first = input(worker);
    const second = input(worker);
    const reads = [loadIqReport(first), loadIqReport(second)];
    pending.reject(new Error("shared failure"));
    await Promise.all(reads);
    expect(worker.loadReport).toHaveBeenCalledTimes(1);
    for (const request of [first, second]) {
      expect(request.onError).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ error: "shared failure" }));
      expect(request.onComplete).not.toHaveBeenCalled();
    }
  });
  it.each(["success", "error"])("ignores old %s after resetting and reopening the same session", async outcome => {
    const oldWorker = client();
    const pending = deferred();
    vi.mocked(oldWorker.loadReport).mockReturnValueOnce(pending.promise);
    const oldRequest = input(oldWorker);
    const oldLoad = loadIqReport(oldRequest);
    const oldRefresh = loadIqReport({ ...oldRequest, restart: true });
    await vi.waitFor(() => expect(oldWorker.loadReport).toHaveBeenCalledTimes(1));
    iqStoreApi.getState().resetIq();
    const worker = client();
    const current = { ...report, iq_doc: 55 };
    vi.mocked(worker.loadReport).mockResolvedValueOnce({ report: current, metadataEtag: "" });
    const request = input(worker);
    const reopened = loadIqReport(request);
    await Promise.resolve();
    await Promise.resolve();
    if (outcome === "success") pending.resolve(report);
    else pending.reject(new Error("obsolete failure"));
    await Promise.all([oldLoad, oldRefresh, reopened]);
    expect(worker.loadReport).toHaveBeenCalledExactlyOnceWith("token", "session-1", null);
    expect(oldWorker.loadReport).toHaveBeenCalledTimes(1);
    expect(oldRequest.onComplete).not.toHaveBeenCalled();
    expect(oldRequest.onError).not.toHaveBeenCalled();
    expect(request.onComplete).toHaveBeenCalledExactlyOnceWith(current);
    expect(iqStoreApi.getState()).toMatchObject({ activeSession: "session-1", report: current, status: "success", error: null });
  });
  it("keeps the reopened request shared when an obsolete request finishes first", async () => {
    const worker = client();
    const old = deferred();
    const current = deferred();
    vi.mocked(worker.loadReport).mockReturnValueOnce(old.promise).mockReturnValueOnce(current.promise);
    const previous = input(worker);
    const oldLoad = loadIqReport(previous);
    await vi.waitFor(() => expect(worker.loadReport).toHaveBeenCalledTimes(1));
    iqStoreApi.getState().resetIq();
    const request = input(worker);
    const reopened = loadIqReport(request);
    old.resolve(report);
    await oldLoad;
    const loading = iqStoreApi.getState().status;
    const shared = input(worker);
    const sharedLoad = loadIqReport(shared);
    current.resolve({ ...report, iq_doc: 55 });
    await Promise.all([reopened, sharedLoad]);
    expect(worker.loadReport).toHaveBeenCalledTimes(2);
    expect(previous.onComplete).not.toHaveBeenCalled();
    expect(loading).toBe("loading");
    expect(request.onComplete).toHaveBeenCalledOnce();
    expect(shared.onComplete).toHaveBeenCalledOnce();
    expect(iqStoreApi.getState().report?.iq_doc).toBe(55);
  });
  it("runs a queued forced refresh after a shared failure", async () => {
    const worker = client();
    const pending = deferred();
    vi.mocked(worker.loadReport).mockReturnValueOnce(pending.promise);
    const request = input(worker);
    const read = loadIqReport(request);
    const refresh = loadIqReport({ ...request, restart: true });
    pending.reject(new Error("read failed"));
    await Promise.all([read, refresh]);
    expect(worker.loadReport).toHaveBeenCalledTimes(2);
    expect(worker.loadReport).toHaveBeenLastCalledWith("token", "session-1", null);
    expect(request.onError).toHaveBeenCalledOnce();
    expect(request.onComplete).toHaveBeenCalledExactlyOnceWith(report);
    expect(iqStoreApi.getState().status).toBe("success");
  });

  it("ignores obsolete retries after resetting and reopening the same session", async () => {
    const worker = client();
    const pending = deferred();
    vi.mocked(worker.loadReport).mockReturnValueOnce(pending.promise);
    const factory = vi.spyOn(iqWorker, "createIqWorkerClient").mockReturnValue(worker);
    const request = input(worker);
    const oldLoad = loadIqReport({ ...request, workerClient: undefined });
    const retry = factory.mock.calls[0][0].onRetry!;
    retry(2);
    expect(iqStoreApi.getState().retryAttempt).toBe(2);
    iqStoreApi.getState().resetIq();
    await loadIqReport(input(client()));
    retry(3);
    pending.resolve(report);
    await oldLoad;
    expect(iqStoreApi.getState()).toMatchObject({ status: "success", retryAttempt: 0 });
    expect(request.onComplete).not.toHaveBeenCalled();
  });

});
