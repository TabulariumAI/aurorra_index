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

  it("returns data with bearer auth header", async () => {
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
      headers: { Authorization: "Bearer token-1" },
      method: "GET",
    });
  });

  it("rejects missing inputs and invalid sessions", async () => {
    const worker = new IndexWorker();

    await expect(worker.run({ apiBaseUrl: "", session: "s", token: "t", type: "indexData" })).resolves.toMatchObject({ code: "missing_api_base_url", ok: false });
    await expect(worker.run({ apiBaseUrl: "https://doc.example.com", session: "", token: "t", type: "indexData" })).resolves.toMatchObject({ code: "invalid_session", ok: false });
    await expect(worker.run({ apiBaseUrl: "https://doc.example.com", session: "s", token: "", type: "indexData" })).resolves.toMatchObject({ code: "missing_auth_token", ok: false });
  });

  it("handles network, non-json, upstream, and validation failures", async () => {
    const worker = new IndexWorker();

    vi.stubGlobal("fetch", vi.fn(async () => {
      throw new Error("offline");
    }));
    await expect(worker.run({ apiBaseUrl: "https://doc.example.com", session: "s", token: "t", type: "indexData" })).resolves.toMatchObject({ error: "offline", ok: false });

    vi.stubGlobal("fetch", vi.fn(async () => new Response("plain", { status: 200 })));
    await expect(worker.run({ apiBaseUrl: "https://doc.example.com", session: "s", token: "t", type: "indexData" })).resolves.toMatchObject({ code: "non_json_response", ok: false });

    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse({ code: "bad", error: "Nope" }, { status: 500 })));
    await expect(worker.run({ apiBaseUrl: "https://doc.example.com", session: "s", token: "t", type: "indexData" })).resolves.toMatchObject({ code: "bad", error: "Nope", ok: false, status: 500 });

    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse(indexData({ heading: {} }))));
    await expect(worker.run({ apiBaseUrl: "https://doc.example.com", session: "s", token: "t", type: "indexData" })).resolves.toMatchObject({ code: "validation_error", ok: false });

    vi.stubGlobal("fetch", vi.fn(async () => jsonResponse(metadata)));
    await expect(worker.run({ apiBaseUrl: "https://doc.example.com", session: "s", token: "t", type: "indexData" })).resolves.toMatchObject({ code: "validation_error", error: "Missing required key: status", ok: false });
  });
});
