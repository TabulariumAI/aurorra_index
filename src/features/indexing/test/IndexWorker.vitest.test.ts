import { afterEach, describe, expect, it, vi } from "vitest";
import { IndexWorker } from "../../metdata/worker/IndexWorker";

const metadata = {
  fees: [],
  funds: [],
  heading: {},
  indexes: [],
  pages: { num_of_pages: 1 },
  secrets: [],
};

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    headers: { "content-type": "application/json" },
    status: 200,
    ...init,
  });
}

function plainResponse(text = "plain", status = 200) {
  return new Response(text, { status });
}

function indexData(data: unknown, status = "completed") {
  return { data: JSON.stringify(data), status };
}

describe("IndexWorker", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("builds the required index route", () => {
    const request = new IndexWorker().buildRequest({
      apiBaseUrl: "https://doc.example.com/",
      session: "session/1",
      token: "token",
      type: "indexData",
    });

    expect(request).toEqual({
      body: null,
      method: "GET",
      url: "https://doc.example.com/v1/index/session%2F1/data",
    });
  });

  it("builds all mutation routes", () => {
    const worker = new IndexWorker();

    expect(worker.buildRequest({
      apiBaseUrl: "https://doc.example.com",
      segment: "party/clause",
      session: "session/1",
      token: "token",
      type: "reprocessSegment",
    })).toEqual({
      body: "{}",
      method: "POST",
      url: "https://doc.example.com/v1/refine/session%2F1/reprocess/party%2Fclause",
    });
    expect(worker.buildRequest({
      apiBaseUrl: "https://doc.example.com",
      code: "idx/1",
      session: "session/1",
      token: "token",
      type: "confirmIndex",
    })).toEqual({
      body: null,
      method: "POST",
      url: "https://doc.example.com/v1/refine/session%2F1/confirm/idx%2F1",
    });
    expect(worker.buildRequest({
      apiBaseUrl: "https://doc.example.com",
      code: "idx/1",
      session: "session/1",
      token: "token",
      type: "dropIndex",
    })).toEqual({
      body: null,
      method: "POST",
      url: "https://doc.example.com/v1/refine/session%2F1/drop/idx%2F1",
    });
    expect(worker.buildRequest({
      apiBaseUrl: "https://doc.example.com",
      session: "session/1",
      token: "token",
      type: "patchStatus",
      version: 3,
    })).toEqual({
      body: null,
      method: "GET",
      url: "https://doc.example.com/v1/refine/session%2F1/patch/status/3",
    });
  });

  it("executes index load with bearer auth header", async () => {
    const fetchMock = vi.fn(async () => jsonResponse(indexData(metadata)));
    vi.stubGlobal("fetch", fetchMock);

    const result = await new IndexWorker().run({
      apiBaseUrl: "https://doc.example.com",
      session: "session-1",
      token: "token-1",
      type: "indexData",
    });

    expect(result).toEqual({ ok: true, data: metadata });
    expect(fetchMock).toHaveBeenCalledWith("https://doc.example.com/v1/index/session-1/data", {
      body: null,
      headers: { Authorization: "Bearer token-1" },
      method: "GET",
    });
  });

  it("sends mutation commands with encoded values and required headers", async () => {
    const fetchMock = vi.fn(async (url: string, init: RequestInit) => {
      if (url.endsWith("/v1/refine/session-1/reprocess/party%2Fclause")) {
        return jsonResponse({ data: "ok", status: "completed" });
      }
      if (url.endsWith("/v1/refine/session-1/confirm/idx%2F1")) {
        return jsonResponse({ data: "", status: "processing", version: 2 });
      }
      if (url.endsWith("/v1/refine/session-1/drop/idx%2F1")) {
        return jsonResponse({ data: "", status: "processing", version: 2 });
      }
      return jsonResponse(indexData(metadata));
    });
    vi.stubGlobal("fetch", fetchMock);

    const worker = new IndexWorker();
    await expect(worker.run({
      apiBaseUrl: "https://doc.example.com",
      segment: "party/clause",
      session: "session-1",
      token: "token-1",
      type: "reprocessSegment",
    })).resolves.toMatchObject({ ok: true, data: { data: "ok", status: "completed" } });
    await expect(worker.run({
      apiBaseUrl: "https://doc.example.com",
      code: "idx/1",
      session: "session-1",
      token: "token-1",
      type: "confirmIndex",
    })).resolves.toMatchObject({ ok: true, data: { data: "", status: "processing", version: 2 } });
    await expect(worker.run({
      apiBaseUrl: "https://doc.example.com",
      code: "idx/1",
      session: "session-1",
      token: "token-1",
      type: "dropIndex",
    })).resolves.toMatchObject({ ok: true, data: { data: "", status: "processing", version: 2 } });

    expect(fetchMock).toHaveBeenNthCalledWith(1, "https://doc.example.com/v1/refine/session-1/reprocess/party%2Fclause", {
      body: "{}",
      headers: { Authorization: "Bearer token-1", "Content-Type": "application/json" },
      method: "POST",
    });
    expect(fetchMock).toHaveBeenNthCalledWith(2, "https://doc.example.com/v1/refine/session-1/confirm/idx%2F1", {
      body: null,
      headers: { Authorization: "Bearer token-1" },
      method: "POST",
    });
    expect(fetchMock).toHaveBeenNthCalledWith(3, "https://doc.example.com/v1/refine/session-1/drop/idx%2F1", {
      body: null,
      headers: { Authorization: "Bearer token-1" },
      method: "POST",
    });
  });

  it("rejects missing inputs and invalid sessions", async () => {
    const worker = new IndexWorker();

    await expect(worker.run({ apiBaseUrl: "", session: "s", token: "t", type: "indexData" })).resolves.toMatchObject({ code: "missing_api_base_url", ok: false });
    await expect(worker.run({ apiBaseUrl: "https://doc.example.com", session: "", token: "t", type: "indexData" })).resolves.toMatchObject({ code: "invalid_session", ok: false });
    await expect(worker.run({ apiBaseUrl: "https://doc.example.com", session: "s", token: "", type: "indexData" })).resolves.toMatchObject({ code: "missing_auth_token", ok: false });
  });

  it("handles network failures for all index routes", async () => {
    const worker = new IndexWorker();
    vi.stubGlobal("fetch", vi.fn(async () => {
      throw new Error("offline");
    }));

    await expect(worker.run({ apiBaseUrl: "https://doc.example.com", session: "s", token: "t", type: "indexData" })).resolves.toMatchObject({ error: "offline", ok: false });
    await expect(worker.run({ apiBaseUrl: "https://doc.example.com", session: "s", token: "t", segment: "party", type: "reprocessSegment" })).resolves.toMatchObject({ error: "offline", ok: false });
    await expect(worker.run({ apiBaseUrl: "https://doc.example.com", session: "s", token: "t", code: "idx-1", type: "confirmIndex" })).resolves.toMatchObject({ error: "offline", ok: false });
    await expect(worker.run({ apiBaseUrl: "https://doc.example.com", session: "s", token: "t", code: "idx-1", type: "dropIndex" })).resolves.toMatchObject({ error: "offline", ok: false });
  });

  it("handles non-json and invalid-json success responses for all routes", async () => {
    const worker = new IndexWorker();

    vi.stubGlobal("fetch", vi.fn(async () => plainResponse("plain")));
    await expect(worker.run({ apiBaseUrl: "https://doc.example.com", session: "s", token: "t", type: "indexData" })).resolves.toMatchObject({ code: "non_json_response", ok: false });
    await expect(worker.run({ apiBaseUrl: "https://doc.example.com", session: "s", token: "t", segment: "party", type: "reprocessSegment" })).resolves.toMatchObject({ code: "validation_error", ok: false });
    await expect(worker.run({ apiBaseUrl: "https://doc.example.com", session: "s", token: "t", code: "idx-1", type: "confirmIndex" })).resolves.toMatchObject({ code: "validation_error", ok: false });
    await expect(worker.run({ apiBaseUrl: "https://doc.example.com", session: "s", token: "t", code: "idx-1", type: "dropIndex" })).resolves.toMatchObject({ code: "validation_error", ok: false });

    vi.stubGlobal("fetch", vi.fn(async () => new Response("{", {
      headers: { "content-type": "application/json" },
      status: 200,
    })));
    await expect(worker.run({ apiBaseUrl: "https://doc.example.com", session: "s", token: "t", type: "indexData" })).resolves.toMatchObject({ code: "invalid_json", ok: false });
    await expect(worker.run({ apiBaseUrl: "https://doc.example.com", session: "s", token: "t", segment: "party", type: "reprocessSegment" })).resolves.toMatchObject({ code: "validation_error", ok: false });
    await expect(worker.run({ apiBaseUrl: "https://doc.example.com", session: "s", token: "t", code: "idx-1", type: "confirmIndex" })).resolves.toMatchObject({ code: "validation_error", ok: false });
    await expect(worker.run({ apiBaseUrl: "https://doc.example.com", session: "s", token: "t", code: "idx-1", type: "dropIndex" })).resolves.toMatchObject({ code: "validation_error", ok: false });
  });

  it("requires HTTP 200 for every mutation success", async () => {
    const worker = new IndexWorker();
    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ data: "ok", status: "completed" }, { status: 201 })));
    await expect(worker.run({ apiBaseUrl: "https://doc.example.com", session: "s", token: "t", segment: "party", type: "reprocessSegment" })).resolves.toMatchObject({ code: "validation_error", ok: false, status: 201 });

    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ data: "", status: "processing", version: 1 }, { status: 201 })));
    await expect(worker.run({ apiBaseUrl: "https://doc.example.com", session: "s", token: "t", code: "idx-1", type: "confirmIndex" })).resolves.toMatchObject({ code: "validation_error", ok: false, status: 201 });
    await expect(worker.run({ apiBaseUrl: "https://doc.example.com", session: "s", token: "t", code: "idx-1", type: "dropIndex" })).resolves.toMatchObject({ code: "validation_error", ok: false, status: 201 });
  });

  it("handles upstream failures for all routes", async () => {
    const worker = new IndexWorker();

    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ code: "bad", error: "Nope" }, { status: 500 })));
    await expect(worker.run({ apiBaseUrl: "https://doc.example.com", session: "s", token: "t", type: "indexData" })).resolves.toMatchObject({ code: "bad", error: "Nope", ok: false, status: 500 });
    await expect(worker.run({ apiBaseUrl: "https://doc.example.com", session: "s", token: "t", segment: "party", type: "reprocessSegment" })).resolves.toMatchObject({ code: "bad", error: "Nope", ok: false, status: 500 });
    await expect(worker.run({ apiBaseUrl: "https://doc.example.com", session: "s", token: "t", code: "idx-1", type: "confirmIndex" })).resolves.toMatchObject({ code: "bad", error: "Nope", ok: false, status: 500 });
    await expect(worker.run({ apiBaseUrl: "https://doc.example.com", session: "s", token: "t", code: "idx-1", type: "dropIndex" })).resolves.toMatchObject({ code: "bad", error: "Nope", ok: false, status: 500 });
  });

  it("validates malformed route payloads", async () => {
    const worker = new IndexWorker();

    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ data: 1, status: "completed" })));
    await expect(worker.run({ apiBaseUrl: "https://doc.example.com", session: "s", token: "t", segment: "party", type: "reprocessSegment" })).resolves.toMatchObject({ code: "validation_error", ok: false });

    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ data: "", status: "processing", version: "2" })));
    await expect(worker.run({ apiBaseUrl: "https://doc.example.com", session: "s", token: "t", code: "idx-1", type: "confirmIndex" })).resolves.toMatchObject({ code: "validation_error", ok: false });

    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ data: "", status: "processing" })));
    await expect(worker.run({ apiBaseUrl: "https://doc.example.com", session: "s", token: "t", code: "idx-1", type: "dropIndex" })).resolves.toMatchObject({ code: "validation_error", ok: false });

    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ data: "pending", status: "pending" })));
    await expect(worker.run({ apiBaseUrl: "https://doc.example.com", session: "s", token: "t", segment: "party", type: "reprocessSegment" })).resolves.toMatchObject({ code: "reprocess_not_completed", ok: false });

    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ data: "pending", status: 1 })));
    await expect(worker.run({ apiBaseUrl: "https://doc.example.com", session: "s", token: "t", segment: "party", type: "reprocessSegment" })).resolves.toMatchObject({ code: "validation_error", ok: false });

    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ data: "", status: "unknown", version: 1 })));
    await expect(worker.run({ apiBaseUrl: "https://doc.example.com", session: "s", token: "t", code: "idx-1", type: "confirmIndex" })).resolves.toMatchObject({ code: "validation_error", ok: false });

    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ data: 1, status: "error", version: 1 })));
    await expect(worker.run({ apiBaseUrl: "https://doc.example.com", session: "s", token: "t", code: "idx-1", type: "dropIndex" })).resolves.toMatchObject({ code: "validation_error", ok: false });

    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse(indexData({ heading: {} }))));
    await expect(worker.run({ apiBaseUrl: "https://doc.example.com", session: "s", token: "t", type: "indexData" })).resolves.toMatchObject({ code: "validation_error", ok: false });
  });
});
