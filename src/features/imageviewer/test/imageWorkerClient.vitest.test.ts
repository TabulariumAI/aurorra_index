import { afterEach, describe, expect, it, vi } from "vitest";
import { createWorkerClient } from "../worker/imageWorkerClient";

const response = { status: "completed", data: { tiff: "https://storage.test/image.tiff", data: "https://storage.test/image.json" } };
afterEach(() => vi.unstubAllGlobals());

describe("image worker client", () => {
  it.each([false, true])("passes the explicit operation %s without metadata access", async refresh => {
    const commands: unknown[] = [];
    const terminate = vi.fn();
    class WorkerMock {
      onmessage: ((event: MessageEvent) => void) | null = null;
      onerror = null;
      postMessage(command: unknown) { commands.push(command); this.onmessage?.({ data: { ok: true, data: response } } as MessageEvent); }
      terminate = terminate;
    }
    vi.stubGlobal("Worker", WorkerMock);
    await expect(createWorkerClient({ apiBaseUrl: "https://gateway" }).packageImage("token", "session", refresh)).resolves.toEqual(response);
    expect(commands).toEqual([{ apiBaseUrl: "https://gateway", token: "token", session: "session", type: "imagePackage", refresh }]);
    expect(terminate).toHaveBeenCalledOnce();
  });

  it("passes download inputs and transfers the result without store access", async () => {
    const commands: unknown[] = [];
    const local = { packageMetadata: { pages: [] }, tiffBytes: new ArrayBuffer(4), tiffType: "image/tiff" };
    class WorkerMock {
      onmessage: ((event: MessageEvent) => void) | null = null;
      onerror = null;
      postMessage(command: unknown) { commands.push(command); this.onmessage?.({ data: { ok: true, data: local } } as MessageEvent); }
      terminate() {}
    }
    vi.stubGlobal("Worker", WorkerMock);
    await expect(createWorkerClient({ apiBaseUrl: "https://gateway" }).downloadPackage("token", { tiffUrl: response.data.tiff, jsonUrl: response.data.data })).resolves.toBe(local);
    expect(commands).toEqual([{ token: "token", type: "imageDownload", tiffUrl: response.data.tiff, jsonUrl: response.data.data }]);
  });
});
