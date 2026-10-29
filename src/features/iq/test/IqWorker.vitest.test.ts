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
  it.each(["source-one", ""])("retains the generated source from the envelope, source=%s", async source => {
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce(jsonResponse({ status: "completed", data: "https://blob/report.json", metadata_etag: source }))
      .mockResolvedValueOnce(jsonResponse({ iq_doc: 98 })));
    expect(await new IqWorker().run({ apiBaseUrl: "x", session: "s", token: "t", type: "iqData", etag: "client-version" }))
      .toEqual({ ok: true, data: { report: { iq_doc: 98 }, metadataEtag: source } });
  });
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("uses GET with encoded metadata etag, and no etag for forced generation", async () => {
    const worker = new IqWorker();
    expect(worker.buildRequest({ apiBaseUrl: "https://gateway/", session: "session 1", token: "token", type: "iqData", etag: 'tag /+&' })).toEqual({
      body: null, method: "GET", url: "https://gateway/v1/iq/session%201/data?etag=tag%20%2F%2B%26",
    });
    for (const etag of [null, ""]) expect(worker.buildRequest({ apiBaseUrl: "https://gateway", session: "s", token: "t", type: "iqData", etag })).toEqual({ body: null, method: "GET", url: "https://gateway/v1/iq/s/data" });
    expect(worker.buildRequest({ apiBaseUrl: "https://gateway", session: "s", code: "gate 1", token: "t", type: "iqAck" }).url).toBe("https://gateway/v1/iq/s/gates/gate%201/ack");
    const fetchMock = vi.fn().mockResolvedValueOnce(jsonResponse({ status: "completed", data: "https://blob/report.json", metadata_etag: "" })).mockResolvedValueOnce(jsonResponse({ iq_doc: 98 }));
    vi.stubGlobal("fetch", fetchMock);
    expect(await worker.run({ apiBaseUrl: "https://gateway", session: "s", token: "t", type: "iqData", etag: null })).toEqual({ ok: true, data: { report: { iq_doc: 98 }, metadataEtag: "" } });
    expect(fetchMock).toHaveBeenNthCalledWith(1, "https://gateway/v1/iq/s/data", { body: null, method: "GET", cache: "no-store", headers: { Authorization: "Bearer t" } });
    expect(fetchMock).toHaveBeenNthCalledWith(2, "https://blob/report.json");
  });

  it("validates inputs and commands", async () => {
    const worker = new IqWorker();
    expect(await worker.run({ apiBaseUrl: "x", session: "s", token: "", type: "iqData", etag: null })).toEqual({ ok: false, code: "missing_auth_token", error: "Missing auth token" });
    expect(await worker.run({ apiBaseUrl: "", session: "s", token: "t", type: "iqData", etag: null })).toEqual({ ok: false, code: "missing_api_base_url", error: "Missing service base URL" });
    expect(await worker.run({ apiBaseUrl: "x", session: " ", token: "t", type: "iqData", etag: null })).toEqual({ ok: false, code: "invalid_session", error: "Session is missing or invalid." });
    expect(await worker.run({ apiBaseUrl: "x", code: " ", session: "s", token: "t", type: "iqAck" })).toEqual({ ok: false, code: "invalid_gate_code", error: "Gate code is missing or invalid." });
    expect(await worker.run({ apiBaseUrl: "x", session: "s", token: "t", type: "bad" } as unknown as IqWorkerCommand)).toEqual({ ok: false, code: "invalid_command", error: "Unknown IQ worker command." });
  });

  it("normalizes network and response errors", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => {
      throw new Error("network down");
    }));
    expect(await new IqWorker().run({ apiBaseUrl: "x", session: "s", token: "t", type: "iqData", etag: null })).toEqual({ ok: false, error: "network down" });

    vi.stubGlobal("fetch", vi.fn(async () => new Response("ok", { status: 200, headers: { "content-type": "text/plain" } })));
    expect(await new IqWorker().run({ apiBaseUrl: "x", session: "s", token: "t", type: "iqData", etag: null })).toEqual({ ok: false, code: "non_json_response", error: "Response is not JSON.", status: 200 });

    vi.stubGlobal("fetch", vi.fn(async () => new Response("{", { status: 200, headers: { "content-type": "application/json" } })));
    expect(await new IqWorker().run({ apiBaseUrl: "x", session: "s", token: "t", type: "iqData", etag: null })).toEqual({ ok: false, code: "invalid_json", error: "Response JSON could not be parsed.", status: 200 });

    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ code: "bad", error: "Bad request" }, { status: 400 })));
    expect(await new IqWorker().run({ apiBaseUrl: "x", session: "s", token: "t", type: "iqData", etag: null })).toEqual({
      ok: false,
      code: "bad",
      details: { code: "bad", error: "Bad request" },
      error: "Bad request",
      status: 400,
    });
  });

  it("returns IQ data envelope errors", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ status: "error", data: "iq failed" })));
    expect(await new IqWorker().run({ apiBaseUrl: "x", session: "s", token: "t", type: "iqData", etag: null })).toEqual({
      ok: false,
      code: "iq_error",
      details: { status: "error", data: "iq failed" },
      error: "iq failed",
    });
  });

  it("returns the IQ Blob download failure", async () => {
    const sasUrl = "https://storage.test/subscription/session/iq.json?sig=token";
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce(jsonResponse({ data: sasUrl, status: "completed", metadata_etag: "" }))
      .mockResolvedValueOnce(jsonResponse({ error: "SAS denied" }, { status: 403 })));

    expect(await new IqWorker().run({ apiBaseUrl: "x", session: "s", token: "t", type: "iqData", etag: null })).toEqual({
      ok: false,
      details: { error: "SAS denied" },
      error: "SAS denied",
      status: 403,
    });
  });

  it("returns the IQ Blob network failure", async () => {
    const sasUrl = "https://storage.test/subscription/session/iq.json?sig=token";
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce(jsonResponse({ data: sasUrl, status: "completed", metadata_etag: "" }))
      .mockRejectedValueOnce(new Error("Blob unavailable")));

    expect(await new IqWorker().run({ apiBaseUrl: "x", session: "s", token: "t", type: "iqData", etag: null })).toEqual({
      ok: false,
      error: "Blob unavailable",
    });
  });

  it("returns invalid JSON from the IQ Blob", async () => {
    const sasUrl = "https://storage.test/subscription/session/iq.json?sig=token";
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce(jsonResponse({ data: sasUrl, status: "completed", metadata_etag: "" }))
      .mockResolvedValueOnce(new Response("{", { status: 200, headers: { "content-type": "application/json" } })));

    expect(await new IqWorker().run({ apiBaseUrl: "x", session: "s", token: "t", type: "iqData", etag: null })).toEqual({
      ok: false,
      code: "invalid_json",
      error: "Response JSON could not be parsed.",
      status: 200,
    });
  });

});
