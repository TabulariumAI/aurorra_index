import { afterEach, describe, expect, it, vi } from "vitest";
import { createAddIndexWorkerClient } from "../worker/addIndexWorkerClient";

describe("addIndexWorkerClient", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("posts the Add Index command and resolves an accepted response", async () => {
    const posted: unknown[] = [];
    const terminate = vi.fn();
    class WorkerMock {
      onmessage: ((event: MessageEvent) => void) | null = null;
      onerror: ((event: ErrorEvent) => void) | null = null;
      constructor(_url: URL, options: WorkerOptions) {
        expect(options).toEqual({ type: "module" });
      }
      postMessage(command: unknown) {
        posted.push(command);
        this.onmessage?.({
          data: {
            data: { accepted: true, description: "Index added." },
            ok: true,
          },
        } as MessageEvent);
      }
      terminate() {
        terminate();
      }
    }
    vi.stubGlobal("Worker", WorkerMock);

    const client = createAddIndexWorkerClient({ apiBaseUrl: "https://gateway" });
    await expect(client.addIndex("token", "session-1", {
      aspect: "party",
      source: "P 3  Selected context",
      value: "Selected value",
    })).resolves.toEqual({ accepted: true, description: "Index added." });

    expect(posted).toEqual([{
      apiBaseUrl: "https://gateway",
      aspect: "party",
      session: "session-1",
      source: "P 3  Selected context",
      token: "token",
      type: "addIndex",
      value: "Selected value",
    }]);
    expect(terminate).toHaveBeenCalledTimes(1);
  });

  it("rejects with the complete worker error", async () => {
    const terminate = vi.fn();
    class WorkerMock {
      onmessage: ((event: MessageEvent) => void) | null = null;
      onerror: ((event: ErrorEvent) => void) | null = null;
      postMessage() {
        this.onmessage?.({
          data: {
            code: "index_not_added",
            details: { accepted: false, description: "Index already exists." },
            error: "Index already exists.",
            ok: false,
            status: 200,
          },
        } as MessageEvent);
      }
      terminate() {
        terminate();
      }
    }
    vi.stubGlobal("Worker", WorkerMock);

    const client = createAddIndexWorkerClient({ apiBaseUrl: "https://gateway" });
    await expect(client.addIndex("token", "session-1", {
      aspect: "party",
      source: "P 3  Selected context",
      value: "Selected value",
    })).rejects.toMatchObject({
      code: "index_not_added",
      details: { accepted: false, description: "Index already exists." },
      message: "Index already exists.",
      status: 200,
    });
    expect(terminate).toHaveBeenCalledTimes(1);
  });

  it("rejects worker runtime errors and terminates the worker", async () => {
    const terminate = vi.fn();
    class WorkerMock {
      onmessage: ((event: MessageEvent) => void) | null = null;
      onerror: ((event: ErrorEvent) => void) | null = null;
      postMessage() {
        this.onerror?.({ message: "Worker crashed" } as ErrorEvent);
      }
      terminate() {
        terminate();
      }
    }
    vi.stubGlobal("Worker", WorkerMock);

    const client = createAddIndexWorkerClient({ apiBaseUrl: "https://gateway" });
    await expect(client.addIndex("token", "session-1", {
      aspect: "party",
      source: "P 3  Selected context",
      value: "Selected value",
    })).rejects.toThrow("Worker crashed");
    expect(terminate).toHaveBeenCalledTimes(1);
  });
});
