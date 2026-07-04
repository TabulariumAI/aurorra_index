import { afterEach, describe, expect, it, vi } from "vitest";
import { createWorkerClient } from "../worker/imageWorkerClient";

describe("WorkerClient", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("creates module worker commands and resolves package results", async () => {
    const posted: unknown[] = [];
    class WorkerMock {
      onmessage: ((event: MessageEvent) => void) | null = null;
      onerror: (() => void) | null = null;
      constructor(_url: URL, options: WorkerOptions) {
        expect(options).toEqual({ type: "module" });
      }
      postMessage(command: unknown) {
        posted.push(command);
        this.onmessage?.({ data: { ok: true, data: { status: "completed", data: "" } } } as MessageEvent);
      }
      terminate() {}
    }
    vi.stubGlobal("Worker", WorkerMock);

    const client = createWorkerClient({ apiBaseUrl: "https://gateway" });
    await expect(client.packageImage("token", "session-1")).resolves.toEqual({ status: "completed", data: "" });

    expect(posted).toEqual([{ apiBaseUrl: "https://gateway", session: "session-1", token: "token", type: "imagePackage" }]);
  });

  it("resolves downloaded package bytes from worker result", async () => {
    const tiffBytes = new TextEncoder().encode("tiff").buffer;
    const posted: unknown[] = [];
    class WorkerMock {
      onmessage: ((event: MessageEvent) => void) | null = null;
      onerror: (() => void) | null = null;
      postMessage(command: unknown) {
        posted.push(command);
        this.onmessage?.({
          data: {
            data: {
              packageMetadata: { pages: [1] },
              tiffBytes,
              tiffType: "image/tiff",
            },
            ok: true,
          },
        } as MessageEvent);
      }
      terminate() {}
    }
    vi.stubGlobal("Worker", WorkerMock);

    const client = createWorkerClient({ apiBaseUrl: "https://gateway" });
    await expect(client.downloadPackage("token", {
      jsonUrl: "https://storage.test/image.json",
      tiffUrl: "https://storage.test/image.tiff",
    })).resolves.toEqual({
      packageMetadata: { pages: [1] },
      tiffBytes,
      tiffType: "image/tiff",
    });
    expect(posted).toEqual([{
      jsonUrl: "https://storage.test/image.json",
      tiffUrl: "https://storage.test/image.tiff",
      token: "token",
      type: "imageDownload",
    }]);
  });
});
