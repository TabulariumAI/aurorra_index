import { beforeEach, describe, expect, it, vi } from "vitest";
import { IqWorker } from "../worker/IqWorker";
import type { IqWorkerCommand } from "../type/iq.types";

function jsonResponse(payload: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(payload), {
    status: 200,
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init.headers || {}),
    },
  });
}

describe("IqWorker", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("builds data, start, and ack routes", () => {
    const worker = new IqWorker();
    expect(worker.buildRequest({ apiBaseUrl: "https://doc.example.com/", session: "session-1", token: "token", type: "iqData" }).url).toBe("https://doc.example.com/v1/iq/session-1/data");
    expect(worker.buildRequest({ apiBaseUrl: "https://doc.example.com/", session: "session-1", token: "token", type: "iqStart" }).url).toBe("https://doc.example.com/v1/iq/session-1/start");
    expect(worker.buildRequest({ apiBaseUrl: "https://doc.example.com/", code: "gate-abc", session: "session-1", token: "token", type: "iqAck" }).url).toBe("https://doc.example.com/v1/iq/session-1/gates/gate-abc/ack");
    expect(worker.buildRequest({ apiBaseUrl: "https://doc.example.com", code: "gate abc", session: "session 1", token: "token", type: "iqAck" }).url).toBe("https://doc.example.com/v1/iq/session%201/gates/gate%20abc/ack");
  });

  it("sends bearer auth and expected request bodies", async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ iq_doc: 97 }));
    vi.stubGlobal("fetch", fetchMock);

    await new IqWorker().run({ apiBaseUrl: "https://doc.example.com", session: "session-1", token: "token", type: "iqData" });

    expect(fetchMock).toHaveBeenCalledWith("https://doc.example.com/v1/iq/session-1/data", {
      body: null,
      headers: { Authorization: "Bearer token" },
      method: "GET",
    });

    fetchMock.mockResolvedValueOnce(jsonResponse({ status: "processing", data: "" }));
    await new IqWorker().run({ apiBaseUrl: "https://doc.example.com", session: "session-1", token: "token", type: "iqStart" });
    expect(fetchMock).toHaveBeenLastCalledWith("https://doc.example.com/v1/iq/session-1/start", {
      body: "{}",
      headers: { Authorization: "Bearer token" },
      method: "POST",
    });
  });

  it("validates inputs and commands", async () => {
    const worker = new IqWorker();
    expect(await worker.run({ apiBaseUrl: "x", session: "s", token: "", type: "iqData" })).toEqual({ ok: false, code: "missing_auth_token", error: "Missing auth token" });
    expect(await worker.run({ apiBaseUrl: "", session: "s", token: "t", type: "iqData" })).toEqual({ ok: false, code: "missing_api_base_url", error: "Missing service base URL" });
    expect(await worker.run({ apiBaseUrl: "x", session: " ", token: "t", type: "iqData" })).toEqual({ ok: false, code: "invalid_session", error: "Session is missing or invalid." });
    expect(await worker.run({ apiBaseUrl: "x", code: " ", session: "s", token: "t", type: "iqAck" })).toEqual({ ok: false, code: "invalid_gate_code", error: "Gate code is missing or invalid." });
    expect(await worker.run({ apiBaseUrl: "x", session: "s", token: "t", type: "bad" } as unknown as IqWorkerCommand)).toEqual({ ok: false, code: "invalid_command", error: "Unknown IQ worker command." });
  });

  it("normalizes network and response errors", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => {
      throw new Error("network down");
    }));
    expect(await new IqWorker().run({ apiBaseUrl: "x", session: "s", token: "t", type: "iqData" })).toEqual({ ok: false, error: "network down" });

    vi.stubGlobal("fetch", vi.fn(async () => new Response("ok", { status: 200, headers: { "content-type": "text/plain" } })));
    expect(await new IqWorker().run({ apiBaseUrl: "x", session: "s", token: "t", type: "iqData" })).toEqual({ ok: false, code: "non_json_response", error: "Response is not JSON.", status: 200 });

    vi.stubGlobal("fetch", vi.fn(async () => new Response("{", { status: 200, headers: { "content-type": "application/json" } })));
    expect(await new IqWorker().run({ apiBaseUrl: "x", session: "s", token: "t", type: "iqData" })).toEqual({ ok: false, code: "invalid_json", error: "Response JSON could not be parsed.", status: 200 });

    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ code: "bad", error: "Bad request" }, { status: 400 })));
    expect(await new IqWorker().run({ apiBaseUrl: "x", session: "s", token: "t", type: "iqData" })).toEqual({
      ok: false,
      code: "bad",
      details: { code: "bad", error: "Bad request" },
      error: "Bad request",
      status: 400,
    });
  });

  it("parses IQ data envelopes and IQ errors", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ status: "error", data: "iq failed" })));
    expect(await new IqWorker().run({ apiBaseUrl: "x", session: "s", token: "t", type: "iqData" })).toEqual({
      ok: false,
      code: "iq_error",
      details: { status: "error", data: "iq failed" },
      error: "iq failed",
    });

    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ status: "completed", data: "{\"iq_doc\":97,\"decision\":\"Pass\",\"gates\":[],\"segments\":[],\"explanation\":[]}" })));
    expect(await new IqWorker().run({ apiBaseUrl: "x", session: "s", token: "t", type: "iqData" })).toEqual({
      ok: true,
      data: { iq_doc: 97, decision: "Pass", gates: [], segments: [], explanation: [] },
    });
  });
});
