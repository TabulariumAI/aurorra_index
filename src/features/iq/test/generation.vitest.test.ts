import { afterEach, describe, expect, it, vi } from "vitest";
import { generateImagePackage, imageViewerStoreApi, iqStoreApi } from "../../../public-api";

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
    expect(commands).toEqual([{ apiBaseUrl: input.apiGatewayUrl, token: input.authToken, session: input.session, type }]);
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
    expect(workers).toHaveLength(2);
    workers[0].onmessage?.({ data: { ok: true, data: { status: "processing", data: "", isComplete: false } } } as MessageEvent);
    workers[1].onmessage?.({ data: { ok: true, data: { status: "processing", data: "", isComplete: false } } } as MessageEvent);
    await Promise.all([first, second]);
    const next = generate(input);
    expect(workers).toHaveLength(3);
    workers[2].onmessage?.({ data: { ok: true, data: { status: "processing", data: "", isComplete: false } } } as MessageEvent);
    await next;
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
