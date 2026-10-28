import { afterEach, expect, it, vi } from "vitest";
import { iqStoreApi } from "../../../public-api";

const input = { apiGatewayUrl: "https://gateway", authToken: "token", session: "session-1" };
afterEach(() => vi.unstubAllGlobals());

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
