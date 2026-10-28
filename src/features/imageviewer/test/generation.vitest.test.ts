import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { imageViewerStoreApi, iqStoreApi } from "../../../public-api";

import { createWorkerClient } from "../worker/imageWorkerClient";
import { queueStoreApi } from "../../queue/store/queueStore";
beforeEach(() => queueStoreApi.getState().reset());

const input = { apiGatewayUrl: "https://gateway", authToken: "token", session: "session-1" };
const client = createWorkerClient({ apiBaseUrl: input.apiGatewayUrl });

afterEach(() => vi.unstubAllGlobals());

const response = { status: "completed", data: { tiff: "https://storage.test/image.tiff", data: "https://storage.test/image.json" } };

describe("image package generation", () => {
  it("starts generation without polling, downloading, or changing panel state", async () => {
    const commands: unknown[] = [];
    const terminate = vi.fn();
    class WorkerMock {
      onmessage: ((event: MessageEvent) => void) | null = null;
      onerror: (() => void) | null = null;
      postMessage(command: unknown) {
        commands.push(command);
        this.onmessage?.({ data: { ok: true, data: response } } as MessageEvent);
      }
      terminate = terminate;
    }
    vi.stubGlobal("Worker", WorkerMock);
    const image = imageViewerStoreApi.getState();
    const iq = iqStoreApi.getState();
    await client.packageImage(input.authToken, input.session, true);
    expect(commands).toEqual([{ apiBaseUrl: input.apiGatewayUrl, token: input.authToken, session: input.session, type: "imagePackage", refresh: true }]);
    expect(terminate).toHaveBeenCalledOnce();
    expect(imageViewerStoreApi.getState()).toBe(image);
    expect(iqStoreApi.getState()).toBe(iq);
  });

  it("starts every completion request even while an earlier start is pending", async () => {
    const workers: WorkerMock[] = [];
    class WorkerMock {
      onmessage: ((event: MessageEvent) => void) | null = null;
      onerror: (() => void) | null = null;
      postMessage() { workers.push(this); }
      terminate() {}
    }
    vi.stubGlobal("Worker", WorkerMock);
    const first = client.packageImage(input.authToken, input.session, true);
    const second = client.packageImage(input.authToken, input.session, true);
    await vi.waitFor(() => expect(workers).toHaveLength(2));
    workers[0].onmessage?.({ data: { ok: true, data: response } } as MessageEvent);
    workers[1].onmessage?.({ data: { ok: true, data: response } } as MessageEvent);
    await Promise.all([first, second]);
    const next = client.packageImage(input.authToken, input.session, true);
    await vi.waitFor(() => expect(workers).toHaveLength(3));
    workers[2].onmessage?.({ data: { ok: true, data: response } } as MessageEvent);
    await next;
  });

  it("generates for an unopened session without retrieving metadata", async () => {
    queueStoreApi.getState().reset();
    const commands: unknown[] = [];
    class WorkerMock {
      onmessage: ((event: MessageEvent) => void) | null = null;
      onerror = null;
      postMessage(command: unknown) {
        commands.push(command);
        this.onmessage?.({ data: { ok: true, data: response } } as MessageEvent);
      }
      terminate() {}
    }
    vi.stubGlobal("Worker", WorkerMock);
    await client.packageImage(input.authToken, input.session, true);
    expect(commands).toEqual([{ apiBaseUrl: input.apiGatewayUrl, token: input.authToken, session: input.session, type: "imagePackage", refresh: true }]);
    expect(queueStoreApi.getState().etag).toBeNull();
  });

  it("propagates a failed start without retrying the POST or downloading", async () => {
    const commands: unknown[] = [];
    class WorkerMock {
      onmessage: ((event: MessageEvent) => void) | null = null;
      onerror: (() => void) | null = null;
      postMessage(command: unknown) {
        commands.push(command);
        this.onmessage?.({ data: { ok: false, error: "Failed to fetch", code: "network_error" } } as MessageEvent);
      }
      terminate() {}
    }
    vi.stubGlobal("Worker", WorkerMock);
    await expect(client.packageImage(input.authToken, input.session, true)).rejects.toMatchObject({ message: "Failed to fetch", code: "network_error" });
    expect(commands).toHaveLength(1);
    await expect(client.packageImage(input.authToken, input.session, true)).rejects.toThrow("Failed to fetch");
    expect(commands).toHaveLength(2);
  });
});

