import { afterEach, describe, expect, it, vi } from "vitest";
import { createAuditWorkerClient } from "../worker/auditWorkerClient";

describe("auditWorkerClient", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("retries the audit read after a connectivity failure", async () => {
    const commands: unknown[] = [];
    const onRetry = vi.fn();
    let attempts = 0;

    class WorkerMock {
      onmessage: ((event: MessageEvent) => void) | null = null;
      onerror: ((event: ErrorEvent) => void) | null = null;

      postMessage(command: unknown) {
        commands.push(command);
        attempts += 1;
        this.onmessage?.({
          data: attempts === 1
            ? { error: "Failed to fetch", ok: false }
            : { data: { gaps: [] }, ok: true },
        } as MessageEvent);
      }

      terminate() {}
    }
    vi.stubGlobal("Worker", WorkerMock);

    const client = createAuditWorkerClient({ apiBaseUrl: "https://gateway", onRetry, retryIntervalMs: 0, retryLimit: 5 });

    await expect(client.loadReport("token", "session-1")).resolves.toEqual({ gaps: [] });
    expect(commands).toEqual([
      { apiBaseUrl: "https://gateway", session: "session-1", token: "token", type: "auditData" },
      { apiBaseUrl: "https://gateway", session: "session-1", token: "token", type: "auditData" },
    ]);
    expect(onRetry).toHaveBeenCalledWith(2);
  });
});
