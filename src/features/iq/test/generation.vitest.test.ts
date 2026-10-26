import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { generateImagePackage, imageViewerStoreApi, iqStoreApi } from "../../../public-api";

import { queueStoreApi } from "../../queue/store/queueStore";
beforeEach(() => queueStoreApi.setState({ etags: { "session-1": "metadata-etag" } }));

const input = { apiGatewayUrl: "https://gateway", authToken: "token", session: "session-1" };

afterEach(() => vi.unstubAllGlobals());

describe.each([
  ["image package", generateImagePackage, "imagePackage"],
] as const)("generate %s", (_name, generate, type) => {
  it("starts generation without polling, downloading, or changing panel state", async () => {
    const commands: unknown[] = [];
    const terminate = vi.fn();
    class WorkerMock {
      onmessage: ((event: MessageEvent) => void) | null = null;
      onerror: (() => void) | null = null;
      postMessage(command: unknown) {
        commands.push(command);
        this.onmessage?.({ data: { ok: true, data: { status: "processing", data: "", isComplete: false } } } as MessageEvent);
      }
      terminate = terminate;
    }
    vi.stubGlobal("Worker", WorkerMock);
    const image = imageViewerStoreApi.getState();
    const iq = iqStoreApi.getState();
    await generate(input);
    expect(commands).toEqual([{ apiBaseUrl: input.apiGatewayUrl, token: input.authToken, session: input.session, type, etag: "metadata-etag" }]);
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
    const first = generate(input);
    const second = generate(input);
    await vi.waitFor(() => expect(workers).toHaveLength(2));
    workers[0].onmessage?.({ data: { ok: true, data: { status: "processing", data: "", isComplete: false } } } as MessageEvent);
    workers[1].onmessage?.({ data: { ok: true, data: { status: "processing", data: "", isComplete: false } } } as MessageEvent);
    await Promise.all([first, second]);
    const next = generate(input);
    await vi.waitFor(() => expect(workers).toHaveLength(3));
    workers[2].onmessage?.({ data: { ok: true, data: { status: "processing", data: "", isComplete: false } } } as MessageEvent);
    await next;
  });

  it("loads an unopened session's metadata in the caller before starting the image worker", async () => {
    queueStoreApi.setState({ etags: {} });
    const commands: unknown[] = [];
    class WorkerMock {
      onmessage: ((event: MessageEvent) => void) | null = null;
      onerror = null;
      postMessage(command: { type: string }) {
        commands.push(command);
        this.onmessage?.({ data: command.type === "indexData"
          ? { ok: true, data: {}, path: "https://storage.test/metadata.json", etag: "loaded-etag" }
          : { ok: true, data: { status: "completed", data: {} } } } as MessageEvent);
      }
      terminate() {}
    }
    vi.stubGlobal("Worker", WorkerMock);
    await generate(input);
    expect(commands).toEqual([
      { apiBaseUrl: input.apiGatewayUrl, token: input.authToken, session: input.session, type: "indexData", path: null },
      { apiBaseUrl: input.apiGatewayUrl, token: input.authToken, session: input.session, type, etag: "loaded-etag" },
    ]);
  });

  it("does not start image work after the owner changes during metadata retrieval", async () => {
    const workers: WorkerMock[] = [];
    queueStoreApi.setState({ etags: {} });
    class WorkerMock {
      onmessage: ((event: MessageEvent) => void) | null = null;
      onerror = null;
      postMessage() { workers.push(this); }
      terminate() {}
    }
    vi.stubGlobal("Worker", WorkerMock);
    const generating = generate(input);
    const rejected = expect(generating).rejects.toMatchObject({ code: "SESSION_CLEARED" });
    expect(workers).toHaveLength(1);
    queueStoreApi.getState().reset();
    queueStoreApi.getState().setEtag(input.session, "new-owner-etag");
    workers[0].onmessage?.({ data: { ok: true, data: {}, path: "https://storage.test/old.json", etag: "old-owner-etag" } } as MessageEvent);
    await rejected;
    expect(workers).toHaveLength(1);
    expect(queueStoreApi.getState().etags[input.session]).toBe("new-owner-etag");
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
    await expect(generate(input)).rejects.toMatchObject({ message: "Failed to fetch", code: "network_error" });
    expect(commands).toHaveLength(1);
    await expect(generate(input)).rejects.toThrow("Failed to fetch");
    expect(commands).toHaveLength(2);
  });
});

it("background IQ generation uses the same GET without metadata etag or panel mutations", async () => {
  const { generateIqReport } = await import("../../../public-api");
  const commands: unknown[] = [];
  class WorkerMock {
    onmessage: ((event: MessageEvent) => void) | null = null;
    postMessage(command: unknown) { commands.push(command); this.onmessage?.({ data: { ok: true, data: { iq_doc: 98 } } } as MessageEvent); }
    terminate() {}
  }
  vi.stubGlobal("Worker", WorkerMock);
  const before = iqStoreApi.getState();
  await expect(generateIqReport(input)).resolves.toEqual({ iq_doc: 98 });
  expect(commands).toEqual([{ apiBaseUrl: input.apiGatewayUrl, token: input.authToken, session: input.session, type: "iqData", etag: null }]);
  expect(iqStoreApi.getState()).toBe(before);
});
