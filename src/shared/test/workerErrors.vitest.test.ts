import { afterEach, expect, it, vi } from "vitest";
import { createAuditWorkerClient } from "../../features/audit/worker/auditWorkerClient";
import { createSessionDataWorkerClient } from "../../features/choices/worker/choicesWorkerClient";
import { createWorkerClient } from "../../features/imageviewer/worker/imageWorkerClient";
import { generateIqReport, createIqWorkerClient } from "../../features/iq/worker/iqWorkerClient";
import { runMetadataWorker } from "../../features/metdataview/worker/metadataWorkerClient";
import { createPageSegmentsWorkerClient } from "../../features/pagesegments/worker/pageSegmentsWorkerClient";
import { queueStoreApi } from "../../features/queue/store/queueStore";
import { toIqError } from "../../features/iq/data/iqData";
import { toViewerError } from "../../features/imageviewer/data/imageViewerData";

afterEach(() => { vi.unstubAllGlobals(); queueStoreApi.getState().reset(); });

it("retains the original event through feature error conversion", () => {
  const event = new ErrorEvent("error", { message: "Network failed", error: new Error("Network failed", { cause: new Error("Import failed") }) });
  expect(toIqError(event)).toMatchObject({ error: event.message, cause: event });
  expect(toViewerError(event, "Image unavailable")).toMatchObject({ error: event.message, cause: event });
  expect(toViewerError(new Error(event.message, { cause: event }), "Image unavailable")).toMatchObject({ error: event.message, cause: event });
});

it.each([
  ["Choices", () => createSessionDataWorkerClient({ apiBaseUrl: "https://gateway" }).load("token", "session")],
  ["Audit", () => createAuditWorkerClient({ apiBaseUrl: "https://gateway", retryLimit: 3, retryIntervalMs: 0 }).loadReport("token", "session")],
  ["Image", () => createWorkerClient({ apiBaseUrl: "https://gateway" }).packageImage("token", "session", false)],
  ["IQ generation", () => generateIqReport({ apiGatewayUrl: "https://gateway", authToken: "token", session: "session" })],
  ["IQ read", () => {
    queueStoreApi.getState().setEtag("session", "etag");
    return createIqWorkerClient({ apiBaseUrl: "https://gateway", retryLimit: 3, retryIntervalMs: 0 }).loadReport("token", "session", false);
  }],
  ["Index", () => runMetadataWorker({ apiBaseUrl: "https://gateway", token: "token", session: "session", type: "indexData" })],
  ["Page segments", () => createPageSegmentsWorkerClient({ apiBaseUrl: "https://gateway" }).pagesData("token", "session")],
] as const)("%s bubbles the original runtime event and cause without retrying", async (_name, request) => {
  const cause = new Error("Module import failed");
  const error = new Error("Network connection failed", { cause });
  const event = new ErrorEvent("error", { message: error.message, error, filename: "worker.js", lineno: 8, colno: 3 });
  const terminate = vi.fn();
  const commands = vi.fn();
  class WorkerMock {
    onerror: ((event: ErrorEvent) => void) | null = null;
    onmessage: ((event: MessageEvent) => void) | null = null;
    postMessage(command: unknown) { commands(command); this.onerror?.(event); }
    terminate = terminate;
  }
  vi.stubGlobal("Worker", WorkerMock);
  await expect(request()).rejects.toBe(event);
  expect(event.error).toBe(error);
  expect(event.error.cause).toBe(cause);
  expect(commands).toHaveBeenCalledTimes(1);
  expect(terminate).toHaveBeenCalledTimes(1);
});
